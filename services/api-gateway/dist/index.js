"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prom_client_1 = __importDefault(require("prom-client"));
const jose_1 = require("jose");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.type("html").send(`
    <h1>Yeelo API Gateway</h1>
    <ul>
      <li><a href="/api/auth/docs">Auth Service Docs</a></li>
      <li><a href="/api/orders/docs">Orders/Inventory Docs</a></li>
      <li><a href="/api/campaigns/docs">Campaigns Docs</a></li>
      <li><a href="/graphql">GraphQL Playground</a></li>
      <li><a href="/metrics">Gateway Metrics</a></li>
    </ul>
  `);
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Prometheus metrics
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register });
const httpRequestCounter = new prom_client_1.default.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "path", "status"],
});
register.registerMetric(httpRequestCounter);
app.use((req, res, next) => {
    const end = res.end;
    res.end = function (chunk, encoding, cb) {
        httpRequestCounter.inc({ method: req.method, path: req.path, status: res.statusCode });
        return end.apply(this, [chunk, encoding, cb]);
    };
    next();
});
app.get("/metrics", async (_req, res) => {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
});
const authServiceBase = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
const jwks = (0, jose_1.createRemoteJWKSet)(new URL(`${authServiceBase}/.well-known/jwks.json`));
async function verifyTokenRS256(token) {
    const issuer = process.env.JWT_ISSUER || "urn:yeelo:auth";
    const { payload } = await (0, jose_1.jwtVerify)(token, jwks, {
        issuer,
        audience: "yeelo-clients",
    });
    return payload;
}
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token)
            return res.status(401).json({ error: "Access token required" });
        // Prefer RS256 via JWKS
        try {
            const payload = await verifyTokenRS256(token);
            req.user = payload;
            return next();
        }
        catch (e) {
            // Fallback to HS256 if configured
            if (process.env.JWT_SECRET) {
                const user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                req.user = user;
                return next();
            }
            return res.status(403).json({ error: "Invalid or expired token" });
        }
    }
    catch (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};
const services = {
    auth: authServiceBase,
    orders: process.env.ORDERS_SERVICE_URL || "http://orders-service:3002",
    campaigns: process.env.CAMPAIGNS_SERVICE_URL || "http://campaigns-service:3003",
    ai: process.env.AI_SERVICE_URL || "http://ai-service:3004",
    analytics: process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:3005",
};
app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString(), services: Object.keys(services), version: process.env.APP_VERSION || "1.0.0" });
});
app.use("/api/auth", (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: services.auth,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "" },
    onError: (err, req, res) => {
        console.error("[API Gateway] Auth service error:", err);
        res.status(503).json({ error: "Auth service unavailable" });
    },
}));
app.use("/api/orders", authenticateToken, (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: services.orders,
    changeOrigin: true,
    pathRewrite: { "^/api/orders": "" },
    onProxyReq: (proxyReq, req) => {
        if (req.user) {
            proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "");
            proxyReq.setHeader("X-User-Role", req.user.role || "");
        }
    },
    onError: (err, req, res) => {
        console.error("[API Gateway] Orders service error:", err);
        res.status(503).json({ error: "Orders service unavailable" });
    },
}));
app.use("/api/campaigns", authenticateToken, (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: services.campaigns,
    changeOrigin: true,
    pathRewrite: { "^/api/campaigns": "" },
    onProxyReq: (proxyReq, req) => {
        if (req.user) {
            proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "");
            proxyReq.setHeader("X-User-Role", req.user.role || "");
        }
    },
    onError: (err, req, res) => {
        console.error("[API Gateway] Campaigns service error:", err);
        res.status(503).json({ error: "Campaigns service unavailable" });
    },
}));
app.use("/api/ai", authenticateToken, (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: services.ai,
    changeOrigin: true,
    pathRewrite: { "^/api/ai": "" },
    onProxyReq: (proxyReq, req) => {
        if (req.user) {
            proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "");
            proxyReq.setHeader("X-User-Role", req.user.role || "");
        }
    },
    onError: (err, req, res) => {
        console.error("[API Gateway] AI service error:", err);
        res.status(503).json({ error: "AI service unavailable" });
    },
}));
app.use("/api/analytics", authenticateToken, (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: services.analytics,
    changeOrigin: true,
    pathRewrite: { "^/api/analytics": "" },
    onProxyReq: (proxyReq, req) => {
        if (req.user) {
            proxyReq.setHeader("X-User-ID", req.user.id || req.user.sub || "");
            proxyReq.setHeader("X-User-Role", req.user.role || "");
        }
    },
    onError: (err, req, res) => {
        console.error("[API Gateway] Analytics service error:", err);
        res.status(503).json({ error: "Analytics service unavailable" });
    },
}));
app.use((err, req, res, next) => {
    console.error("[API Gateway] Unhandled error:", err);
    res.status(500).json({ error: "Internal server error", requestId: req.headers["x-request-id"] || "unknown" });
});
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found", path: req.originalUrl, method: req.method });
});
app.listen(PORT, () => {
    console.log(`[API Gateway] Server running on port ${PORT}`);
    console.log(`[API Gateway] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[API Gateway] Services configured:`, Object.keys(services));
});
exports.default = app;
//# sourceMappingURL=index.js.map