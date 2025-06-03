from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import re
import unicodedata
from difflib import SequenceMatcher
from collections import Counter
import os
import sys

app = Flask(__name__)
CORS(app)

# 현재 디렉토리 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, 'finally.db')

# 서버 상태 확인 엔드포인트
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # DB 연결 테스트
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
        
        return jsonify({
            "status": "ok",
            "message": "Python API 서버가 정상 작동 중입니다.",
            "version": "1.0.0",
            "db_path": db_path
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"서버 오류: {str(e)}",
            "db_path": db_path
        }), 500

class RestaurantMatcher:
    def __init__(self):
        self.stopwords = {'맛집', '음식점', '레스토랑', '카페', '치킨', '피자', '중국집', '한식당', '분식집', '술집'}
        
    def normalize_name(self, name):
        """상호명 정규화"""
        if not name:
            return ""
        
        # 한글 정규화
        name = unicodedata.normalize('NFKC', name)
        # 특수문자 제거 (한글, 영문, 숫자만 남김)
        name = re.sub(r'[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]', '', name)
        # 연속된 공백을 하나로 정리
        name = re.sub(r'\s+', ' ', name).strip()
        # 소문자 변환
        return name.lower()
    
    def extract_keywords(self, name):
        """핵심 키워드 추출"""
        normalized = self.normalize_name(name)
        words = normalized.split()
        # 불용어 제거 및 1글자 단어 제거
        keywords = [w for w in words if w not in self.stopwords and len(w) > 1]
        return keywords
    
    def calculate_similarity(self, name1, name2):
        """다중 유사도 계산"""
        if not name1 or not name2:
            return 0
            
        # 1. 전체 문자열 유사도
        norm1 = self.normalize_name(name1)
        norm2 = self.normalize_name(name2)
        full_similarity = SequenceMatcher(None, norm1, norm2).ratio()
        
        # 2. 키워드 기반 유사도
        keywords1 = set(self.extract_keywords(name1))
        keywords2 = set(self.extract_keywords(name2))
        
        if keywords1 and keywords2:
            keyword_similarity = len(keywords1 & keywords2) / len(keywords1 | keywords2)
        else:
            keyword_similarity = 0
        
        # 3. 첫 글자 일치 보너스
        first_char_bonus = 0.1 if norm1 and norm2 and norm1[0] == norm2[0] else 0
        
        # 4. 포함 관계 확인
        contain_bonus = 0
        if len(norm1) >= 2 and len(norm2) >= 2:
            if norm1 in norm2 or norm2 in norm1:
                contain_bonus = 0.3
        
        # 가중 평균 계산
        total_score = (full_similarity * 0.4 + 
                      keyword_similarity * 0.4 + 
                      first_char_bonus * 0.1 +
                      contain_bonus * 0.1)
        
        return min(total_score, 1.0)  # 최대값 1.0으로 제한
    
    def fuzzy_address_match(self, addr1, addr2):
        """주소 기반 지역 매칭"""
        if not addr1 or not addr2:
            return 0
            
        # 주소를 공백으로 분할
        addr1_parts = addr1.split()
        addr2_parts = addr2.split()
        
        # 구, 동 단위로 매칭
        for part1 in addr1_parts:
            for part2 in addr2_parts:
                if '구' in part1 and '구' in part2:
                    if part1 == part2:
                        return 0.8
                elif '동' in part1 and '동' in part2:
                    if part1 == part2:
                        return 0.6
                elif '시' in part1 and '시' in part2:
                    if part1 == part2:
                        return 0.4
        
        return 0.1

# 전역 매처 인스턴스
matcher = RestaurantMatcher()

