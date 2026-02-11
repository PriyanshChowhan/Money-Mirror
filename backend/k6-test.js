import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * K6 Load Testing Script for MoneyMirror API
 * 
 * To run different test scenarios:
 * - Smoke test:  k6 run --env SCENARIO=smoke k6-test.js
 * - Load test:   k6 run --env SCENARIO=load k6-test.js
 * - Stress test: k6 run --env SCENARIO=stress k6-test.js
 * - Spike test:  k6 run --env SCENARIO=spike k6-test.js
 * 
 * To set JWT token: k6 run --env JWT_TOKEN=your_jwt_token k6-test.js
 */

// Custom Metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const JWT_TOKEN = __ENV.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc2MjlmNjhiYTcyOWY5OTM4ZGE4YjUiLCJuYW1lIjoiUHJpeWFuc2giLCJpYXQiOjE3NzA0NDkyMzMsImV4cCI6MTc3MTA1NDAzM30.bR5aPeznuDtkhVRZtIa8FAu4Mr1UhvS4Aq9P7sUWlb0'; // Set via command line or manually

// Test Scenarios
const scenarios = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 10 },  // Ramp up to 10 users
      { duration: '1m', target: 10 },   // Stay at 10 users
      { duration: '30s', target: 20 },  // Ramp to 20 users
      { duration: '1m', target: 20 },   // Stay at 20 users
      { duration: '30s', target: 0 },   // Ramp down
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 50 },   // Ramp up to 50 users
      { duration: '2m', target: 50 },   // Stay at 50
      { duration: '1m', target: 100 },  // Push to 100
      { duration: '2m', target: 100 },  // Stay at 100
      { duration: '1m', target: 0 },    // Ramp down
    ],
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 5 },   // Normal load
      { duration: '10s', target: 100 }, // Sudden spike
      { duration: '30s', target: 100 }, // Maintain spike
      { duration: '10s', target: 5 },   // Drop back
      { duration: '10s', target: 0 },   // Ramp down
    ],
  },
};

// Select scenario from environment or default to smoke
const selectedScenario = __ENV.SCENARIO || 'smoke';

export const options = {
  scenarios: {
    [selectedScenario]: scenarios[selectedScenario],
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'],                  // Error rate < 5%
    errors: ['rate<0.1'],                            // Custom error rate < 10%
    'http_req_duration{endpoint:transactions}': ['p(95)<600'],
    'http_req_duration{endpoint:insights}': ['p(95)<1000'],
  },
};

// Helper function to create headers with JWT
function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth && JWT_TOKEN) {
    headers['Cookie'] = `jwt=${JWT_TOKEN}`;
  }
  
  return headers;
}

// Test Setup
export function setup() {
  console.log(`🚀 Starting K6 Load Test`);
  console.log(`📊 Scenario: ${selectedScenario}`);
  console.log(`🔗 Base URL: ${BASE_URL}`);
  console.log(`🔐 JWT Token: ${JWT_TOKEN ? 'Provided ✅' : 'Not provided ⚠️ (protected routes will fail)'}`);
  
  // Test server connectivity
  const healthCheck = http.get(`${BASE_URL}/api/auth/google`);
  if (healthCheck.status !== 302) { // Should redirect to Google
    console.warn('⚠️  Server health check returned unexpected status');
  }
  
  return { startTime: new Date().toISOString() };
}

// Main test function
export default function () {
  const testGroup = Math.random();
  
  // Distribute load across different endpoints
  if (testGroup < 0.4) {
    testTransactionsEndpoint();
  } else if (testGroup < 0.7) {
    testInsightsEndpoint();
  } else if (testGroup < 0.85) {
    testProfileEndpoint();
  } else {
    testGmailSyncEndpoint();
  }
  
  sleep(1); // Think time between requests
}

// Test: Get All Transactions
function testTransactionsEndpoint() {
  const response = http.get(
    `${BASE_URL}/api/transactions/getTransactions`,
    { 
      headers: getHeaders(true),
      tags: { endpoint: 'transactions' }
    }
  );
  
  check(response, {
    'transactions: status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'transactions: response time < 500ms': (r) => r.timings.duration < 500,
    'transactions: has valid response': (r) => r.body.length > 0,
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: 'transactions' });
  
  // Only count actual errors (not 200 or 401)
  if (response.status === 200 || response.status === 401) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
}

// Test: Get Transactions by Range
function testTransactionsByRange() {
  const startDate = '2024-01-01';
  const endDate = '2024-12-31';
  
  const response = http.get(
    `${BASE_URL}/api/transactions/getTransactionsByRange?startDate=${startDate}&endDate=${endDate}`,
    { 
      headers: getHeaders(true),
      tags: { endpoint: 'transactions_range' }
    }
  );
  
  check(response, {
    'transactions range: status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'transactions range: response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: 'transactions_range' });
  
  // Only count actual errors (not 200 or 401)
  if (response.status === 200 || response.status === 401) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
    failedRequests.add(1);
  }
}

