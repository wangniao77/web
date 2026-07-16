@echo off
chcp 65001 >nul
set "FRONTEND=%~dp0frontend"

echo ========================================
echo   【Git开发版】Mock 数据，在此改代码
echo   端口: 5174  |  改完 commit + push
echo   目录: %~dp0
echo ========================================

curl.exe -s -o NUL -w "%%{http_code}" http://127.0.0.1:5174/ 2>nul | findstr /r "^200$" >nul
if %errorlevel% neq 0 (
    start "开发版-5174" cmd /k "cd /d "%FRONTEND%" && npm run dev -- --host 127.0.0.1 --port 5174"
    set /a RETRY=0
    :wait
    timeout /t 1 /nobreak >nul
    curl.exe -s -o NUL -w "%%{http_code}" http://127.0.0.1:5174/ 2>nul | findstr /r "^200$" >nul
    if %errorlevel%==0 goto :open
    set /a RETRY+=1
    if %RETRY% lss 30 goto :wait
    echo 启动超时，请查看 "开发版-5174" 窗口
    pause
    exit /b 1
)

:open
start http://127.0.0.1:5174/college
echo 已打开: http://127.0.0.1:5174/college
echo.
echo 提交代码:
echo   cd %~dp0
echo   git add . ^&^& git commit -m "你的说明" ^&^& git push origin frontend
