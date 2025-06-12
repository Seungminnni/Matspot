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
    """리뷰 데이터베이스에서 리뷰 수를 조회합니다. (개선된 매칭 전략)"""
    print(f"🔍 리뷰 DB 조회 시작 (장소 개수: {len(places)})")
    review_map = {}
    if not places: return review_map
    
    TABLE_NAME, NAME_COL, ADDRESS_COL, REVIEW_COL = "mapinformation", "name", "address2", "reviewnum"
    
    def normalize_place_name(name):
        """장소명을 정규화합니다"""
        # 다양한 변형 처리
        normalized = name
        normalized = normalized.replace("영대점", "영남대점")
        normalized = normalized.replace("경산영대", "경산영남대")
        normalized = normalized.replace("영남대학교", "영남대")
        return normalized
    
    def extract_core_name(name):
        """핵심 매장명만 추출합니다 (지점명 제거)"""
        # 지점명 패턴들 제거
        core = re.sub(r'\s*(영대점|영남대점|경산점|본점|신대점)\s*$', '', name)
        core = re.sub(r'\s*경산\s*', '', core)  # 경산 제거
        return core.strip()
    
    def extract_address_keywords(address):
        """주소에서 핵심 키워드들을 추출합니다"""
        if not address:
            return []
        # 주요 도로명, 건물명 등 추출
        keywords = []
        # 도로명 추출 (예: "청운로", "대학로59길")
        road_pattern = r'([가-힣]+(?:로|길)\d*[가-힣]*)'
        roads = re.findall(road_pattern, address)
        keywords.extend(roads)
        
        # 건물번호 추출 (예: "12-6", "280")
        number_pattern = r'(\d+(?:-\d+)?)'
        numbers = re.findall(number_pattern, address)
        keywords.extend(numbers)
        
        return keywords
    
    try:
        async with aiosqlite.connect(REVIEW_DB_PATH) as db:
            for place in places:
                cleaned_address = place.road_address_name
                if cleaned_address: 
                    cleaned_address = re.sub(r'\s+[A-Za-z0-9가-힣]+층$', '', cleaned_address).strip()
                
                original_name = place.place_name
                print(f"  📋 검색: '{original_name}' + '{cleaned_address}'")
                
                # 전략 1: 원본 이름 + 주소로 검색
                query = f"SELECT {REVIEW_COL} FROM {TABLE_NAME} WHERE {NAME_COL} LIKE ? AND {ADDRESS_COL} LIKE ? LIMIT 1"
                params = (f"%{original_name}%", f"%{cleaned_address}%")
                cursor = await db.execute(query, params)
                result = await cursor.fetchone()
                
                # 전략 2: 정규화된 이름 + 주소로 검색
                if not result:
                    normalized_name = normalize_place_name(original_name)
                    if normalized_name != original_name:
                        print(f"    🔄 정규화된 이름: '{normalized_name}'")
                        params = (f"%{normalized_name}%", f"%{cleaned_address}%")
                        cursor = await db.execute(query, params)
                        result = await cursor.fetchone()
                
                # 전략 3: 핵심 이름만 + 주소 키워드 매칭
                if not result:
                    core_name = extract_core_name(original_name)
                    address_keywords = extract_address_keywords(cleaned_address)
                    
                    if core_name and address_keywords:
                        print(f"    🔄 핵심 매칭: '{core_name}' + 주소키워드 {address_keywords}")
                        
                        # 주소 키워드 중 가장 구체적인 것으로 매칭
                        for keyword in address_keywords:
                            if len(keyword) >= 2:  # 너무 짧은 키워드는 제외
                                query = f"SELECT {REVIEW_COL} FROM {TABLE_NAME} WHERE {NAME_COL} LIKE ? AND {ADDRESS_COL} LIKE ? LIMIT 1"
                                params = (f"%{core_name}%", f"%{keyword}%")
                                cursor = await db.execute(query, params)
                                result = await cursor.fetchone()
                                if result:
                                    print(f"      ✅ 키워드 '{keyword}'로 매칭됨")
                                    break
                
                # 전략 4: 주소 기준 우선 매칭 (이름은 부분 매칭)
                if not result and cleaned_address:
                    address_keywords = extract_address_keywords(cleaned_address)
                    core_name = extract_core_name(original_name)
                    
                    # 가장 긴 주소 키워드로 먼저 매칭 시도
                    if address_keywords:
                        main_keyword = max(address_keywords, key=len)
                        if len(main_keyword) >= 3:
                            print(f"    🔄 주소 우선 매칭: 주소 '{main_keyword}' + 이름 부분매칭")
                            
                            # 주소가 정확히 매칭되는 곳에서 이름 유사도 검사
                            query = f"SELECT {NAME_COL}, {REVIEW_COL} FROM {TABLE_NAME} WHERE {ADDRESS_COL} LIKE ? AND {NAME_COL} LIKE ?"
                            params = (f"%{main_keyword}%", f"%{core_name[:3]}%")  # 이름 앞 3글자로 필터링
                            cursor = await db.execute(query, params)
                            candidates = await cursor.fetchall()
                            
                            if candidates:
                                # 가장 유사한 이름 선택
                                best_match = None
                                best_score = 0
                                
                                for candidate_name, review_count in candidates:
                                    # 간단한 유사도 계산 (공통 글자 수 / 전체 글자 수)
                                    common_chars = len(set(core_name) & set(candidate_name))
                                    similarity = common_chars / max(len(core_name), len(candidate_name))
                                    
                                    if similarity > best_score:
                                        best_score = similarity
                                        best_match = (candidate_name, review_count)
                                
                                if best_match and best_score > 0.3:  # 30% 이상 유사하면 매칭
                                    result = (best_match[1],)
                                    print(f"      ✅ 주소매칭 '{best_match[0]}' (유사도: {best_score:.2f})")
                
                # 결과 처리
                if result and result[0] is not None:
                    try:
                        review_count = int(result[0]) if str(result[0]).isdigit() else 0
                        review_map[place.id] = review_count
                        print(f"    ✅ 최종 매칭: {review_count}개 리뷰")
                    except (ValueError, TypeError) as e:
                        print(f"    ❌ 리뷰수 변환 실패: {result[0]} (오류: {e})")
                        review_map[place.id] = 0
                else:
                    print(f"    ❌ 모든 전략 실패")
                    
        print(f"🔍 리뷰 DB 조회 완료. {len(review_map)}개 장소 매칭됨.")
        return review_map
        
    except Exception as e: 
        print(f"❌ 리뷰 DB 조회 오류: {e}")
        return {}

