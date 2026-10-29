@echo off
setlocal
set "ROOT=%~dp0"

echo Levantando MySQL (Docker) en el puerto 3306...
docker compose -f "%ROOT%docker-compose.yml" up -d

echo.
echo Iniciando Backend (PHP CodeIgniter) en puerto 8080...
netstat -ano | findstr /C:":8080" >nul
if %errorlevel%==0 (
  echo El puerto 8080 ya esta en uso. Se omite el backend ^(p. ej. Herd ya lo sirve^).
) else (
  start "Backend" /D "%ROOT%backend_permisos" php spark serve --host 0.0.0.0 --port 8080
)

echo.
echo Iniciando Frontend (React) en puerto 3000...
start "Frontend" /D "%ROOT%front" cmd /c npm start

echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000
pause
