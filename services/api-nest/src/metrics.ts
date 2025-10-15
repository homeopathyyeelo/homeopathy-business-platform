import { Injectable, NestMiddleware } from "@nestjs/common"
import { Request, Response } from "express"
import * as client from "prom-client"

const register = new client.Registry()
client.collectDefaultMetrics({ register })

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    res.setHeader("X-Request-Start", Date.now().toString())
    next()
  }
}

export const metricsHandler = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", register.contentType)
  res.end(await register.metrics())
}
