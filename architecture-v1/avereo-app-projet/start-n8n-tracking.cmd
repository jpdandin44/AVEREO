@echo off
setlocal
cd /d "%~dp0frontend"
call npm.cmd run dev:review -- --chantier "%~dp0chantiers\n8n-deployment" --port 5192
endlocal
