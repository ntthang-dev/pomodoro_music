@echo off
color 0B
echo ========================================================
echo        POMODORO ^& OFFLINE PLAYER - AUTO BUILDER
echo ========================================================
echo.

:: 1. Kiểm tra xem máy đã cài Node.js chưa
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [!] KHOAN DA! May tinh cua ban chua cai dat Node.js.
    echo [i] Vui long tai va cai dat Node.js tai day: https://nodejs.org/
    echo [i] Bam phim bat ky de mo trang web tai Node.js...
    pause >nul
    start https://nodejs.org/
    exit /b
)
echo [OK] Node.js da duoc cai dat.

:: 2. Cài đặt các gói thư viện cần thiết
echo.
echo [*] Dang tai va cai dat cac thu vien can thiet (co the mat vai phut)...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo [X] Co loi xay ra khi cai dat thu vien. Vui long kiem tra ket noi mang!
    pause
    exit /b
)
echo [OK] Cai dat thu vien thanh cong.

:: 3. Build ứng dụng thành file .exe
echo.
echo [*] Dang dong goi ung dung thanh file .exe...
call npm run build
IF %ERRORLEVEL% NEQ 0 (
    echo [X] Co loi xay ra khi dong goi ung dung!
    pause
    exit /b
)

:: 4. Hoàn thành
echo.
echo ========================================================
echo [OK] XUAT FILE THANH CONG!
echo ========================================================
echo Ung dung cua ban da duoc dong goi vao thu muc "release".
echo File cai dat (Setup) se nam trong do.
echo.
echo Dang mo thu muc release...
start explorer "%~dp0release"
pause
