import asyncio
import re
from typing import List, Optional

import aiosqlite
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# --- 1. Pydantic 모델 정의 및 FastAPI 앱 설정 ---
class Place(BaseModel):
    id: str; place_name: str; category_name: str; phone: Optional[str] = None; address_name: str
    road_address_name: Optional[str] = ""; x: str; y: str; place_url: str; distance: Optional[str] = None

class SearchRequest(BaseModel):
    searchResults: List[Place]
    rankingPreference: str = 'balanced' 

class RankedPlace(Place):
    review_count: int; instagram_mentions: int; score: float

app = FastAPI()

# --- CORS 미들웨어 추가 ---
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

INSTA_DB_PATH = "finally.db"
REVIEW_DB_PATH = "restarant.db"

# --- 2. DB 조회 함수들 (최종 안정화 버전) ---
async def fetch_review_counts_from_db(places: List[Place]) -> dict:
    # ... (이전과 동일)
    print(f"리뷰 DB 조회 시작 (장소 개수: {len(places)})")
    review_map = {}
    if not places: return review_map
    TABLE_NAME, NAME_COL, ADDRESS_COL, REVIEW_COL = "mapinformation", "name", "address2", "reviewnum"
    try:
        async with aiosqlite.connect(REVIEW_DB_PATH) as db:
            tasks = []
            for place in places:
                cleaned_address = place.road_address_name
                if cleaned_address: cleaned_address = re.sub(r'\s+[A-Za-z0-9가-힣]+층$', '', cleaned_address).strip()
                query = f"SELECT {REVIEW_COL} FROM {TABLE_NAME} WHERE {NAME_COL} LIKE ? AND {ADDRESS_COL} LIKE ? LIMIT 1"
                params = (f"%{place.place_name}%", f"{cleaned_address}%")
                tasks.append(await db.execute(query, params))
            results = await asyncio.gather(*[task.fetchone() for task in tasks])
            for i, place in enumerate(places):
                if results[i] and results[i][0] is not None: review_map[place.id] = int(results[i][0])
        print(f"리뷰 DB 조회 완료. {len(review_map)}개 장소 매칭됨.")
        return review_map
    except Exception as e: print(f"리뷰 DB 조회 오류: {e}"); return {}

# ★★★★★ 이 함수가 리뷰DB와 동일한 주소 검색 로직으로 최종 수정되었습니다 ★★★★★
async def fetch_insta_mentions_from_db(places: List[Place]) -> dict:
    """[최종] 이름 길이에 따라 다른 전략(이름만 or 정제된 주소)으로 언급 수를 카운트합니다."""
    print(f"인스타 DB 조회 시작 (장소 개수: {len(places)})")
    mention_map = {p.id: 0 for p in places}
    if not places: return mention_map
    
    TABLE_NAME = "instagram_posts"
    CAPTION_COL = "caption_text"
    HASHTAG_COL = "hashtags_representation"

    try:
        async with aiosqlite.connect(INSTA_DB_PATH) as db:
            tasks = []
            for place in places:
                main_name = place.place_name.split()[0]
                
                unique_keywords = set()
                # --- 이름 길이에 따른 분기 ---
                if len(main_name) < 2:
                    # --- 1. 한 글자 이름: 정제된 도로명 주소로만 검색 ---
                    print(f"  > '{place.place_name}'은(는) 한 글자 이름. [정제된 도로명 주소]로만 검색합니다.")
                    cleaned_address = place.road_address_name
                    if cleaned_address:
                        cleaned_address = re.sub(r'\s+[A-Za-z0-9가-힣]+층$', '', cleaned_address).strip()
                        if cleaned_address: unique_keywords.add(cleaned_address)
                else:
                    # --- 2. 두 글자 이상 이름: 이름 키워드만으로 검색 ---
                    print(f"  > '{place.place_name}'은(는) 두 글자 이상 이름. [이름]만으로 검색합니다.")
                    unique_keywords.add(place.place_name)
                    unique_keywords.add(place.place_name.replace(" ", ""))
                    unique_keywords.add(main_name)
                
                unique_keywords = {kw for kw in unique_keywords if kw}
                print(f"    - 최종 검색어: {unique_keywords}")

                if not unique_keywords:
                    async def dummy_task(): return (0,)
                    tasks.append(dummy_task()); continue

                conditions, params = [], []
                for keyword in unique_keywords:
                    like_term, hashtag_term = f"%{keyword}%", f"%#{keyword}%"
                    conditions.extend([f"{CAPTION_COL} LIKE ?", f"{HASHTAG_COL} LIKE ?"])
                    if len(main_name) >= 2: # 이름으로 검색할 때만 #이름도 검색
                        conditions.append(f"{HASHTAG_COL} LIKE ?")
                        params.extend([like_term, like_term, hashtag_term])
                    else: # 주소로 검색할 땐 #주소는 거의 없으므로 제외
                        params.extend([like_term, like_term])
                
                query = f"SELECT COUNT(*) FROM {TABLE_NAME} WHERE {' OR '.join(conditions)}"
                tasks.append(await db.execute(query, params))

            results = await asyncio.gather(*[task.fetchone() for task in tasks])
            
            for i, place in enumerate(places):
                if results[i] and results[i][0] is not None:
                    mention_map[place.id] = int(results[i][0])

        print(f"인스타 DB 조회 완료. {sum(1 for v in mention_map.values() if v > 0)}개 장소 매칭됨.")
        return mention_map
    except Exception as e: print(f"인스타 DB 조회 오류: {e}"); return {p.id: 0 for p in places}

