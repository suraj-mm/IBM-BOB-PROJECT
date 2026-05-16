@echo off
REM Floating AI - Git Push Script for Windows
REM Run this after installing Git: https://git-scm.com/download/win

echo Initializing Floating AI repository...
git init

echo.
echo Configuring Git user...
set /p GIT_USER="Enter your Git username: "
set /p GIT_EMAIL="Enter your Git email: "

git config user.name "%GIT_USER%"
git config user.email "%GIT_EMAIL%"

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: Floating AI desktop assistant - Production-grade Electron+React overlay with real-time engineering alerts, merge-risk detection, and secure IPC architecture"

echo.
echo Adding remote origin...
git remote add origin https://github.com/suraj-mm/IBM-BOB-PROJECT.git

echo.
echo Setting default branch to main...
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ✓ Successfully pushed Floating AI to GitHub!
pause
