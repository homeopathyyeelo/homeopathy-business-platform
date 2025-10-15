"use strict";
/**
 * Authentication Microservice
 * Handles user authentication, authorization, and JWT token management
 *
 * Learning Notes:
 * - Dedicated service for all authentication concerns
 * - Uses bcrypt for password hashing
 * - Implements JWT token generation and validation
 * - Includes user registration, login, and profile management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("pg");
const prom_client_1 = __importDefault(require("prom-client"));
const jose_1 = require("jose");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// CORS configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
// Minimal OpenAPI spec for docs
const openapi = {
    openapi: "3.0.0",
    info: { title: "Auth Service", version: "1.0.0" },
    paths: {
        "/register": { post: { summary: "Register user", responses: { 201: { description: "Created" } } } },
        "/login": { post: { summary: "Login", responses: { 200: { description: "OK" } } } },
        "/validate": { post: { summary: "Validate token", responses: { 200: { description: "OK" } } } },
        "/token/refresh": { post: { summary: "Refresh token", responses: { 200: { description: "OK" } } } },
        "/health": { get: { summary: "Health", responses: { 200: { description: "OK" } } } },
    },
};
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi));
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "yeelo_homeopathy",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
app.use(express_1.default.json());
// Prometheus metrics
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register });
const httpRequestCounter = new prom_client_1.default.Counter({
    name: "auth_http_requests_total",
    help: "Total number of HTTP requests for auth service",
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
// RSA keys & JWKS setup
let publicJwk = null;
let privateKey = null;
async function ensureKeys() {
    if (process.env.JWT_PRIVATE_JWK && process.env.JWT_PUBLIC_JWK) {
        publicJwk = JSON.parse(process.env.JWT_PUBLIC_JWK);
        const privateJwk = JSON.parse(process.env.JWT_PRIVATE_JWK);
        privateKey = await (0, jose_1.importJWK)(privateJwk, "RS256");
        return;
    }
    const { publicKey, privateKey: pk } = await (0, jose_1.generateKeyPair)("RS256");
    privateKey = pk;
    publicJwk = await (0, jose_1.exportJWK)(publicKey);
    publicJwk.kid = publicJwk.kid || "yeelo-auth-1";
}
function getIssuer() {
    return process.env.JWT_ISSUER || "urn:yeelo:auth";
}
app.get("/.well-known/jwks.json", async (_req, res) => {
    if (!publicJwk) {
        await ensureKeys();
    }
    res.json({ keys: [publicJwk] });
});
async function signAccessToken(payload) {
    if (!privateKey || !publicJwk) {
        await ensureKeys();
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || "24h";
    return await new jose_1.SignJWT(payload)
        .setProtectedHeader({ alg: "RS256", kid: publicJwk.kid || "yeelo-auth-1" })
        .setIssuedAt()
        .setIssuer(getIssuer())
        .setAudience("yeelo-clients")
        .setExpirationTime(expiresIn)
        .sign(privateKey);
}
async function issueTokenPair(user) {
    const accessToken = await signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshTtl = Number.parseInt(process.env.REFRESH_TTL_DAYS || "30");
    const refreshToken = cryptoRandomString();
    await pool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id UUID NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked BOOLEAN NOT NULL DEFAULT FALSE
    )`);
    await pool.query(`INSERT INTO refresh_tokens (token, user_id, expires_at, revoked)
     VALUES ($1, $2, NOW() + INTERVAL '${refreshTtl} days', FALSE)`, [refreshToken, user.id]);
    return { accessToken, refreshToken };
}
function cryptoRandomString() {
    const buf = Buffer.alloc(32);
    require("crypto").randomFillSync(buf);
    return buf.toString("base64url");
}
app.post("/register", async (req, res) => {
    try {
        const { email, password, firstName, lastName, role = "customer" } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "User already exists" });
        }
        const saltRounds = 12;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const result = await pool.query(`INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at, is_active)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), TRUE)
       RETURNING id, email, first_name, last_name, role, created_at`, [email, hashedPassword, firstName, lastName, role]);
        const user = result.rows[0];
        const tokens = await issueTokenPair(user);
        await pool.query(`INSERT INTO user_events (user_id, event_type, event_data, created_at)
       VALUES ($1, 'registration', $2, NOW())`, [user.id, JSON.stringify({ ip: req.ip, userAgent: req.get("User-Agent") })]);
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                createdAt: user.created_at,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }
    catch (error) {
        console.error("[Auth Service] Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const result = await pool.query("SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const user = result.rows[0];
        if (!user.is_active) {
            return res.status(401).json({ error: "Account is deactivated" });
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const tokens = await issueTokenPair(user);
        await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
        await pool.query(`INSERT INTO user_events (user_id, event_type, event_data, created_at)
       VALUES ($1, 'login', $2, NOW())`, [user.id, JSON.stringify({ ip: req.ip, userAgent: req.get("User-Agent") })]);
        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }
    catch (error) {
        console.error("[Auth Service] Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/token/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: "refreshToken is required" });
        }
        await pool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens (
        token TEXT PRIMARY KEY,
        user_id UUID NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE
      )`);
        const result = await pool.query(`SELECT user_id, expires_at, revoked FROM refresh_tokens WHERE token = $1`, [refreshToken]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
        const row = result.rows[0];
        if (row.revoked || new Date(row.expires_at) < new Date()) {
            return res.status(401).json({ error: "Expired or revoked refresh token" });
        }
        await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`, [refreshToken]);
        const userRes = await pool.query(`SELECT id, email, role FROM users WHERE id = $1 AND is_active = TRUE`, [row.user_id]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: "User not found or inactive" });
        }
        const user = userRes.rows[0];
        const tokens = await issueTokenPair(user);
        res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    }
    catch (error) {
        console.error("[Auth Service] Refresh error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/validate", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "fallback-secret");
            const result = await pool.query("SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1", [decoded.id]);
            if (result.rows.length === 0 || !result.rows[0].is_active) {
                return res.status(401).json({ error: "Invalid token" });
            }
            const user = result.rows[0];
            return res.json({
                valid: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                },
            });
        }
        catch { }
        return res.json({ valid: true });
    }
    catch (error) {
        console.error("[Auth Service] Token validation error:", error);
        res.status(401).json({ error: "Invalid token" });
    }
});
app.get("/health", (req, res) => {
    res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() });
});
app.listen(PORT, async () => {
    await ensureKeys();
    console.log(`[Auth Service] Server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map