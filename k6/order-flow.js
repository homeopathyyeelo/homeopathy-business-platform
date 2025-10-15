// K6 Load Test for Order Processing Flow
// Learning Notes:
// - Tests complete order lifecycle under load
// - Validates database transactions and consistency
// - Simulates realistic e-commerce behavior
// - Includes payment processing simulation

import http from "k6/http"
import { check, sleep, group } from "k6"
import { Rate, Trend, Counter } from "k6/metrics"
import { randomString, randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js"
import { __ENV } from "k6/env"

// Custom metrics
const orderProcessingTime = new Trend("order_processing_duration")
const paymentSuccessRate = new Rate("payment_success_rate")
const inventoryErrors = new Counter("inventory_errors")
const orderRevenue = new Counter("order_revenue_total")

export const options = {
  stages: [
    { duration: "3m", target: 100 }, // Ramp up
    { duration: "10m", target: 500 }, // Sustained load
    { duration: "5m", target: 1000 }, // Peak load
    { duration: "5m", target: 100 }, // Ramp down
  ],

  thresholds: {
    order_processing_duration: ["p(95)<3000"],
    payment_success_rate: ["rate>0.95"],
    http_req_duration: ["p(90)<2000"],
    inventory_errors: ["count<100"],
  },
}

const BASE_URL = __ENV.BASE_URL || "https://api-staging.yeelo.com"

// Product catalog for testing
const products = [
  { id: 1, name: "Arnica 30C", price: 299, category: "pain-relief" },
  { id: 2, name: "Nux Vomica 200C", price: 399, category: "digestive" },
  { id: 3, name: "Belladonna 30C", price: 349, category: "fever" },
  { id: 4, name: "Pulsatilla 200C", price: 449, category: "respiratory" },
  { id: 5, name: "Sulphur 1M", price: 599, category: "skin-care" },
]

const generateOrderData = () => {
  const numItems = randomIntBetween(1, 4)
  const items = []
  let totalAmount = 0

  for (let i = 0; i < numItems; i++) {
    const product = products[randomIntBetween(0, products.length - 1)]
    const quantity = randomIntBetween(1, 3)
    const itemTotal = product.price * quantity

    items.push({
      productId: product.id,
      quantity: quantity,
      price: product.price,
      total: itemTotal,
    })

    totalAmount += itemTotal
  }

  return {
    items,
    totalAmount,
    shippingAddress: {
      street: `${randomIntBetween(1, 999)} MG Road`,
      city: ["Mumbai", "Delhi", "Bangalore"][randomIntBetween(0, 2)],
      state: ["Maharashtra", "Delhi", "Karnataka"][randomIntBetween(0, 2)],
      pincode: `${randomIntBetween(100000, 999999)}`,
      country: "India",
    },
    paymentMethod: ["card", "upi", "netbanking"][randomIntBetween(0, 2)],
  }
}

// User authentication
const authenticateUser = () => {
  const userData = {
    email: `user-${randomString(8)}@example.com`,
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
  }

  const response = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(userData), {
    headers: { "Content-Type": "application/json" },
  })

  if (response.status === 201 || response.status === 200) {
    const body = JSON.parse(response.body)
    return body.token
  }

  return null
}

export default function () {
  const token = authenticateUser()

  if (!token) {
    console.error("Failed to authenticate user")
    return
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  group("Complete Order Flow", () => {
    // Step 1: Browse products
    group("Product Browsing", () => {
      const response = http.get(`${BASE_URL}/api/products`, { headers })

      check(response, {
        "products loaded": (r) => r.status === 200,
        "has products": (r) => {
          try {
            const body = JSON.parse(r.body)
            return Array.isArray(body.products) && body.products.length > 0
          } catch {
            return false
          }
        },
      })
    })

    sleep(randomIntBetween(2, 5)) // Browse time

    // Step 2: Create order
    group("Order Creation", () => {
      const orderData = generateOrderData()
      const startTime = Date.now()

      const response = http.post(`${BASE_URL}/api/orders`, JSON.stringify(orderData), { headers })

      const duration = Date.now() - startTime
      orderProcessingTime.add(duration)

      const success = check(response, {
        "order created": (r) => r.status === 201 || r.status === 200,
        "order has ID": (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.orderId !== undefined
          } catch {
            return false
          }
        },
        "inventory reserved": (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.status === "pending" || body.status === "confirmed"
          } catch {
            return false
          }
        },
      })

      if (success) {
        const body = JSON.parse(response.body)
        const orderId = body.orderId
        orderRevenue.add(orderData.totalAmount)

        // Step 3: Process payment
        group("Payment Processing", () => {
          const paymentData = {
            orderId: orderId,
            amount: orderData.totalAmount,
            method: orderData.paymentMethod,
            // Simulate payment gateway response
            gatewayResponse: {
              transactionId: `txn_${randomString(16)}`,
              status: Math.random() > 0.05 ? "success" : "failed", // 95% success rate
            },
          }

          const paymentResponse = http.post(`${BASE_URL}/api/orders/${orderId}/payment`, JSON.stringify(paymentData), {
            headers,
          })

          const paymentSuccess = check(paymentResponse, {
            "payment processed": (r) => r.status === 200,
            "payment confirmed": (r) => {
              try {
                const body = JSON.parse(r.body)
                return body.paymentStatus === "completed"
              } catch {
                return false
              }
            },
          })

          paymentSuccessRate.add(paymentSuccess ? 1 : 0)

          if (paymentSuccess) {
            // Step 4: Check order status
            group("Order Status Check", () => {
              sleep(1) // Wait for async processing

              const statusResponse = http.get(`${BASE_URL}/api/orders/${orderId}`, { headers })

              check(statusResponse, {
                "status retrieved": (r) => r.status === 200,
                "order confirmed": (r) => {
                  try {
                    const body = JSON.parse(r.body)
                    return body.status === "confirmed" || body.status === "processing"
                  } catch {
                    return false
                  }
                },
              })
            })
          }
        })
      } else {
        // Check if it's an inventory error
        if (response.status === 409) {
          inventoryErrors.add(1)
        }
      }
    })
  })

  sleep(randomIntBetween(1, 3))
}

export function setup() {
  console.log("🛒 Starting Order Flow Load Test")

  // Verify API health
  const healthCheck = http.get(`${BASE_URL}/health`)
  if (healthCheck.status !== 200) {
    throw new Error("API health check failed")
  }

  return { startTime: Date.now() }
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log(`✅ Order flow test completed in ${duration}s`)
}
