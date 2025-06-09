@echo off
echo Matspot 전체 서버 실행 스크립트
echo =================================

echo 1. 백엔드 서버 시작...
start cmd /k "cd /d C:\Users\seungmin\Desktop\Matspot\server && node server.js"

echo 2. 크롤링 API 서버 시작...
start cmd /k "cd /d C:\Users\seungmin\Desktop\Matspot\crawling\test && python crawling_api.py"

echo 3. 프론트엔드 시작...
start cmd /k "cd /d C:\Users\seungmin\Desktop\Matspot && npm start"

echo 모든 서비스가 시작되었습니다.
echo 브라우저에서 http://localhost:3000 접속해 주세요.
echo 백엔드 API: http://localhost:5000
echo 크롤링 API: http://localhost:5001
