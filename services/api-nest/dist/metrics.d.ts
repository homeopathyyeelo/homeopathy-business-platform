import { NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";
export declare class MetricsMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: () => void): void;
}
export declare const metricsHandler: (_req: Request, res: Response) => Promise<void>;
