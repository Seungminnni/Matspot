@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo Matspot 전체 서버 실행 스크립트 (오류 자동 감지 기능)
echo ===================================================

REM 필요한 폴더 경로 설정
set WORKSPACE=C:\Users\seungmin\Desktop\Matspot
set SERVER_DIR=%WORKSPACE%\server
set CRAWLING_DIR=%WORKSPACE%\crawling\test
set FRONTEND_DIR=%WORKSPACE%

REM 포트 설정
set BACKEND_PORT=5000
set CRAWLING_PORT=5001
set FRONTEND_PORT=3000

REM 서버 상태 확인용 변수
set BACKEND_RUNNING=0
set CRAWLING_RUNNING=0
set FRONTEND_RUNNING=0

REM 터미널 색상 설정
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set MAGENTA=[95m
set CYAN=[96m
set RESET=[0m

echo %CYAN%[정보]%RESET% 서버 실행 전 상태 확인 중...

REM 기존 서버 프로세스 확인 및 종료
call :check_and_kill_process node.exe %BACKEND_PORT%
call :check_and_kill_process python.exe %CRAWLING_PORT%
call :check_and_kill_process node.exe %FRONTEND_PORT%

:start_servers
echo.
echo %CYAN%[정보]%RESET% 모든 서버 시작합니다...
echo.

REM 백엔드 서버 시작
echo %YELLOW%[시작]%RESET% 백엔드 서버 시작 중...
start "Matspot Backend" cmd /c "cd /d %SERVER_DIR% && echo 백엔드 서버 시작 - 포트 %BACKEND_PORT% && node server.js"
timeout /t 3 > nul
call :check_server_status "http://localhost:%BACKEND_PORT%/api/auth/status" "백엔드"
echo.

REM 크롤링 API 서버 시작
echo %YELLOW%[시작]%RESET% Python 크롤링 API 서버 시작 중...
start "Matspot Crawling API" cmd /c "cd /d %CRAWLING_DIR% && echo Python API 서버 시작 - 포트 %CRAWLING_PORT% && python crawling_api.py"
timeout /t 3 > nul
call :check_server_status "http://localhost:%CRAWLING_PORT%/api/health" "크롤링 API"
echo.

REM 프론트엔드 시작
echo %YELLOW%[시작]%RESET% 프론트엔드 시작 중...
start "Matspot Frontend" cmd /c "cd /d %FRONTEND_DIR% && echo 프론트엔드 시작 - 포트 %FRONTEND_PORT% && npm start"
timeout /t 5 > nul
call :check_server_status "http://localhost:%FRONTEND_PORT%" "프론트엔드"
echo.

REM 최종 상태 요약
echo.
echo %CYAN%[정보]%RESET% 서버 상태 요약:
if %BACKEND_RUNNING%==1 (
    echo %GREEN%[정상]%RESET% 백엔드 서버: http://localhost:%BACKEND_PORT%
) else (
    echo %RED%[실패]%RESET% 백엔드 서버: 실행 중이 아닙니다
)

if %CRAWLING_RUNNING%==1 (
    echo %GREEN%[정상]%RESET% 크롤링 API: http://localhost:%CRAWLING_PORT%
) else (
    echo %RED%[실패]%RESET% 크롤링 API: 실행 중이 아닙니다
)

if %FRONTEND_RUNNING%==1 (
    echo %GREEN%[정상]%RESET% 프론트엔드: http://localhost:%FRONTEND_PORT%
) else (
    echo %RED%[실패]%RESET% 프론트엔드: 실행 중이 아닙니다
)

echo.
echo %CYAN%[정보]%RESET% 브라우저에서 http://localhost:%FRONTEND_PORT% 접속해 주세요
echo %CYAN%[정보]%RESET% 종료하려면 이 창을 닫으세요
echo.

REM 모니터링 모드
echo %CYAN%[정보]%RESET% 서버 상태 모니터링 모드로 전환합니다...
echo %CYAN%[정보]%RESET% 10초마다 서버 상태를 확인합니다...
echo.

:monitor_loop
timeout /t 10 > nul
call :check_server_status "http://localhost:%BACKEND_PORT%/api/auth/status" "백엔드" quiet
call :check_server_status "http://localhost:%CRAWLING_PORT%/api/health" "크롤링 API" quiet
call :check_server_status "http://localhost:%FRONTEND_PORT%" "프론트엔드" quiet

REM 모든 서버가 정상인지 확인
if %BACKEND_RUNNING%==0 (
    echo %RED%[경고]%RESET% 백엔드 서버가 응답하지 않습니다. 재시작합니다...
    start "Matspot Backend" cmd /c "cd /d %SERVER_DIR% && echo 백엔드 서버 재시작 - 포트 %BACKEND_PORT% && node server.js"
)

if %CRAWLING_RUNNING%==0 (
    echo %RED%[경고]%RESET% 크롤링 API 서버가 응답하지 않습니다. 재시작합니다...
    start "Matspot Crawling API" cmd /c "cd /d %CRAWLING_DIR% && echo 크롤링 API 서버 재시작 - 포트 %CRAWLING_PORT% && python crawling_api.py"
)

if %FRONTEND_RUNNING%==0 (
    echo %RED%[경고]%RESET% 프론트엔드가 응답하지 않습니다. 재시작합니다...
    start "Matspot Frontend" cmd /c "cd /d %FRONTEND_DIR% && echo 프론트엔드 재시작 - 포트 %FRONTEND_PORT% && npm start"
)

goto monitor_loop

REM ===== 함수 정의 =====

:check_server_status
REM 서버 상태 확인 함수: URL, 서버명, [quiet 모드]
set URL=%~1
set SERVER_NAME=%~2
set QUIET_MODE=%~3

REM PowerShell을 사용하여 서버 상태 확인
PowerShell -Command "try { $response = Invoke-WebRequest -Uri '%URL%' -TimeoutSec 2 -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"

if %ERRORLEVEL% equ 0 (
    if not "%QUIET_MODE%"=="quiet" (
        echo %GREEN%[성공]%RESET% %SERVER_NAME% 서버가 정상적으로 실행 중입니다.
    )
    if "%SERVER_NAME%"=="백엔드" set BACKEND_RUNNING=1
    if "%SERVER_NAME%"=="크롤링 API" set CRAWLING_RUNNING=1
    if "%SERVER_NAME%"=="프론트엔드" set FRONTEND_RUNNING=1
) else (
    if not "%QUIET_MODE%"=="quiet" (
        echo %RED%[실패]%RESET% %SERVER_NAME% 서버가 응답하지 않습니다.
    )
    if "%SERVER_NAME%"=="백엔드" set BACKEND_RUNNING=0
    if "%SERVER_NAME%"=="크롤링 API" set CRAWLING_RUNNING=0
    if "%SERVER_NAME%"=="프론트엔드" set FRONTEND_RUNNING=0
)
exit /b

:check_and_kill_process
REM 프로세스 확인 및 종료 함수: 프로세스명, 포트
set PROCESS_NAME=%~1
set PORT=%~2

PowerShell -Command "Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -like '*%PROCESS_NAME%*' } } | ForEach-Object { Write-Host '%YELLOW%[정보]%RESET% 포트 %PORT%를 사용 중인 %PROCESS_NAME% 프로세스 종료: ' $_.Id; Stop-Process -Id $_.Id -Force }"
timeout /t 1 > nul
exit /b

endlocal