# --- 3. API 엔드포인트 및 핵심 로직 (이전과 동일) ---
@app.post("/api/restaurants/process-search", response_model=List[RankedPlace])
async def process_and_rank_restaurants(request: SearchRequest):
    search_results = request.searchResults
    ranking_preference = request.rankingPreference
    if not search_results: return []

    WEIGHT_PRESETS = {
        'distance':  {'distance': 0.45, 'reviews': 0.3, 'mentions': 0.25},
        'reviews':   {'distance': 0.2, 'reviews': 0.8, 'mentions': 0.0},
        'instagram': {'distance': 0.2, 'reviews': 0.0, 'mentions': 0.8},
        'balanced':  {'distance': 0.33, 'reviews': 0.34, 'mentions': 0.33}
    }
    weights = WEIGHT_PRESETS.get(ranking_preference, WEIGHT_PRESETS['balanced'])
    print(f"\n--- 가중치 프리셋 '{ranking_preference}'(으)로 랭킹을 계산합니다. (가중치: {weights}) ---")

    try:
        review_map, insta_map = await asyncio.gather(
            fetch_review_counts_from_db(search_results), 
            fetch_insta_mentions_from_db(search_results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 조회 중 심각한 오류 발생: {e}")

    enriched_places = []
    for place in search_results:
        enriched_data = place.model_dump()
        enriched_data['review_count'] = review_map.get(place.id, 0)
        enriched_data['instagram_mentions'] = insta_map.get(place.id, 0)
        enriched_data['distance'] = int(place.distance) if place.distance and place.distance.isdigit() else 99999
        enriched_places.append(enriched_data)
    
    if not enriched_places: return []
    max_dist = max(p['distance'] for p in enriched_places) or 1
    max_revs = max(p['review_count'] for p in enriched_places) or 1
    max_ment = max(p['instagram_mentions'] for p in enriched_places) or 1
    
    scored_places = []
    for p in enriched_places:
        norm_revs = (p['review_count'] / max_revs) if max_revs > 0 else 0
        norm_ment = (p['instagram_mentions'] / max_ment) if max_ment > 0 else 0
        norm_dist = (1 - (p['distance'] / max_dist)) if max_dist > 0 else 0
        score = norm_dist * weights['distance'] + norm_revs * weights['reviews'] + norm_ment * weights['mentions']
        p['distance'] = str(p['distance'])
        scored_places.append(RankedPlace(**p, score=score))
    
    ranked_list = sorted(scored_places, key=lambda p: p.score, reverse=True)
    return ranked_list[:45]

# 프론트엔드 요청을 위한 /recommend 엔드포인트 추가
class RecommendRequest(BaseModel):
    places: List[Place]
    ranking_preference: str = 'instagram'

class RecommendResponse(BaseModel):
    recommended_places: List[RankedPlace]

@app.post("/recommend", response_model=RecommendResponse)
async def recommend_places(request: RecommendRequest):
    """프론트엔드에서 사용하는 추천 엔드포인트"""
    # 기존 SearchRequest 형식으로 변환
    search_request = SearchRequest(
        searchResults=request.places,
        rankingPreference=request.ranking_preference
    )
    
    # 기존 추천 로직 재사용
    recommended_places = await process_and_rank_restaurants(search_request)
    
    return RecommendResponse(recommended_places=recommended_places)

# =======================================================
#  ★ 로컬 테스트 실행 블록 (가중치 테스트 포함) ★
# =======================================================
if __name__ == "__main__":
    base_test_data = {
      "searchResults": [
        {"id": "9", "place_name": "돈 고기집 하양역 본점", "category_name": "음식점", "phone": "", "address_name": "경북 경산시 하양읍 금락리 300-1", "road_address_name": "경북 경산시 하양읍 하양역길 13 돈 본점", "x": "", "y": "", "place_url": "", "distance": "400"},
        {"id": "3", "place_name": "손시스시 하양점", "category_name": "음식점", "phone": "", "address_name": "경북 경산시 하양읍 금락리 116-11", "road_address_name": "경북 경산시 하양읍 하양역길 8 손시스시 하양점", "x": "", "y": "", "place_url": "", "distance": "350"},
        {"id": "2384", "place_name": "몽짬뽕 경산점", "category_name": "음식점", "phone": "", "address_name": "경북 경산시 사동 588-1", "road_address_name": "경북 경산시 원효로42길 27-16 몽짬뽕", "x": "", "y": "", "place_url": "", "distance": "100"}
      ]
    }
    
    async def run_test(preference: str):
        test_data = base_test_data.copy()
        test_data['rankingPreference'] = preference
        request_body = SearchRequest(**test_data)
        ranked_list = await process_and_rank_restaurants(request=request_body)
        print(f"\n\n================ 최종 반환 결과 (우선순위: {preference}) ================")
        if not ranked_list: print("결과 없음")
        else:
            for i, place in enumerate(ranked_list): print(f"[{i+1}위] {place.model_dump()}")
        print("========================================================\n")

    asyncio.run(run_test('balanced'))
    asyncio.run(run_test('instagram'))
    asyncio.run(run_test('reviews'))