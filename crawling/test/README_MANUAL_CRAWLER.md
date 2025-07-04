# 인스타그램 크롤러 (수동 인증 버전) 설명서

## 개요
이 프로그램은 인스타그램의 해시태그를 검색하여 좋아요 수가 일정 기준(기본값 500개) 이상인 게시물만을 수집하는 크롤러입니다. 
이메일 자동 인증 대신, 사용자가 직접 인증 과정을 진행할 수 있도록 일정 시간을 대기하는 방식으로 작동합니다.

## 주요 기능
1. 인스타그램 로그인 자동화 (인증 단계만 수동)
2. 해시태그 검색을 통한 게시물 URL 수집
3. 좋아요 500개 이상 게시물 필터링
4. 게시물 상세 정보(텍스트, 작성자, 날짜, 좋아요 수) 추출
5. 추출 데이터 SQLite DB 또는 CSV 파일 저장

## 설치 방법

### 1. 필요한 패키지 설치
```
pip install selenium webdriver-manager sqlalchemy
```

### 2. 크롬 브라우저 설치
프로그램이 작동하려면 Chrome 브라우저가 필요합니다.

## 사용 방법

### 1. 스크립트 실행
```
python instagram_crawler_manual_auth.py
```

### 2. 설정 입력
실행 시 다음 정보를 입력합니다:
- 인스타그램 아이디
- 인스타그램 비밀번호
- 인증 대기 시간(초): 로그인 후 인증 과정을 수동으로 완료하는 데 필요한 시간
- 크롤링할 해시태그: 쉼표로 구분하여 여러 개 입력 가능
- 최소 좋아요 수: 이 수 이상의 좋아요를 가진 게시물만 수집

### 3. 인증 절차
- 브라우저가 열리고 자동으로 로그인 시도
- 2단계 인증이나 보안 확인이 필요한 경우 수동으로 진행 (설정한 대기 시간 동안)
- 로그인이 완료되면 크롤링 자동 시작

### 4. 데이터 확인
- 수집된 데이터는 SQLite 데이터베이스(instagram_posts.db)에 저장
- 데이터베이스 모델을 불러올 수 없는 경우 CSV 파일로 저장

## 커스터마이징

### 코드에서 직접 변경 가능한 설정:
- `MIN_LIKES`: 최소 좋아요 수 (기본값 500)
- `MAX_POSTS_TO_CRAWL`: 해시태그당 최대 크롤링 게시물 수 (기본값 30)
- `DEFAULT_SCROLL_COUNT`: 페이지 스크롤 횟수 (기본값 5)
- `CHROMEDRIVER_PATH`: 크롬 드라이버 경로 (자동 다운로드 사용 시 필요 없음)

## 주의사항
1. 과도한 크롤링은 인스타그램 계정 제한을 받을 수 있습니다.
2. 크롤링한 데이터를 상업적으로 사용할 때는 Instagram의 이용약관을 확인하세요.
3. 인스타그램 UI가 변경되면 크롤러의 선택자를 업데이트해야 할 수 있습니다.

## 문제 해결
1. **크롬 드라이버 오류**: `CHROMEDRIVER_PATH`를 직접 설정하거나, webdriver-manager를 업데이트하세요.
   ```
   pip install -U webdriver-manager
   ```

2. **로그인 실패**: 대기 시간을 늘려보거나 계정 정보를 확인하세요.

3. **좋아요 수를 찾지 못함**: 인스타그램 UI가 변경되었을 가능성이 있습니다. 크롤러 코드의 선택자 부분을 업데이트하세요.
