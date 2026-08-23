@echo off
chcp 65001 >nul
title ការ Deploy ទៅកាន់ GitHub Pages
cls
echo ================================================================
echo    កម្មវិធីជំនួយការ Deploy ប្រព័ន្ធជំរឿនទៅកាន់ GitHub Pages
echo ================================================================
echo.
echo សូមប្រាកដថាអ្នកបានបង្កើត Repository ថ្មីមួយនៅលើ GitHub (https://github.com/new)
echo.
set /p REPO_URL="សូមបញ្ចូល GitHub Repository URL របស់អ្នក (ឧ. https://github.com/username/repo-name.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] អ្នកមិនបានបញ្ចូល URL ឡើយ! សូមដំណើរការឡើងវិញ។
    pause
    exit /b
)

echo.
echo [1/3] កំពុងរៀបចំ Git Remote...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo [2/3] កំពុងរុញកូដ (Push) ទៅកាន់ GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo   [ជោគជ័យ] បានរុញកូដទៅកាន់ GitHub រួចរាល់ ១០០%%!
    echo ================================================================
    echo.
    echo ជំហានចុងក្រោយដើម្បីបើក Live Website:
    echo 1. ចូលទៅកាន់ GitHub Repo របស់អ្នក
    echo 2. ចុច Settings -> Pages (នៅខាងឆ្វេង)
    echo 3. ត្រង់ "Source" ជ្រើសរើស "GitHub Actions" ឬ "Deploy from main branch"
    echo 4. ចុច Save នោះអ្នកនឹងទទួលបាន Link ប្រើប្រាស់ជាសាធារណៈភ្លាម!
    echo.
) else (
    echo.
    echo [បរាជ័យ] មានបញ្ហាក្នុងការ Push! សូមពិនិត្យមើលសិទ្ធិ Login ឬ Repository URL របស់អ្នក។
)

pause
