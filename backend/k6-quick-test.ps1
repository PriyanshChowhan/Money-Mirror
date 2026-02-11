# Quick K6 Testing Scripts for MoneyMirror
# PowerShell commands for Windows

# === SETUP ===
# 1. Make sure your backend is running: npm run dev
# 2. Login to your app in browser (http://localhost:5173)
# 3. Get JWT token from browser cookies (F12 → Application → Cookies → jwt)
# 4. Replace YOUR_JWT_TOKEN below with actual token

# === CONFIGURATION ===
$JWT_TOKEN = "YOUR_JWT_TOKEN"  # Replace this
$BASE_URL = "http://localhost:5000"

# === QUICK TEST COMMANDS ===

# Smoke Test (Quick check - 1 user, 30 sec)
function Run-SmokeTest {
    Write-Host "🔬 Running Smoke Test..." -ForegroundColor Cyan
    k6 run --env SCENARIO=smoke --env BASE_URL=$BASE_URL k6-test.js
}

# Smoke Test with Auth
function Run-SmokeTest-Auth {
    if ($JWT_TOKEN -eq "YOUR_JWT_TOKEN") {
        Write-Host "⚠️  Please set JWT_TOKEN in this script first!" -ForegroundColor Yellow
        return
    }
    Write-Host "🔬 Running Smoke Test with Auth..." -ForegroundColor Cyan
    k6 run --env SCENARIO=smoke --env BASE_URL=$BASE_URL --env JWT_TOKEN=$JWT_TOKEN k6-test.js
}

# Load Test (Normal load - 10-20 users)
function Run-LoadTest {
    if ($JWT_TOKEN -eq "YOUR_JWT_TOKEN") {
        Write-Host "⚠️  Please set JWT_TOKEN in this script first!" -ForegroundColor Yellow
        return
    }
    Write-Host "📊 Running Load Test..." -ForegroundColor Cyan
    k6 run --env SCENARIO=load --env BASE_URL=$BASE_URL --env JWT_TOKEN=$JWT_TOKEN k6-test.js
}

# Stress Test (High load - 50-100 users)
function Run-StressTest {
    if ($JWT_TOKEN -eq "YOUR_JWT_TOKEN") {
        Write-Host "⚠️  Please set JWT_TOKEN in this script first!" -ForegroundColor Yellow
        return
    }
    Write-Host "💥 Running Stress Test..." -ForegroundColor Yellow
    k6 run --env SCENARIO=stress --env BASE_URL=$BASE_URL --env JWT_TOKEN=$JWT_TOKEN k6-test.js
}

# Spike Test (Sudden load)
function Run-SpikeTest {
    if ($JWT_TOKEN -eq "YOUR_JWT_TOKEN") {
        Write-Host "⚠️  Please set JWT_TOKEN in this script first!" -ForegroundColor Yellow
        return
    }
    Write-Host "⚡ Running Spike Test..." -ForegroundColor Magenta
    k6 run --env SCENARIO=spike --env BASE_URL=$BASE_URL --env JWT_TOKEN=$JWT_TOKEN k6-test.js
}

# Show available commands
function Show-Commands {
    Write-Host "`n=== Available K6 Test Commands ===" -ForegroundColor Green
    Write-Host "Run-SmokeTest         - Quick test without auth (30s)" -ForegroundColor White
    Write-Host "Run-SmokeTest-Auth    - Quick test with auth (30s)" -ForegroundColor White
    Write-Host "Run-LoadTest          - Normal load test (~3.5min)" -ForegroundColor White
    Write-Host "Run-StressTest        - High load test (~7min)" -ForegroundColor White
    Write-Host "Run-SpikeTest         - Spike load test (~1min)" -ForegroundColor White
    Write-Host "`nExample: Run-SmokeTest`n" -ForegroundColor Cyan
}

# Display commands on load
Show-Commands

# === USAGE ===
# 1. Open PowerShell in the backend directory
# 2. Run: . .\k6-quick-test.ps1
# 3. Update $JWT_TOKEN variable above
# 4. Run any test: Run-SmokeTest, Run-LoadTest, etc.
