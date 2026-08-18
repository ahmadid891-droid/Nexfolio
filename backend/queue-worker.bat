@echo off
cd /d %~dp0
echo Nexfolio Queue Worker - keep this window open
php artisan queue:work --sleep=3 --tries=3 --timeout=120
pause
