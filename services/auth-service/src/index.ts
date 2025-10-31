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

import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Pool } from "pg"
import type { Request, Response } from "express"
import client from "prom-client"
import { generateKeyPair, exportJWK, importJWK, SignJWT, JWK, jwtVerify } from "jose"
import swaggerUi from "swagger-ui-express"

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

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
}
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi))

const pool = new Pool({
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || "5433"),
  database: process.env.DB_NAME || process.env.POSTGRES_DB || "yeelo_homeopathy",
  user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

app.use(express.json())

// Prometheus metrics
const register = new client.Registry()
client.collectDefaultMetrics({ register })
const httpRequestCounter = new client.Counter({
  name: "auth_http_requests_total",
  help: "Total number of HTTP requests for auth service",
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

// RSA keys & JWKS setup
let publicJwk: JWK | null = null
let privateKey: any = null

async function ensureKeys() {
  if (process.env.JWT_PRIVATE_JWK && process.env.JWT_PUBLIC_JWK) {
    publicJwk = JSON.parse(process.env.JWT_PUBLIC_JWK)
    const privateJwk = JSON.parse(process.env.JWT_PRIVATE_JWK)
    privateKey = await importJWK(privateJwk, "RS256")
    return
  }
  const { publicKey, privateKey: pk } = await generateKeyPair("RS256")
  privateKey = pk
  publicJwk = await exportJWK(publicKey)
  ;(publicJwk as any).kid = (publicJwk as any).kid || "yeelo-auth-1"
}

function getIssuer() {
  return process.env.JWT_ISSUER || "urn:yeelo:auth"
}

app.get("/.well-known/jwks.json", async (_req: Request, res: Response) => {
  if (!publicJwk) {
    await ensureKeys()
  }
  res.json({ keys: [publicJwk] })
})

async function signAccessToken(payload: { id: string; email: string; role: string }) {
  if (!privateKey || !publicJwk) {
    await ensureKeys()
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h"
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "RS256", kid: (publicJwk as any).kid || "yeelo-auth-1" })
    .setIssuedAt()
    .setIssuer(getIssuer())
    .setAudience("yeelo-clients")
    .setExpirationTime(expiresIn)
    .sign(privateKey)
}

async function fetchUserPermissions(userId: string) {
  const { rows } = await pool.query(
    `SELECT DISTINCT p.code
     FROM role_permissions rp
     JOIN permissions p ON rp.permission_id = p.id
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = $1
     UNION
     SELECT DISTINCT p2.code
     FROM user_permissions up
     JOIN permissions p2 ON up.permission_id = p2.id
     WHERE up.user_id = $1`,
    [userId],
  )
  return rows.map((row) => row.code)
}

async function issueTokenPair(user: any) {
  const accessToken = await signAccessToken({ id: user.id, email: user.email, role: user.role })
  const refreshTtl = Number.parseInt(process.env.REFRESH_TTL_DAYS || "30")
  const refreshToken = cryptoRandomString()
  await pool.query(
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id UUID NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked BOOLEAN NOT NULL DEFAULT FALSE
    )`
  )
  await pool.query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at, revoked)
     VALUES ($1, $2, NOW() + INTERVAL '${refreshTtl} days', FALSE)`,
    [refreshToken, user.id]
  )
  return { accessToken, refreshToken }
}

function cryptoRandomString() {
  const buf = Buffer.alloc(32)
  require("crypto").randomFillSync(buf)
  return buf.toString("base64url")
}

function buildFullName(row: any) {
  if (row.full_name) return row.full_name
  const combined = `${row.first_name || ""} ${row.last_name || ""}`.trim()
  if (combined) return combined
  return row.email
}

async function buildUserResponse(row: any) {
  const permissions = await fetchUserPermissions(row.id)
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: buildFullName(row),
    role: row.role,
    isActive: row.is_active,
    isSuperAdmin: row.is_super_admin ?? false,
    permissions,
  }
}

async function createSessionRecord(user: any, accessToken: string, refreshToken: string | null, req: Request) {
  const decoded = (jwt.decode(accessToken) as any) || {}
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000)

  await pool.query(
    `INSERT INTO user_sessions (user_id, session_token, refresh_token, session_data, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (session_token) DO UPDATE SET
       refresh_token = EXCLUDED.refresh_token,
       session_data = EXCLUDED.session_data,
       ip_address = EXCLUDED.ip_address,
       user_agent = EXCLUDED.user_agent,
       expires_at = EXCLUDED.expires_at,
       last_activity_at = NOW()`,
    [
      user.id,
      accessToken,
      refreshToken,
      JSON.stringify({ permissions: await fetchUserPermissions(user.id) }),
      req.ip,
      req.get("User-Agent"),
      expiresAt,
    ],
  )
}