async def fetch_insta_mentions_from_db(places: List[Place]) -> dict:
    """[개선] 인스타그램 언급 수를 더 정확하게 카운트합니다."""
    print(f"📸 인스타 DB 조회 시작 (장소 개수: {len(places)})")
    mention_map = {p.id: 0 for p in places}
    if not places: return mention_map
    
    TABLE_NAME = "instagram_posts"
    CAPTION_COL = "caption_text"
    HASHTAG_COL = "hashtags_representation"

    def normalize_place_name(name):
        """장소명을 정규화합니다 (리뷰 DB와 동일한 로직)"""
        normalized = name
        normalized = normalized.replace("영대점", "영남대점")
        normalized = normalized.replace("경산영대", "경산영남대")
        normalized = normalized.replace("영남대학교", "영남대")
        return normalized
    
    def extract_core_name(name):
        """핵심 매장명만 추출합니다 (지점명 제거)"""
        core = re.sub(r'\s*(영대점|영남대점|경산점|본점|신대점)\s*$', '', name)
        core = re.sub(r'\s*경산\s*', '', core)
        return core.strip()

    try:
        async with aiosqlite.connect(INSTA_DB_PATH) as db:
            for place in places:
                main_name = place.place_name.split()[0]
                unique_keywords = set()
                
                # 이름 길이에 따른 검색 전략
                if len(main_name) < 2:
                    print(f"  📋 '{place.place_name}' - 한 글자 이름, 주소로 검색")
                    cleaned_address = place.road_address_name
                    if cleaned_address:
                        cleaned_address = re.sub(r'\s+[A-Za-z0-9가-힣]+층$', '', cleaned_address).strip()
                        if cleaned_address: 
                            unique_keywords.add(cleaned_address)
                else:
                    print(f"  📋 '{place.place_name}' - 두 글자 이상, 이름으로 검색")
                    
                    # 원본 이름들 추가
                    original_name = place.place_name
                    unique_keywords.add(original_name)
                    unique_keywords.add(original_name.replace(" ", ""))
                    unique_keywords.add(main_name)
                    
                    # 정규화된 이름들 추가 (영대점 -> 영남대점 등)
                    normalized_name = normalize_place_name(original_name)
                    if normalized_name != original_name:
                        print(f"    🔄 정규화된 이름 추가: '{normalized_name}'")
                        unique_keywords.add(normalized_name)
                        unique_keywords.add(normalized_name.replace(" ", ""))
                    
                    # 핵심 이름 추가 (지점명 제거)
                    core_name = extract_core_name(original_name)
                    if core_name and core_name != original_name:
                        print(f"    🔄 핵심 이름 추가: '{core_name}'")
                        unique_keywords.add(core_name)
                
                unique_keywords = {kw for kw in unique_keywords if kw and len(kw) >= 2}
                print(f"    🔍 검색 키워드: {unique_keywords}")

                if not unique_keywords:
                    print(f"    ❌ 검색 키워드 없음")
                    continue

                # 각 키워드별로 개별 검색하여 총합 계산 (중복 제거)
                total_mentions = 0
                found_posts = set()  # 중복 제거를 위한 포스트 ID 저장
                
                for keyword in unique_keywords:
                    # 캡션에서 검색
                    caption_query = f"SELECT id FROM {TABLE_NAME} WHERE {CAPTION_COL} LIKE ?"
                    cursor = await db.execute(caption_query, (f"%{keyword}%",))
                    caption_posts = await cursor.fetchall()
                    caption_count = len(caption_posts)
                    
                    # 해시태그에서 검색 (이름인 경우만)
                    hashtag_count = 0
                    hashtag_posts = []
                    if len(main_name) >= 2:
                        hashtag_query = f"SELECT id FROM {TABLE_NAME} WHERE {HASHTAG_COL} LIKE ?"
                        cursor = await db.execute(hashtag_query, (f"%#{keyword}%",))
                        hashtag_posts = await cursor.fetchall()
                        hashtag_count = len(hashtag_posts)
                    
                    # 중복 제거하여 포스트 ID 추가
                    for post in caption_posts:
                        found_posts.add(post[0])
                    for post in hashtag_posts:
                        found_posts.add(post[0])
                    
                    keyword_total = caption_count + hashtag_count
                    print(f"      '{keyword}': 캡션 {caption_count} + 해시태그 {hashtag_count} = {keyword_total}")

                # 중복 제거된 총 언급 수
                total_mentions = len(found_posts)
                mention_map[place.id] = total_mentions
                print(f"    ✅ 총 언급 수 (중복제거): {total_mentions}")

        matched_count = sum(1 for v in mention_map.values() if v > 0)
        print(f"📸 인스타 DB 조회 완료. {matched_count}개 장소 매칭됨.")
        return mention_map
        
    except Exception as e: 
        print(f"❌ 인스타 DB 조회 오류: {e}")
        return {p.id: 0 for p in places}

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
        'balanced':  {'distance': 0.25, 'reviews': 0.375, 'mentions': 0.375}
    }
    weights = WEIGHT_PRESETS.get(ranking_preference, WEIGHT_PRESETS['balanced'])
    print(f"\n--- 가중치 프리셋 '{ranking_preference}'(으)로 랭킹을 계산합니다. (가중치: {weights}) ---")

    try:
        review_map, insta_map = await asyncio.gather(
            fetch_review_counts_from_db(search_results), 
            fetch_insta_mentions_from_db(search_results)        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 조회 중 심각한 오류 발생: {e}")

    enriched_places = []
    print("\n📊 데이터 통합 시작:")
    for place in search_results:
        enriched_data = place.model_dump()
        review_count = review_map.get(place.id, 0)
        insta_mentions = insta_map.get(place.id, 0)
        
        enriched_data['review_count'] = review_count
        enriched_data['instagram_mentions'] = insta_mentions
        enriched_data['distance'] = int(place.distance) if place.distance and place.distance.isdigit() else 99999
        
        print(f"  🏪 {place.place_name}: 리뷰 {review_count}, 인스타 {insta_mentions}, 거리 {enriched_data['distance']}m")
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
#  ★ 서버 실행 블록 ★
# =======================================================
if __name__ == "__main__":
    import uvicorn
    print("FastAPI 추천 백엔드 서버 시작 중...")
    print("서버 주소: http://localhost:8000")
    print("API 문서: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)