@echo off
setlocal
cd /d "%~dp0frontend"
call npm.cmd run dev -- --open
if errorlevel 1 pause
