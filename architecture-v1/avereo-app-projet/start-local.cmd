@echo off
setlocal
cd /d "%~dp0frontend"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est requis. Voir README.md.
  pause
  exit /b 1
)
if not exist "node_modules\vite\package.json" (
  echo Dependances absentes. Executer npm.cmd ci dans frontend puis relancer.
  pause
  exit /b 1
)
echo Ouvrir http://127.0.0.1:5190/ dans le navigateur.
echo Conserver cette fenetre ouverte. Ctrl+C pour arreter.
call npm.cmd run dev:review -- %*
if errorlevel 1 pause