def init_database():
    """데이터베이스 초기화 및 샘플 데이터 생성"""
    # 변경: test 디렉토리 내의 finally.db 사용
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, 'finally.db')
    
    # finally.db가 없으면 새로 생성
    if not os.path.exists(db_path):
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS restaurants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    address TEXT,
                    sns_mentions INTEGER DEFAULT 0,
                    rating_avg REAL DEFAULT 0.0,
                    review_count INTEGER DEFAULT 0,
                    tags TEXT,
                    description TEXT,
                    source TEXT DEFAULT 'instagram',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 샘플 데이터 확인
            cursor.execute("SELECT COUNT(*) FROM restaurants")
            count = cursor.fetchone()[0]
            
            if count == 0:
                # 샘플 데이터 삽입
                sample_restaurants = [
                    ('맛있는집', '서울특별시 강남구 역삼동', 150, 4.5, 89, '한식,맛집,유명', 'SNS에서 유명한 한식 맛집', 'instagram'),
                    ('피자스쿨', '서울특별시 서초구 서초동', 89, 4.2, 67, '피자,양식,데이트', '분위기 좋은 피자집', 'instagram'),
                    ('치킨마을', '서울특별시 송파구 잠실동', 234, 4.7, 123, '치킨,술집,모임', '바삭한 치킨이 유명', 'instagram'),
                    ('카페베네', '서울특별시 마포구 홍대입구', 67, 4.0, 45, '카페,디저트,분위기', '홍대 핫플레이스 카페', 'instagram'),
                    ('삼겹맛집', '서울특별시 영등포구 여의도동', 98, 4.3, 78, '고기,삼겹살,회식', '직장인들이 자주 찾는 고기집', 'instagram'),
                    ('라멘하우스', '서울특별시 중구 명동', 145, 4.6, 92, '일식,라멘,국물', '진짜 일본 라멘 맛', 'instagram'),
                    ('버거킹', '서울특별시 종로구 종로1가', 78, 4.1, 56, '햄버거,패스트푸드', '왕버거가 인기', 'instagram'),
                    ('스시야마다', '서울특별시 강서구 김포공항', 189, 4.8, 134, '초밥,일식,고급', '신선한 초밥 전문점', 'instagram')
                ]
                
                cursor.executemany('''
                    INSERT INTO restaurants (name, address, sns_mentions, rating_avg, review_count, tags, description, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', sample_restaurants)
                
                conn.commit()
                print(f"샘플 데이터 {len(sample_restaurants)}개 삽입 완료")

# 이전 '/health' 엔드포인트는 '/api/health'로 통합되었습니다.
# 이전 클라이언트 호환성을 위해 리디렉션 추가
@app.route('/health', methods=['GET'])
def legacy_health_check():
    """이전 버전 호환용 상태 확인"""
    return health_check()

@app.route('/smart-match', methods=['POST'])
def smart_match():
    """스마트 매칭 API"""
    try:
        data = request.json
        map_restaurants = data.get('mapRestaurants', [])
        search_area = data.get('searchArea', {})
        
        if not map_restaurants:
            return jsonify({
                'success': False,
                'error': '매칭할 맛집 데이터가 없습니다.'
            }), 400
        
        matched_restaurants = []
        # 변경: test 디렉토리 내의 finally.db 사용
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(current_dir, 'finally.db')
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # 크롤링 데이터 전체 조회
            cursor.execute("""
                SELECT id, name, address, sns_mentions, rating_avg, review_count, tags, description, source 
                FROM restaurants 
                ORDER BY sns_mentions DESC
            """)
            sns_restaurants = cursor.fetchall()
            
            print(f"매칭 시작: 지도 맛집 {len(map_restaurants)}개, SNS 데이터 {len(sns_restaurants)}개")
            
            for map_rest in map_restaurants:
                map_name = map_rest.get('place_name', '').strip()
                map_address = map_rest.get('address_name', '').strip()
                map_phone = map_rest.get('phone', '').strip()
                
                if not map_name:
                    continue
                
                best_match = None
                best_score = 0
                
                for sns_rest in sns_restaurants:
                    sns_id, sns_name, sns_address, sns_mentions, rating_avg, review_count, tags, description, source = sns_rest
                    
                    # 1. 상호명 직접 매칭
                    name_score = matcher.calculate_similarity(map_name, sns_name)
                    
                    # 2. 크롤링 콘텐츠에서 상호명 검색
                    content_score = 0
                    if description and map_name in description:
                        content_score = 0.7
                    
                    # 3. 지역 기반 매칭 (옵션)
                    region_score = 0
                    if map_address and sns_address:
                        region_score = matcher.fuzzy_address_match(map_address, sns_address)
                    
                    # 최종 점수 계산 (상호명이 가장 중요)
                    if name_score > 0.5:  # 상호명 기본 유사도가 있을 때만
                        final_score = name_score * 0.7 + region_score * 0.3
                    elif content_score > 0:  # 콘텐츠에서 발견된 경우
                        final_score = content_score * 0.8 + region_score * 0.2
                    else:
                        final_score = 0
                    
                    # 임계값 이상이고 현재 최고점이면 매칭
                    if final_score > 0.6 and final_score > best_score:
                        best_match = sns_rest
                        best_score = final_score
                
                # 매칭 성공시 결과에 추가
                if best_match:
                    sns_id, sns_name, sns_address, sns_mentions, rating_avg, review_count, tags, description, source = best_match
                    
                    matched_restaurants.append({
                        'map_info': map_rest,
                        'sns_info': {
                            'id': sns_id,
                            'name': sns_name,
                            'address': sns_address,
                            'sns_mentions': sns_mentions or 0,
                            'rating': rating_avg or 0,
                            'review_count': review_count or 0,
                            'tags': tags.split(',') if tags else [],
                            'description': description or '',
                            'source': source or 'instagram'
                        },
                        'match_score': round(best_score, 3),
                        'match_type': 'name_based' if best_score > 0.8 else 'fuzzy_match'
                    })
                    
                    print(f"매칭 성공: {map_name} -> {sns_name} (점수: {best_score:.3f})")
        
        # 매칭 점수 순으로 정렬
        matched_restaurants.sort(key=lambda x: x['match_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'matched_restaurants': matched_restaurants,
            'total_count': len(matched_restaurants),
            'stats': {
                'total_map_restaurants': len(map_restaurants),
                'matched_count': len(matched_restaurants),
                'match_rate': round((len(matched_restaurants) / len(map_restaurants)) * 100, 1) if map_restaurants else 0
            }
        })
        
    except Exception as e:
        print(f"매칭 오류: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'매칭 처리 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/restaurants', methods=['GET'])
def get_restaurants():
    """저장된 SNS 맛집 데이터 조회"""
    try:
        # 변경: test 디렉토리 내의 finally.db 사용
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(current_dir, 'finally.db')
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, address, sns_mentions, rating_avg, review_count, tags, description, source
                FROM restaurants 
                ORDER BY sns_mentions DESC
                LIMIT 50
            """)
            restaurants = cursor.fetchall()
            
            result = []
            for rest in restaurants:
                result.append({
                    'id': rest[0],
                    'name': rest[1],
                    'address': rest[2],
                    'sns_mentions': rest[3],
                    'rating': rest[4],
                    'review_count': rest[5],
                    'tags': rest[6].split(',') if rest[6] else [],
                    'description': rest[7],
                    'source': rest[8]
                })
            
            return jsonify({
                'success': True,
                'restaurants': result,
                'count': len(result)
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# SNS 맛집 조회 API
@app.route('/api/sns-restaurants', methods=['GET'])
def get_sns_restaurants():
    try:
        limit = request.args.get('limit', default=10, type=int)
        offset = request.args.get('offset', default=0, type=int)
        keyword = request.args.get('keyword', default='', type=str)
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 기본 쿼리
        query = """
            SELECT id, name, address, sns_mentions, rating, review_count, tags, description, source
            FROM sns_restaurants 
            WHERE 1=1
        """
        params = []
        
        # 키워드 검색 조건 추가
        if keyword:
            query += " AND (name LIKE ? OR address LIKE ? OR tags LIKE ?)"
            keyword_param = f"%{keyword}%"
            params.extend([keyword_param, keyword_param, keyword_param])
        
        # 정렬 및 페이징
        query += """
            ORDER BY sns_mentions DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        restaurants = cursor.fetchall()
        
        result = []
        for rest in restaurants:
            result.append({
                'id': rest[0],
                'name': rest[1],
                'address': rest[2],
                'sns_mentions': rest[3],
                'rating': rest[4],
                'review_count': rest[5],
                'tags': rest[6].split(',') if rest[6] else [],
                'description': rest[7],
                'source': rest[8]
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # 데이터베이스 초기화
    init_database()
    
    print("🚀 SNS 크롤링 API 서버 시작")
    print(f"📂 데이터베이스 경로: {db_path}")
    print("📍 접속 주소: http://localhost:5001")
    print("📊 Health Check: http://localhost:5001/api/health")
    print("🔍 API 사용법:")
    print("  - SNS 맛집 조회: http://localhost:5001/api/sns-restaurants")
    print("  - 맛집 매칭: http://localhost:5001/api/match-restaurants (POST)")
    
    try:
        app.run(host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        print(f"❌ 서버 실행 중 오류 발생: {str(e)}")
        sys.exit(1)
