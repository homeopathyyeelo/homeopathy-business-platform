// import "./tracing" // Temporarily disabled
/**
 * API Gateway - Central entry point for all microservices
 * Handles routing, authentication, rate limiting, and load balancing
 *
 * Learning Notes:
 * - Uses Express.js with middleware for cross-cutting concerns
 * - Implements JWT authentication and role-based access control
 * - Routes requests to appropriate microservices
 * - Includes comprehensive logging and monitoring
 */

import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { createProxyMiddleware } from "http-proxy-middleware"
import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import client from "prom-client"
import { createRemoteJWKSet, jwtVerify } from "jose"

const app = express()
const PORT = process.env.PORT || 3000

app.get("/", (req: Request, res: Response) => {
  res.type("html").send(`
    <h1>Yeelo API Gateway</h1>
    <ul>
      <li><a href="/api/auth/docs">Auth Service Docs</a></li>
      <li><a href="/api/orders/docs">Orders/Inventory Docs</a></li>
      <li><a href="/api/campaigns/docs">Campaigns Docs</a></li>
      <li><a href="/graphql">GraphQL Playground</a></li>
      <li><a href="/metrics">Gateway Metrics</a></li>
    </ul>
  `)
})

app.use(helmet())
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Prometheus metrics
const register = new client.Registry()
client.collectDefaultMetrics({ register })
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"],
})
register.registerMetric(httpRequestCounter)

app.use((req, res, next) => {
  const end = res.end
  ;(res as any).end = function (chunk?: any, encoding?: any, cb?: any) {
    httpRequestCounter.inc({ method: req.method, path: req.path, status: res.statusCode })
    return end.apply(this, [chunk, encoding, cb])
  }
  next()
})

app.get("/metrics", async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", register.contentType)
  res.end(await register.metrics())
})

interface AuthenticatedRequest extends Request {
  user?: any
}

const authServiceBase = process.env.AUTH_SERVICE_URL || "http://api-nest:3001"
const jwks = createRemoteJWKSet(new URL(`${authServiceBase}/.well-known/jwks.json`))

async function verifyTokenRS256(token: string) {
  const issuer = process.env.JWT_ISSUER || "urn:yeelo:auth"
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: "yeelo-clients",
  })
  return payload
}

const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && (authHeader as string).split(" ")[1]
    if (!token) return res.status(401).json({ error: "Access token required" })

    // Prefer RS256 via JWKS
    try {
      const payload = await verifyTokenRS256(token)
      req.user = payload
      return next()
    } catch (e) {
      // Fallback to HS256 if configured
      if (process.env.JWT_SECRET) {
        const user = jwt.verify(token, process.env.JWT_SECRET)
        req.user = user
        return next()
      }
      return res.status(403).json({ error: "Invalid or expired token" })
    }
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}

const services = {
  auth: authServiceBase,
  orders: process.env.ORDERS_SERVICE_URL || "http://api-fastify:3002",
  campaigns: process.env.CAMPAIGNS_SERVICE_URL || "http://api-express:3003",
  ai: process.env.AI_SERVICE_URL || "http://ai-service:8001",
  analytics: process.env.ANALYTICS_SERVICE_URL || "http://api-golang:3004",
  invoiceParser: process.env.INVOICE_PARSER_URL || "http://invoice-parser:8005",
  purchaseService: process.env.PURCHASE_SERVICE_URL || "http://purchase-service:8006",
}

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), services: Object.keys(services), version: process.env.APP_VERSION || "1.0.0" })
})

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    pathRewrite: {
      "^/api/auth": "",
    },
    on: {
      error: (err: any, req: any, res: any) => {
        console.error("[API Gateway] Auth service error:", err)
        ;(res as Response).status(503).json({ error: "Auth service unavailable" })
      },
    },
  })
)

app.use(
  "/api/orders",
  authenticateToken,
  createProxyMiddleware({
    target: services.orders,
    changeOrigin: true,
    pathRewrite: { "^/api/orders": "" },
    on: {
      proxyReq: (proxyReq: any, req: AuthenticatedRequest) => {
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "")
          proxyReq.setHeader("X-User-Role", req.user.role || "")
        }
      },
      error: (err: any, req: any, res: any) => {
        console.error("[API Gateway] Orders service error:", err)
        ;(res as Response).status(503).json({ error: "Orders service unavailable" })
      },
    },
  })
)

