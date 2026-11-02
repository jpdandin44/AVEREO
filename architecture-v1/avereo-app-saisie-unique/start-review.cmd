@echo off
setlocal
cd /d "%~dp0..\avereo-app-projet\frontend"
call npm.cmd run dev:review -- --chantier "..\..\avereo-app-saisie-unique\docs" --port 5191
if errorlevel 1 pause
