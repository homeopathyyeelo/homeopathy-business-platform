import { AuthService } from '../auth.service';
declare const JwtStrategy_base: any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(payload: any): Promise<import("../../users/entities/user.entity").User>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map