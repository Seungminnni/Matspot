# filepath: c:\Users\a\Desktop\programming language\test\README.md
# Instagram Crawler 개선 프로젝트

## 개요
이 프로젝트는 Instagram에서 해시태그 기반으로 게시물을 크롤링하는 파이썬 스크립트입니다. 기존의 크롤러를 개선하여 다음 두 가지 주요 기능을 추가했습니다:
1. 로그인 인식 문제 해결 - 로그인 과정을 더 안정적으로 개선
2. 좋아요 수 기반 필터링 - 좋아요 500개 이상인 게시물만 수집

## 파일 구조
- `crawler.py` - 원본 크롤러
- `crawler_improved.py` - 개선된 크롤러
- `model.py` - 원본 데이터베이스 모델
- `model_improved.py` - 좋아요 수 저장을 위한 개선된 모델
- `test_crawler.py` - 크롤러 테스트 스크립트

## 주요 개선 사항

### 1. 로그인 인식 개선
- 로그인 대기 시간을 3분에서 5분으로 증가
- 로그인 성공 확인 로직 단순화
- 현재 URL 기반 로그인 상태 확인 방식 개선

### 2. 좋아요 수 기반 필터링
- `get_likes_count()` 함수 추가: 게시물의 좋아요 수를 다양한 선택자와 정규식을 통해 추출
- `MIN_LIKES` 상수 설정: 500개 이상의 좋아요를 가진 게시물만 크롤링
- 좋아요 수 저장을 위해 데이터베이스 모델 확장 (`likes_count` 필드 추가)

### 3. 기타 개선 사항
- 여러 CSS 선택자 옵션을 사용하여 Instagram UI 변경에 더 강건하게 대응
- 다양한 단위(K, M, 만, 천 등)의 좋아요 수 파싱 로직 추가
- 상세한 로깅 기능 추가
- 크롤링 효율성 향상을 위한 WebDriver 옵션 최적화

## 사용 방법
1. 개선된 모델 적용: `model_improved.py` 실행하여 DB 스키마 업데이트
2. 크롤러 실행: `crawler_improved.py` 실행
   ```
   python crawler_improved.py
   ```
3. 테스트 실행: `test_crawler.py` 실행하여 다양한 해시태그로 테스트
   ```
   python test_crawler.py
   ```

## 설정
- `MIN_LIKES = 500`: 최소 좋아요 수 설정 (crawler_improved.py 파일에서 변경 가능)
- `MAX_POSTS_TO_CRAWL = 20`: 크롤링할 최대 게시물 수 (필요시 조정 가능)
