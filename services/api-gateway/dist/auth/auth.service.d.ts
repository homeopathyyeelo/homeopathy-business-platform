import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
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
    refreshToken(refreshToken: string): Promise<{
        success: boolean;
        data: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    }>;
    validateUser(userId: string): Promise<User>;
    private generateTokens;
    private sanitizeUser;
}
//# sourceMappingURL=auth.service.d.ts.map