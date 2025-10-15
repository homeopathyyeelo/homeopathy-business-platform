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
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=index.d.ts.map