"""
인스타그램 크롤러 실행 방법 안내

이 문서는 자동 이메일 인증 기능이 포함된 인스타그램 크롤러의 설정 및 실행 방법을 설명합니다.

== 준비 사항 ==

1. Python 3.7 이상 설치
2. Chrome 브라우저 설치
3. 필요한 Python 패키지 설치:
   ```
   pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib selenium webdriver-manager sqlalchemy
   ```
4. Gmail API 설정 (GMAIL_API_SETUP.md 파일 참조)
   - credentials.json 파일 준비

== 실행 전 설정 ==

1. instagram_crawler_with_gmail_auth.py 파일 열기
2. 다음 정보 설정:
   - INSTAGRAM_USERNAME: 인스타그램에 연결된 Gmail 주소
   - INSTAGRAM_PASSWORD: 인스타그램 로그인 비밀번호
   - 크롤링할 해시태그 목록 설정 (hashtags 변수)
   - MIN_LIKES: 좋아요 기준 수 (기본값: 500)

== 실행 방법 ==

1. 명령 프롬프트(cmd) 또는 터미널 열기
2. 프로젝트 디렉토리로 이동
3. 다음 명령어 실행:
   ```
   python instagram_crawler_with_gmail_auth.py
   ```

4. 처음 실행 시:
   - 브라우저가 열리고 Gmail API 인증 진행
   - 해당 Gmail 계정으로 로그인하여 권한 허용
   - 인증 후 자동으로 크롤링 시작

== 동작 방식 ==

1. Gmail API를 통해 계정 인증
2. Selenium을 사용하여 Chrome 브라우저 제어
3. 인스타그램 자동 로그인
4. 이메일 인증 코드 자동 확인 및 입력
5. 지정된 해시태그 검색
6. 게시물 URL 수집
7. 각 게시물 방문하여 좋아요 수 확인
8. 좋아요 수가 MIN_LIKES 이상인 게시물만 상세 정보 수집
9. 추출한 데이터는 SQLite 데이터베이스에 저장

== 데이터 확인 ==

크롤링된 데이터는 다음 위치에 저장됩니다:
- SQLite DB 파일: instagram_posts.db
- 또는 CSV 파일 (데이터베이스 연결 실패 시)

SQLite DB 파일은 DB Browser for SQLite와 같은 도구로 열어볼 수 있습니다.

== 문제 해결 ==

1. 로그인 실패 시:
   - 아이디/비밀번호 확인
   - 계정에 2단계 인증이 활성화되어 있는지 확인

2. 인증 코드를 찾지 못하는 경우:
   - Gmail 계정에서 인스타그램 메일이 스팸으로 처리되지 않았는지 확인
   - 코드 추출 패턴이 최신 인스타그램 이메일 형식과 일치하는지 확인

3. 크롬드라이버 오류:
   - Chrome 브라우저 업데이트
   - webdriver-manager 패키지 업데이트: pip install -U webdriver-manager
"""
