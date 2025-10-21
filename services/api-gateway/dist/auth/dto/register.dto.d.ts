export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ACCOUNTANT = "ACCOUNTANT",
    INVENTORY_MANAGER = "INVENTORY_MANAGER",
    SALES_REP = "SALES_REP",
    PURCHASE_MANAGER = "PURCHASE_MANAGER",
    WAREHOUSE_STAFF = "WAREHOUSE_STAFF",
    HR_MANAGER = "HR_MANAGER",
    MARKETING = "MARKETING",
    ANALYST = "ANALYST",
    CASHIER = "CASHIER"
}
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role?: string;
}
//# sourceMappingURL=register.dto.d.ts.map