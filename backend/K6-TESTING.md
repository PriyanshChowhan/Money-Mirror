# K6 Load Testing Guide for MoneyMirror

## Prerequisites

1. **Install K6**:
   ```bash
   # Windows (using Chocolatey)
   choco install k6

   # Windows (using winget)
   winget install k6 --source winget

   # macOS
   brew install k6

   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Make sure your backend server is running**:
   ```bash
   cd backend
   npm run dev
   ```

## Getting Your JWT Token

To test protected endpoints, you need a valid JWT token:

### Method 1: From Browser (Easiest)
1. Open your browser and navigate to `http://localhost:5173`
2. Log in with Google
3. Open DevTools (F12) → Application/Storage → Cookies
4. Find the cookie named `jwt` for `localhost:5173` or `localhost:5000`
5. Copy the cookie value (this is your JWT token)

### Method 2: From Backend Logs
1. Log in through the frontend
2. Check backend console logs for JWT generation
3. Extract the token from logs if debug mode is enabled

### Method 3: Using MongoDB Compass
1. Connect to your MongoDB database
2. Find your user in the `users` collection
3. Use the `accessToken` and `refreshToken` (though JWT is preferred)

## Running Tests

### Basic Usage

```bash
# Navigate to backend directory
cd backend

# Smoke test (1 user, 30 seconds)
k6 run --env SCENARIO=smoke k6-test.js

# Load test (10-20 users, ramping up)
k6 run --env SCENARIO=load k6-test.js

# Stress test (50-100 users)
k6 run --env SCENARIO=stress k6-test.js

# Spike test (sudden spike to 100 users)
k6 run --env SCENARIO=spike k6-test.js
```

### With Authentication

```bash
# Replace YOUR_JWT_TOKEN with actual token from browser
k6 run --env SCENARIO=load --env JWT_TOKEN=YOUR_JWT_TOKEN k6-test.js

# Example:
k6 run --env SCENARIO=load --env JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... k6-test.js
```

### Custom Base URL

```bash
# Test against production or different env
k6 run --env BASE_URL=http://your-server:5000 --env SCENARIO=smoke k6-test.js
```

### Combined Options

```bash
k6 run \
  --env SCENARIO=load \
  --env JWT_TOKEN=your_jwt_token \
  --env BASE_URL=http://localhost:5000 \
  k6-test.js
```

## Test Scenarios

### 🔬 Smoke Test
- **Purpose**: Basic functionality check
- **VUs**: 1 user
- **Duration**: 30 seconds
- **Use when**: Quick sanity check, CI/CD pipeline

### 📊 Load Test
- **Purpose**: Normal load simulation
- **VUs**: Ramps from 0 → 10 → 20 users
- **Duration**: ~3.5 minutes
- **Use when**: Regular performance testing

### 💥 Stress Test
- **Purpose**: Find breaking point
- **VUs**: Ramps from 0 → 50 → 100 users
- **Duration**: ~7 minutes
- **Use when**: Capacity planning, finding limits

### ⚡ Spike Test
- **Purpose**: Sudden traffic spike
- **VUs**: Jump from 5 → 100 users quickly
- **Duration**: ~1 minute
- **Use when**: Testing resilience to sudden load

## Understanding Results

### Key Metrics

- **http_req_duration**: Response time for requests
  - `avg`: Average response time
  - `p(95)`: 95% of requests faster than this
  - `p(99)`: 99% of requests faster than this

- **http_req_failed**: Percentage of failed requests
  - Should be < 5% for healthy system

- **http_reqs**: Total number of requests
  - Higher = more load

- **iterations**: Number of test iterations completed

### Thresholds (Pass/Fail Criteria)

```javascript
✅ PASS: http_req_duration p(95) < 500ms    // 95% requests under 500ms
✅ PASS: http_req_duration p(99) < 1000ms   // 99% requests under 1s
✅ PASS: http_req_failed < 5%                // Less than 5% errors
✅ PASS: errors < 10%                        // Error rate under 10%
```

### Sample Output

```
scenarios: (100.00%) 1 scenario, 10 max VUs, 3m30s max duration

✓ transactions: status is 200 or 401
✓ transactions: response time < 500ms
✓ insights: status is 200 or 401

checks.........................: 98.50% ✓ 987   ✗ 15
data_received..................: 2.1 MB 12 kB/s
data_sent......................: 89 kB  499 B/s
http_req_duration..............: avg=234ms min=45ms med=198ms max=987ms p(95)=456ms p(99)=678ms
http_reqs......................: 1024   5.7/s
successful_requests............: 1009   (counter)
failed_requests................: 15     (counter)
```

## Endpoints Tested

| Endpoint | Method | Protected | Tag |
|----------|--------|-----------|-----|
| `/api/transactions/getTransactions` | GET | ✅ | `transactions` |
| `/api/transactions/getTransactionsByRange` | GET | ✅ | `transactions_range` |
| `/api/insights/raw` | GET | ✅ | `insights` |
| `/api/insights/ai` | GET | ✅ | `ai_insights` |
| `/api/auth/profile` | GET | ✅ | `profile` |
| `/api/auth/frontend-protect` | GET | ✅ | `frontend_protect` |
| `/api/gmail/sync` | POST | ✅ | `gmail_sync` |

## Troubleshooting

### ❌ All requests return 401 Unauthorized
- **Problem**: JWT token not provided or invalid
- **Solution**: Get fresh JWT token from browser cookies after login

### ❌ Connection refused
- **Problem**: Backend server not running
- **Solution**: Start backend with `npm run dev`

### ❌ Very high response times
- **Problem**: Database slow, not enough resources, or cold start
- **Solution**: 
  - Warm up server with smoke test first
  - Check MongoDB connection
  - Reduce concurrent users

### ❌ k6 command not found
- **Problem**: k6 not installed or not in PATH
- **Solution**: Install k6 using instructions above

## Advanced Usage

### Save Results to File

```bash
k6 run --out json=results.json k6-test.js
```

### Run with Verbose Output

```bash
k6 run --verbose k6-test.js
```

### Custom VUs and Duration

```bash
k6 run --vus 50 --duration 2m k6-test.js
```

### View Results in Browser

```bash
# Install k6 with browser metrics
k6 run --out influxdb=http://localhost:8086/k6 k6-test.js
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run K6 Load Test
  run: |
    cd backend
    k6 run --env SCENARIO=smoke k6-test.js
```

## Best Practices

1. **Start Small**: Begin with smoke tests before running stress tests
2. **Use Fresh Tokens**: JWT tokens expire after 7 days
3. **Warm Up**: Run a light test first to warm up the server
4. **Monitor Resources**: Watch CPU, memory, and database during tests
5. **Test Gradually**: Increase load incrementally to find the breaking point
6. **Clean Data**: Consider test data cleanup after heavy load testing

## Next Steps

- Set up Grafana + InfluxDB for visual dashboards
- Add custom scenarios for specific user journeys
- Integrate with CI/CD for automated performance testing
- Create baseline metrics for regression testing
