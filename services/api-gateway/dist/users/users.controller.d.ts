import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    update(id: string, updateData: any): Promise<{
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
}
//# sourceMappingURL=users.controller.d.ts.map