import { PrismaClient } from "../generated/client/index.js"

export const prisma = new PrismaClient()

export default prisma

// Re-export Prisma types and enums
export * from "../generated/client/index.js"