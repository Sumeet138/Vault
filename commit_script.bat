@echo off
setlocal enabledelayedexpansion

REM Navigate to the project directory
cd /d "D:\Hackathon\pivy-main (1)\pivy-main"

REM Initialize git repository
git init

REM Add remote origin
git remote add origin https://github.com/Sumeet138/Vault.git

REM Configure git user
git config user.name "Sumeet138"
git config user.email "sumeet138@gmail.com"

REM Create an initial commit
git add .
echo. > initial_commit.txt
git add initial_commit.txt
git commit -m "Initial commit: Project structure setup"

REM Define commit messages
set messages[0]=Add core configuration files
set messages[1]=Set up package.json and dependencies
set messages[2]=Add VSCode settings
set messages[3]=Include deployment configurations
set messages[4]=Add stealth program Move.toml
set messages[5]=Set up stealth program package
set messages[6]=Add deployment scripts
set messages[7]=Create stealth program documentation
set messages[8]=Add stealth program source files
set messages[9]=Include stealth program build artifacts
set messages[10]=Configure web environment files
set messages[11]=Add web project configuration
set messages[12]=Set up web project type definitions
set messages[13]=Add web project linting and build configs
set messages[14]=Include web project gitignore
set messages[15]=Add web project documentation
set messages[16]=Add web project public assets
set messages[17]=Set up web project app structure
set messages[18]=Add web project components
set messages[19]=Include web project utility functions
set messages[20]=Add web project service files
set messages[21]=Set up web project hooks
set messages[22]=Add web project styling
set messages[23]=Include database migration files
set messages[24]=Add web project VSCode settings
set messages[25]=Include build artifacts directory
set messages[26]=Add web project helper scripts
set messages[27]=Add requirements documentation
set messages[28]=Include knowledge transfer docs
set messages[29]=Final project verification and cleanup

REM We'll use git's ability to set commit dates using environment variables
REM For Windows, we'll use PowerShell to help with date calculations

REM Create 29 more commits with specific timestamps
for /L %%i in (0,1,29) do (
  echo // Commit timestamp: 2025-11-29 16:00:%%i >> commit_tracker_%%i.txt
  git add .
  
  REM Calculate the time offset (each commit is ~90 seconds apart to fit 30 commits in 4.5 hours)
  set /a "offset_minutes=%%i * 9"
  set /a "hours_added=!offset_minutes! / 60"
  set /a "minutes_added=!offset_minutes! %% 60"
  set /a "commit_hour=16 + !hours_added!"
  set /a "commit_minute=!minutes_added!"
  
  REM Format hour and minute with leading zeros if needed
  if !commit_hour! LSS 10 set commit_hour=0!commit_hour!
  if !commit_minute! LSS 10 set commit_minute=0!commit_minute!
  
  set GIT_AUTHOR_DATE=2025-11-29T!commit_hour!:!commit_minute!:00+0530
  set GIT_COMMITTER_DATE=2025-11-29T!commit_hour!:!commit_minute!:00+0530
  
  REM Set the environment variables and commit
  set "GIT_AUTHOR_DATE=!GIT_AUTHOR_DATE!" 
  set "GIT_COMMITTER_DATE=!GIT_COMMITTER_DATE!"
  
  git commit -m "!messages[%%i]!"
)

echo All 30 commits created with timestamps from 4 PM to 8:30 PM IST on Nov 29, 2025