Set-Location "c:\Users\hp\OneDrive\Desktop\FINAL YEAR PROJECT"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " AI-Powered Financial Fraud Detection System Launcher" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Starting Python AI Microservice (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location "c:\Users\hp\OneDrive\Desktop\FINAL YEAR PROJECT\ai_service"; ..\.venv\Scripts\python.exe app.py' -WindowStyle Normal

Write-Host "`n[2/3] Starting Spring Boot REST Backend (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location "c:\Users\hp\OneDrive\Desktop\FINAL YEAR PROJECT\backend"; C:\maven\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run "-Dmaven.wagon.http.ssl.insecure=true" "-Dmaven.wagon.http.ssl.allowall=true"' -WindowStyle Normal

Write-Host "`n[3/3] Starting React Web Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location "c:\Users\hp\OneDrive\Desktop\FINAL YEAR PROJECT\frontend"; npm start' -WindowStyle Normal

Write-Host "`nAll 3 services have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host "Access Frontend at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Access Backend API at: http://localhost:8080/api/health" -ForegroundColor Cyan
Write-Host "Access AI Service at: http://localhost:5000/health" -ForegroundColor Cyan
