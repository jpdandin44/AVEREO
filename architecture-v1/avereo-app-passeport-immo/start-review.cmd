@echo off
setlocal
cd /d "%~dp0..\avereo-app-projet\frontend"
call npm.cmd run dev:review -- --chantier "..\..\avereo-app-passeport-immo\docs" --port 5193
if errorlevel 1 pause
