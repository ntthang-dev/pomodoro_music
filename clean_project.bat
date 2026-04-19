@echo off
color 0A
echo ========================================================
echo        POMODORO ^& OFFLINE PLAYER - CLEANUP TOOL
echo ========================================================
echo.
echo Cong cu nay se xoa cac thu muc nang (node_modules, dist, release)
echo de project nhe nhat co the, giup ban de dang day len Github hoac gui file.
echo Sau khi xoa, ban se phai chay lai "npm install" hoac dung file build_app.bat de chay lai app.
echo.
pause

echo.
echo [*] Dang xoa thu muc node_modules... (Rat nang)
IF EXIST "node_modules" rmdir /s /q "node_modules"

echo [*] Dang xoa thu muc dist...
IF EXIST "dist" rmdir /s /q "dist"

echo [*] Dang xoa thu muc release... (File .exe da build)
IF EXIST "release" rmdir /s /q "release"

echo.
echo ========================================================
echo [OK] DA DON DEP XONG! PROJECT BAY GIO RAT NHE!
echo ========================================================
pause
