@echo off
setlocal

set JAVA_HOME=C:\Program Files\Java\jdk-24
set MVN=C:\tools\maven\apache-maven-3.9.9\bin\mvn.cmd
set NPM=C:\Program Files\nodejs\npm.cmd
set BACKEND=%~dp0backend
set FRONTEND=%~dp0frontend

set MAIL_ENABLED=true
set MAIL_USERNAME=ala.snopko@gmail.com
set MAIL_PASSWORD=lyxrnhjcqkgczszg

echo Uruchamiam backend...
start "VetTriage - Backend" cmd /k "cd /d "%BACKEND%" && "%MVN%" spring-boot:run -Djavax.net.ssl.trustStoreType=Windows-ROOT"

echo Uruchamiam frontend...
start "VetTriage - Frontend" cmd /k "cd /d "%FRONTEND%" && "%NPM%" run dev"

echo Czekam 12 sekund na start serwera...
timeout /t 12 /nobreak > nul

echo Otwieram przegladarke...
start "" "http://localhost:5173"

endlocal
