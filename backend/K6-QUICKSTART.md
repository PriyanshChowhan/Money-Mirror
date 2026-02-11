# 🚀 Quick Start: K6 Testing for MoneyMirror

## Installation

```bash
# Windows
winget install k6 --source winget

# macOS
brew install k6

# Linux
sudo apt-get install k6
```

## Get Your JWT Token

1. Login to app: http://localhost:5173
2. Press F12 → Application → Cookies
3. Copy the `jwt` cookie value

## Running Tests

### Method 1: Using npm scripts (Easiest)

```bash
# Without JWT token (tests public endpoints only)
npm run test:k6:smoke

# With JWT token (tests all endpoints)
JWT_TOKEN=your_token npm run test:k6:load
JWT_TOKEN=your_token npm run test:k6:stress
JWT_TOKEN=your_token npm run test:k6:spike
```

### Method 2: Using helper scripts

**Windows (PowerShell):**
```powershell
# 1. Edit k6-quick-test.ps1 and set JWT_TOKEN
# 2. Load the script
. .\k6-quick-test.ps1

# 3. Run tests
Run-SmokeTest
Run-LoadTest
Run-StressTest
```

**Linux/Mac (Bash):**
```bash
# 1. Make executable
chmod +x k6-quick-test.sh

# 2. Edit script and set JWT_TOKEN
# 3. Run tests
./k6-quick-test.sh smoke
./k6-quick-test.sh load
./k6-quick-test.sh stress
```

### Method 3: Direct k6 commands

```bash
# Basic smoke test
k6 run --env SCENARIO=smoke k6-test.js

# With JWT token
k6 run --env SCENARIO=load --env JWT_TOKEN=your_jwt_token k6-test.js
```

## Test Types

| Test | Users | Duration | Purpose |
|------|-------|----------|---------|
| **Smoke** | 1 | 30s | Quick sanity check |
| **Load** | 10-20 | 3.5min | Normal load test |
| **Stress** | 50-100 | 7min | Find breaking point |
| **Spike** | 5→100 | 1min | Sudden traffic spike |

## Example Output

```
✓ transactions: status is 200 or 401
✓ insights: response time < 1000ms

checks.........................: 98.50% ✓ 987   ✗ 15
http_req_duration..............: avg=234ms p(95)=456ms p(99)=678ms
http_reqs......................: 1024   5.7/s
successful_requests............: 1009
```

## Troubleshooting

**401 errors?** → Get fresh JWT token from browser  
**Connection refused?** → Start backend: `npm run dev`  
**Slow responses?** → Check MongoDB connection  

## Full Documentation

See [K6-TESTING.md](./K6-TESTING.md) for complete guide.
