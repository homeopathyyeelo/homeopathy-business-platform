import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
            user: {
                id: string;
                email: string;
                name: string;
                role: string;
                permissions: string[];
                isActive: boolean;
                shopId: string;
                lastLogin: Date;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        success: boolean;
        message: string;
        data: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
            user: {
                id: string;
                email: string;
                name: string;
                role: string;
                permissions: string[];
                isActive: boolean;
                shopId: string;
                lastLogin: Date;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    }>;
    refresh(refreshToken: string): Promise<{
        success: boolean;
        data: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    }>;
    getProfile(req: any): Promise<any>;
    logout(req: any): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map