app.use(
  "/api/campaigns",
  authenticateToken,
  createProxyMiddleware({
    target: services.campaigns,
    changeOrigin: true,
    pathRewrite: { "^/api/campaigns": "" },
    on: {
      proxyReq: (proxyReq: any, req: AuthenticatedRequest) => {
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "")
          proxyReq.setHeader("X-User-Role", req.user.role || "")
        }
      },
      error: (err: any, req: any, res: any) => {
        console.error("[API Gateway] Campaigns service error:", err)
        ;(res as Response).status(503).json({ error: "Campaigns service unavailable" })
      },
    },
  })
)

app.use(
  "/api/ai",
  authenticateToken,
  createProxyMiddleware({
    target: services.ai,
    changeOrigin: true,
    pathRewrite: { "^/api/ai": "" },
    on: {
      proxyReq: (proxyReq: any, req: AuthenticatedRequest) => {
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "")
          proxyReq.setHeader("X-User-Role", req.user.role || "")
        }
      },
      error: (err: any, req: any, res: any) => {
        console.error("[API Gateway] AI service error:", err)
        ;(res as Response).status(503).json({ error: "AI service unavailable" })
      },
    },
  })
)

app.use(
  "/api/analytics",
  authenticateToken,
  createProxyMiddleware({
    target: services.analytics,
    changeOrigin: true,
    pathRewrite: { "^/api/analytics": "" },
    on: {
      proxyReq: (proxyReq: any, req: AuthenticatedRequest) => {
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "")
          proxyReq.setHeader("X-User-Role", req.user.role || "")
        }
      },
      error: (err: any, req: any, res: any) => {
        console.error("[API Gateway] Analytics service error:", err)
        ;(res as Response).status(503).json({ error: "Analytics service unavailable" })
      },
    },
  })
)

app.use(
  "/api/invoices",
  authenticateToken,
  createProxyMiddleware({
    target: services.invoiceParser,
    changeOrigin: true,
    pathRewrite: { "^/api/invoices": "/api/v1/invoices" },
    on: {
      proxyReq: (proxyReq: any, req: AuthenticatedRequest) => {
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "")
          proxyReq.setHeader("X-User-Role", req.user.role || "")
        }
      },
      error: (err: any, req: any, res: any) => {
        console.error("[API Gateway] Invoice parser service error:", err)
        ;(res as Response).status(503).json({ error: "Invoice parser service unavailable" })
      },
    },
  })
)

app.use(
  "/api/purchases",
  authenticateToken,
  createProxyMiddleware({
    target: services.purchaseService,
    changeOrigin: true,
    pathRewrite: { "^/api/purchases": "/api/v1" },
    on: {
      proxyReq: (proxyReq: any, req: AuthenticatedRequest) => {
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "")
          proxyReq.setHeader("X-User-Role", req.user.role || "")
        }
      },
      error: (err: any, req: any, res: any) => {
        console.error("[API Gateway] Purchase service error:", err)
        ;(res as Response).status(503).json({ error: "Purchase service unavailable" })
      },
    },
  })
)

app.use(
  "/api/sales",
  authenticateToken,
  createProxyMiddleware({
    target: services.invoiceParser,
    changeOrigin: true,
    pathRewrite: { "^/api/sales": "/api/v1/sales" },
    on: {
      proxyReq: (proxyReq: any, req: AuthenticatedRequest) => {
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "")
          proxyReq.setHeader("X-User-Role", req.user.role || "")
        }
      },
      error: (err: any, req: any, res: any) => {
        console.error("[API Gateway] Sales service error:", err)
        ;(res as Response).status(503).json({ error: "Sales service unavailable" })
      },
    },
  })
)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[API Gateway] Unhandled error:", err)
  res.status(500).json({ error: "Internal server error", requestId: (req.headers["x-request-id"] as string) || "unknown" })
})

app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl, method: req.method })
})

app.listen(PORT, () => {
  console.log(`[API Gateway] Server running on port ${PORT}`)
  console.log(`[API Gateway] Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`[API Gateway] Services configured:`, Object.keys(services))
})

export default app
