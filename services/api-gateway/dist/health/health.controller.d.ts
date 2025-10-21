import { HealthCheckService, TypeOrmHealthIndicator, HttpHealthIndicator } from '@nestjs/terminus';
export declare class HealthController {
    private health;
    private db;
    private http;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, http: HttpHealthIndicator);
    check(): any;
}
//# sourceMappingURL=health.controller.d.ts.map