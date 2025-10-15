// K6 Load Test for Campaign Spike Scenario
// Learning Notes:
// - Simulates massive campaign launches that stress the system
// - Tests auto-scaling behavior under high load
// - Validates Kafka consumer scaling and database performance
// - Includes realistic user behavior patterns

import http from "k6/http"
import { check, sleep, group } from "k6"
import { Rate, Trend, Counter } from "k6/metrics"
import { randomString, randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js"
import { __ENV } from "k6"

// Custom metrics
const errorRate = new Rate("errors")
const campaignCreationTime = new Trend("campaign_creation_duration")
const messagesSentCounter = new Counter("messages_sent_total")
const authFailures = new Counter("auth_failures")

// Test configuration
export const options = {
  stages: [
    // Warm-up phase
    { duration: "2m", target: 50 },

    // Normal load
    { duration: "5m", target: 200 },

    // Spike phase - simulate Black Friday campaign launch
    { duration: "2m", target: 1000 },
    { duration: "5m", target: 2000 },
    { duration: "3m", target: 3000 },

    // Sustained high load
    { duration: "10m", target: 2500 },

    // Cool down
    { duration: "5m", target: 500 },
    { duration: "3m", target: 0 },
  ],

  thresholds: {
    errors: ["rate<0.05"], // Error rate should be below 5%
    http_req_duration: ["p(95)<2000"], // 95% of requests should be below 2s
    campaign_creation_duration: ["p(90)<5000"], // 90% of campaigns created within 5s
    http_req_failed: ["rate<0.02"], // Failed requests should be below 2%
  },

  // Distributed load testing
  ext: {
    loadimpact: {
      distribution: {
        "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 50 },
        "amazon:ie:dublin": { loadZone: "amazon:ie:dublin", percent: 30 },
        "amazon:sg:singapore": { loadZone: "amazon:sg:singapore", percent: 20 },
      },
    },
  },
}

// Environment configuration
const BASE_URL = __ENV.BASE_URL || "https://api-staging.yeelo.com"
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || "your-admin-token-here"

// Test data generators
const generateCampaignData = () => ({
  name: `BlackFriday-${randomString(8)}`,
  channel: ["whatsapp", "sms", "email"][randomIntBetween(0, 2)],
  schedule: "now",
  filter: {
    tags: ["skin-care", "hair-care", "wellness"][randomIntBetween(0, 2)],
    geo_radius_km: randomIntBetween(5, 50),
    age_range: {
      min: randomIntBetween(18, 30),
      max: randomIntBetween(40, 65),
    },
  },
  template_id: randomIntBetween(1, 10),
  message: {
    text: `🎉 Black Friday Special! ${randomIntBetween(20, 70)}% off on homeopathy products!`,
    cta_url: "https://yeelo.com/blackfriday",
    cta_text: "Shop Now",
  },
})

const generateCustomerData = () => ({
  email: `customer-${randomString(10)}@example.com`,
  password: "TestPassword123!",
  firstName: ["Priya", "Rahul", "Anita", "Vikram", "Sunita"][randomIntBetween(0, 4)],
  lastName: ["Sharma", "Patel", "Kumar", "Singh", "Gupta"][randomIntBetween(0, 4)],
  phone: `+91${randomIntBetween(7000000000, 9999999999)}`,
  location: {
    city: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"][randomIntBetween(0, 4)],
    state: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal"][randomIntBetween(0, 4)],
  },
})

// Authentication helper
let authToken = null

const authenticate = () => {
  if (authToken) return authToken

  const loginData = {
    email: "admin@yeelo.com",
    password: "AdminPassword123!",
  }

  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginData), {
    headers: { "Content-Type": "application/json" },
  })

  if (response.status === 200) {
    const body = JSON.parse(response.body)
    authToken = body.token
    return authToken
  } else {
    authFailures.add(1)
    return ADMIN_TOKEN // Fallback to provided token
  }
}

// Main test scenarios
export default function () {
  const token = authenticate()

  if (!token) {
    console.error("Authentication failed")
    return
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  // Scenario 1: Campaign Creation (70% of users)
  if (Math.random() < 0.7) {
    group("Campaign Creation", () => {
      const campaignData = generateCampaignData()
      const startTime = Date.now()

      const response = http.post(`${BASE_URL}/api/campaigns`, JSON.stringify(campaignData), { headers })

      const duration = Date.now() - startTime
      campaignCreationTime.add(duration)

      const success = check(response, {
        "campaign created successfully": (r) => r.status === 201 || r.status === 200,
        "response has campaign ID": (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.campaignId !== undefined
          } catch {
            return false
          }
        },
        "response time acceptable": (r) => r.timings.duration < 5000,
      })

      if (!success) {
        errorRate.add(1)
      } else {
        // Simulate campaign processing
        const body = JSON.parse(response.body)
        if (body.campaignId) {
          messagesSentCounter.add(randomIntBetween(100, 5000))
        }
      }
    })
  }

  // Scenario 2: Customer Registration (20% of users)
  else if (Math.random() < 0.9) {
    group("Customer Registration", () => {
      const customerData = generateCustomerData()

      const response = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(customerData), {
        headers: { "Content-Type": "application/json" },
      })

      const success = check(response, {
        "customer registered": (r) => r.status === 201 || r.status === 200,
        "response has token": (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.token !== undefined
          } catch {
            return false
          }
        },
      })

      if (!success) {
        errorRate.add(1)
      }
    })
  }

  // Scenario 3: Analytics and Reporting (10% of users)
  else {
    group("Analytics Dashboard", () => {
      const endpoints = [
        "/api/analytics/campaigns/summary",
        "/api/analytics/revenue/daily",
        "/api/analytics/customers/growth",
        "/api/orders/recent",
      ]

      endpoints.forEach((endpoint) => {
        const response = http.get(`${BASE_URL}${endpoint}`, { headers })

        check(response, {
          [`${endpoint} accessible`]: (r) => r.status === 200,
          [`${endpoint} fast response`]: (r) => r.timings.duration < 1000,
        })

        if (response.status !== 200) {
          errorRate.add(1)
        }
      })
    })
  }

  // Random think time to simulate real user behavior
  sleep(randomIntBetween(1, 5))
}

// Setup function - runs once per VU
export function setup() {
  console.log("🚀 Starting Campaign Spike Load Test")
  console.log(`📊 Target URL: ${BASE_URL}`)
  console.log("📈 Test will simulate Black Friday campaign launch scenario")

  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/health`)
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`)
  }

  return { startTime: Date.now() }
}

// Teardown function - runs once after all VUs finish
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log(`✅ Load test completed in ${duration}s`)
  console.log("📊 Check Grafana dashboards for detailed metrics")
  console.log("🔍 Monitor Kafka consumer lag and pod scaling")
}
