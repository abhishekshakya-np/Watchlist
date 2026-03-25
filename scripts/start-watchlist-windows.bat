@echo off
setlocal
cd /d "%~dp0.."

rem Explorer / shortcuts often start with a short PATH — add usual Node install dirs
set "PATH=%PATH%;%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%LocalAppData%\Programs\nodejs"

where node >nul 2>&1 || (
  echo Node.js was not found. Install from https://nodejs.org/ or add Node to your user PATH, then try again.
  pause
  exit /b 1
)
where npm >nul 2>&1 || (
  echo npm was not found. Reinstall Node.js from https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing root dependencies...
  call npm install
)
if not exist "server\node_modules\" (
  echo Installing server dependencies...
  pushd server
  call npm install
  popd
)
if not exist "client\node_modules\" (
  echo Installing client dependencies...
  pushd client
  call npm install
  popd
)

echo.
echo If port 3001 is already in use, the old process will be stopped so this copy can start.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0free-port-3001.ps1"

echo.
echo Watchlist: http://localhost:3001
echo The browser will open when the server answers. Close this window to stop the server.
echo.

start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File "%~dp0open-watchlist-when-ready.ps1"

call npm run dev
echo.
echo Server exited.
pause