// Test: Get Raw Insights
function testInsightsEndpoint() {
  const response = http.get(
    `${BASE_URL}/api/insights/raw`,
    { 
      headers: getHeaders(true),
      tags: { endpoint: 'insights' }
    }
  );
  
  check(response, {
    'insights: status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'insights: response time < 1000ms': (r) => r.timings.duration < 1000,
    'insights: valid JSON response': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: 'insights' });
  
  // Only count actual errors (not 200 or 401)
  if (response.status === 200 || response.status === 401) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
}

// Test: Get AI Insights
function testAIInsights() {
  const response = http.get(
    `${BASE_URL}/api/insights/raw`,
    { 
      headers: getHeaders(true),
      tags: { endpoint: 'ai_insights' },
      timeout: '30s', // AI might take longer
    }
  );
  
  check(response, {
    'ai insights: status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'ai insights: response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: 'ai_insights' });
  
  // Only count actual errors (not 200 or 401)
  if (response.status === 200 || response.status === 401) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
    failedRequests.add(1);
  }
}

// Test: Get User Profile
function testProfileEndpoint() {
  const response = http.get(
    `${BASE_URL}/api/auth/profile`,
    { 
      headers: getHeaders(true),
      tags: { endpoint: 'profile' }
    }
  );
  
  check(response, {
    'profile: status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'profile: response time < 300ms': (r) => r.timings.duration < 300,
    'profile: has user data': (r) => {
      if (r.status !== 200) return true; // Skip check if unauthorized
      try {
        const data = JSON.parse(r.body);
        return data.email && data.name;
      } catch {
        return false;
      }
    },
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: 'profile' });
  
  // Only count actual errors (not 200 or 401)
  if (response.status === 200 || response.status === 401) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
}

// Test: Frontend Protection Check
function testFrontendProtect() {
  const response = http.get(
    `${BASE_URL}/api/auth/frontend-protect`,
    { 
      headers: getHeaders(true),
      tags: { endpoint: 'frontend_protect' }
    }
  );
  
  check(response, {
    'frontend protect: status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'frontend protect: response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: 'frontend_protect' });
  
  // Only count actual errors (not 200 or 401)
  if (response.status === 200 || response.status === 401) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
    failedRequests.add(1);
  }
}

// Test: Gmail Sync (POST)
function testGmailSyncEndpoint() {
  const response = http.post(
    `${BASE_URL}/api/gmail/sync`,
    null,
    { 
      headers: getHeaders(true),
      tags: { endpoint: 'gmail_sync' },
      timeout: '60s', // Sync might take longer
    }
  );
  
  check(response, {
    'gmail sync: status is 200, 400, or 401': (r) => [200, 400, 401].includes(r.status),
    'gmail sync: response time < 5000ms': (r) => r.timings.duration < 5000,
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: 'gmail_sync' });
  
  // Only count actual errors (not 200, 400, or 401)
  if ([200, 400, 401].includes(response.status)) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
}

// Teardown
export function teardown(data) {
  console.log(`\n🏁 Test completed`);
  console.log(`⏰ Started at: ${data.startTime}`);
  console.log(`📈 Check results above for detailed metrics`);
}

// Handle Summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'k6-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors !== false;
  
  let summary = '\n' + indent + '='.repeat(60) + '\n';
  summary += indent + '                 K6 LOAD TEST SUMMARY\n';
  summary += indent + '='.repeat(60) + '\n\n';
  
  // Scenario info
  summary += indent + `Scenario: ${selectedScenario}\n`;
  summary += indent + `Duration: ${data.state.testRunDurationMs / 1000}s\n\n`;
  
  // HTTP metrics
  const metrics = data.metrics;
  summary += indent + 'HTTP Metrics:\n';
  summary += indent + `  Requests: ${metrics.http_reqs?.values.count || 0}\n`;
  summary += indent + `  Failed: ${metrics.http_req_failed?.values.passes || 0}\n`;
  summary += indent + `  Response Time (avg): ${(metrics.http_req_duration?.values.avg || 0).toFixed(2)}ms\n`;
  summary += indent + `  Response Time (p95): ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += indent + `  Response Time (p99): ${(metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2)}ms\n\n`;
  
  // Custom metrics
  summary += indent + 'Custom Metrics:\n';
  summary += indent + `  Successful Requests: ${metrics.successful_requests?.values.count || 0}\n`;
  summary += indent + `  Failed Requests: ${metrics.failed_requests?.values.count || 0}\n`;
  summary += indent + `  Error Rate: ${((metrics.errors?.values.rate || 0) * 100).toFixed(2)}%\n\n`;
  
  summary += indent + '='.repeat(60) + '\n';
  
  return summary;
}