app.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role = "customer" } = req.body

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "All fields are required" })
    }

    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User already exists" })
    }

    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, first_name, last_name, role, created_at, updated_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), TRUE)
       RETURNING id, email, full_name, first_name, last_name, role, is_active, is_super_admin`,
      [email.trim().toLowerCase(), hashedPassword, `${firstName} ${lastName}`.trim(), firstName, lastName, role]
    )

    const userRow = result.rows[0]

    // Ensure user has corresponding role mapping
    const roleQuery = await pool.query("SELECT id FROM roles WHERE name = $1", [role])
    if (roleQuery.rows.length > 0) {
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [userRow.id, roleQuery.rows[0].id]
      )
    }

    const tokens = await issueTokenPair(userRow)
    await createSessionRecord(userRow, tokens.accessToken, tokens.refreshToken, req)

    const user = await buildUserResponse(userRow)

    res.status(201).json({
      message: "User registered successfully",
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  } catch (error) {
    console.error("[Auth Service] Registration error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    console.log("[Auth Service] Login attempt", { email })

    const result = await pool.query(
      `SELECT id, email, full_name, first_name, last_name, role, is_active, is_super_admin, password_hash
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    )

    if (result.rows.length === 0) {
      console.log("[Auth Service] User not found", { email })
      return res.status(401).json({ error: "Invalid credentials" })
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const userRow = result.rows[0]
    if (!userRow.is_active) {
      return res.status(401).json({ error: "Account is deactivated" })
    }

    const isValidPassword = await bcrypt.compare(password, userRow.password_hash)
    if (!isValidPassword) {
      console.log("[Auth Service] Invalid password", {
        email,
        storedHash: userRow.password_hash,
        hashLength: userRow.password_hash?.length,
      })
    } else {
      console.log("[Auth Service] Password validated", { email })
    }
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const tokens = await issueTokenPair(userRow)
    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [userRow.id])
    await createSessionRecord(userRow, tokens.accessToken, tokens.refreshToken, req)

    const user = await buildUserResponse(userRow)

    res.json({
      message: "Login successful",
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  } catch (error) {
    console.error("[Auth Service] Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/token/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken is required" })
    }

    await pool.query(
      `CREATE TABLE IF NOT EXISTS refresh_tokens (
        token TEXT PRIMARY KEY,
        user_id UUID NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE
      )`
    )

    const result = await pool.query(
      `SELECT user_id, expires_at, revoked FROM refresh_tokens WHERE token = $1`,
      [refreshToken]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid refresh token" })
    }

    const row = result.rows[0]
    if (row.revoked || new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: "Expired or revoked refresh token" })
    }

    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`, [refreshToken])

    const userRes = await pool.query(
      `SELECT id, email, role FROM users WHERE id = $1 AND is_active = TRUE`,
      [row.user_id]
    )
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "User not found or inactive" })
    }
    const user = userRes.rows[0]

    const tokens = await issueTokenPair(user)
    await createSessionRecord(user, tokens.accessToken, tokens.refreshToken, req)
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
  } catch (error) {
    console.error("[Auth Service] Refresh error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/validate", async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: "Token is required" })
    }

    try {
      if (!privateKey) {
        await ensureKeys()
      }
      const verification = await jwtVerify(token, privateKey, {
        issuer: getIssuer(),
        audience: "yeelo-clients",
      })
      const userId = verification.payload.id as string
      const result = await pool.query(
        `SELECT id, email, full_name, first_name, last_name, role, is_active, is_super_admin
         FROM users WHERE id = $1`,
        [userId]
      )
      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(401).json({ error: "Invalid token" })
      }
      const user = await buildUserResponse(result.rows[0])
      return res.json({ valid: true, user })
    } catch (err) {
      console.error("[Auth Service] Token validation error:", err)
      return res.status(401).json({ error: "Invalid token" })
    }
  } catch (error) {
    console.error("[Auth Service] Token validation error:", error)
    res.status(401).json({ error: "Invalid token" })
  }
})

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() })
})

app.listen(PORT, async () => {
  await ensureKeys()
  console.log(`[Auth Service] Server running on port ${PORT}`)
})

export default app
