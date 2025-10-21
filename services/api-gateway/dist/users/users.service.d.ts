import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findAll(role?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        data: {
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
    }>;
    update(id: string, updateData: Partial<User>): Promise<{
        success: boolean;
        message: string;
        data: {
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
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private sanitizeUser;
}
//# sourceMappingURL=users.service.d.ts.map