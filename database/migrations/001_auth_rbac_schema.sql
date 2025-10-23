-- =====================================================
-- AUTHENTICATION & RBAC DATABASE SCHEMA
-- HomeoERP v2.1.0
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_is_super_admin ON users(is_super_admin);

-- =====================================================
-- ROLES TABLE
-- =====================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_active ON roles(is_active);

-- =====================================================
-- PERMISSIONS TABLE
-- Module-Action based permissions
-- =====================================================
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    module VARCHAR(100) NOT NULL,  -- e.g., 'products', 'sales', 'inventory'
    action VARCHAR(100) NOT NULL,  -- e.g., 'view', 'create', 'edit', 'delete', 'export'
    resource VARCHAR(100),          -- e.g., 'list', 'details', 'reports'
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module, action, resource)
);

-- Create indexes
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_module_action ON permissions(module, action);

-- =====================================================
-- USER_ROLES TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- =====================================================
-- ROLE_PERMISSIONS TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    UNIQUE(role_id, permission_id)
);

-- Create indexes
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- =====================================================
-- USER_PERMISSIONS TABLE (Direct user permissions)
-- For special cases where user needs specific permissions
-- =====================================================
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, permission_id)
);

-- Create indexes
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);

-- =====================================================
-- USER_SESSIONS TABLE
-- JSON-based session management
-- =====================================================
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    session_data JSONB,  -- Store user data, permissions, etc.
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_session_data ON user_sessions USING gin(session_data);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default super admin user
-- Password: Admin@123 (hashed with bcrypt)
INSERT INTO users (
    email, username, password_hash, full_name, 
    is_active, is_super_admin, email_verified
) VALUES (
    'admin@homeoerp.com',
    'superadmin',
    '$2a$10$rQZ9vXqZ9vXqZ9vXqZ9vXuO7K8J9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ',  -- Change this!
    'Super Administrator',
    true,
    true,
    true
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
('super_admin', 'Super Administrator', 'Full system access', true),
('admin', 'Administrator', 'Full ERP access except system settings', true),
('manager', 'Manager', 'Can manage operations and view reports', true),
('staff', 'Staff', 'Can perform daily operations', true),
('cashier', 'Cashier', 'POS and billing only', true),
('accountant', 'Accountant', 'Finance and accounting access', true),
('inventory_manager', 'Inventory Manager', 'Inventory and purchase management', true),
('sales_manager', 'Sales Manager', 'Sales and customer management', true),
('viewer', 'Viewer', 'Read-only access', true);

-- Assign super_admin role to super admin user
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT 1, id, 1 FROM roles WHERE name = 'super_admin';

-- Insert all module permissions
-- Dashboard
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('dashboard', 'view', 'overview', 'View Dashboard', 'View main dashboard'),
('dashboard', 'view', 'kpis', 'View KPIs', 'View key performance indicators'),
('dashboard', 'view', 'analytics', 'View Analytics', 'View analytics dashboard');

-- Products
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('products', 'view', 'list', 'View Products', 'View product list'),
('products', 'create', NULL, 'Create Product', 'Create new product'),
('products', 'edit', NULL, 'Edit Product', 'Edit existing product'),
('products', 'delete', NULL, 'Delete Product', 'Delete product'),
('products', 'export', NULL, 'Export Products', 'Export product data'),
('products', 'import', NULL, 'Import Products', 'Import product data');

-- Inventory
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('inventory', 'view', 'list', 'View Inventory', 'View inventory list'),
('inventory', 'view', 'batches', 'View Batches', 'View batch details'),
('inventory', 'adjust', NULL, 'Adjust Stock', 'Adjust stock quantities'),
('inventory', 'transfer', NULL, 'Transfer Stock', 'Transfer stock between locations'),
('inventory', 'view', 'reports', 'View Inventory Reports', 'View inventory reports');

-- Sales
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('sales', 'view', 'list', 'View Sales', 'View sales list'),
('sales', 'create', 'order', 'Create Sale', 'Create new sale/order'),
('sales', 'edit', 'order', 'Edit Sale', 'Edit existing sale'),
('sales', 'delete', 'order', 'Delete Sale', 'Delete sale'),
('sales', 'view', 'reports', 'View Sales Reports', 'View sales reports'),
('sales', 'process', 'payment', 'Process Payment', 'Process sale payment'),
('sales', 'create', 'return', 'Create Return', 'Create sales return');

-- Purchases
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('purchases', 'view', 'list', 'View Purchases', 'View purchase orders'),
('purchases', 'create', 'po', 'Create PO', 'Create purchase order'),
('purchases', 'edit', 'po', 'Edit PO', 'Edit purchase order'),
('purchases', 'delete', 'po', 'Delete PO', 'Delete purchase order'),
('purchases', 'approve', 'po', 'Approve PO', 'Approve purchase order'),
('purchases', 'receive', 'grn', 'Receive GRN', 'Receive goods (GRN)');

-- Customers
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('customers', 'view', 'list', 'View Customers', 'View customer list'),
('customers', 'create', NULL, 'Create Customer', 'Create new customer'),
('customers', 'edit', NULL, 'Edit Customer', 'Edit customer details'),
('customers', 'delete', NULL, 'Delete Customer', 'Delete customer'),
('customers', 'view', 'ledger', 'View Customer Ledger', 'View customer ledger');

-- Vendors
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('vendors', 'view', 'list', 'View Vendors', 'View vendor list'),
('vendors', 'create', NULL, 'Create Vendor', 'Create new vendor'),
('vendors', 'edit', NULL, 'Edit Vendor', 'Edit vendor details'),
('vendors', 'delete', NULL, 'Delete Vendor', 'Delete vendor'),
('vendors', 'view', 'ledger', 'View Vendor Ledger', 'View vendor ledger');

-- Finance
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('finance', 'view', 'ledgers', 'View Ledgers', 'View financial ledgers'),
('finance', 'create', 'entry', 'Create Entry', 'Create journal entry'),
('finance', 'view', 'reports', 'View Finance Reports', 'View financial reports'),
('finance', 'view', 'gst', 'View GST', 'View GST reports'),
('finance', 'reconcile', 'bank', 'Bank Reconciliation', 'Perform bank reconciliation');

-- HR
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('hr', 'view', 'employees', 'View Employees', 'View employee list'),
('hr', 'create', 'employee', 'Create Employee', 'Create new employee'),
('hr', 'edit', 'employee', 'Edit Employee', 'Edit employee details'),
('hr', 'view', 'attendance', 'View Attendance', 'View attendance records'),
('hr', 'manage', 'payroll', 'Manage Payroll', 'Manage payroll');

-- Reports
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('reports', 'view', 'sales', 'View Sales Reports', 'View sales reports'),
('reports', 'view', 'purchase', 'View Purchase Reports', 'View purchase reports'),
('reports', 'view', 'inventory', 'View Inventory Reports', 'View inventory reports'),
('reports', 'view', 'finance', 'View Finance Reports', 'View finance reports'),
('reports', 'export', NULL, 'Export Reports', 'Export reports');

-- Analytics
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('analytics', 'view', 'dashboard', 'View Analytics', 'View analytics dashboard'),
('analytics', 'view', 'kpis', 'View KPIs', 'View key performance indicators'),
('analytics', 'view', 'forecasting', 'View Forecasting', 'View forecasting data');

-- Marketing
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('marketing', 'view', 'campaigns', 'View Campaigns', 'View marketing campaigns'),
('marketing', 'create', 'campaign', 'Create Campaign', 'Create marketing campaign'),
('marketing', 'send', 'campaign', 'Send Campaign', 'Send marketing campaign');

-- Settings
INSERT INTO permissions (module, action, resource, display_name, description) VALUES
('settings', 'view', 'company', 'View Company Settings', 'View company settings'),
('settings', 'edit', 'company', 'Edit Company Settings', 'Edit company settings'),
('settings', 'view', 'users', 'View Users', 'View user management'),
('settings', 'manage', 'users', 'Manage Users', 'Manage users and roles'),
('settings', 'view', 'system', 'View System Settings', 'View system settings'),
('settings', 'edit', 'system', 'Edit System Settings', 'Edit system settings');

-- Grant all permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'),
    id,
    1
FROM permissions;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id INTEGER,
    p_module VARCHAR,
    p_action VARCHAR,
    p_resource VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_super_admin BOOLEAN;
    v_has_permission BOOLEAN;
BEGIN
    -- Check if user is super admin
    SELECT is_super_admin INTO v_is_super_admin
    FROM users
    WHERE id = p_user_id AND is_active = true;
    
    IF v_is_super_admin THEN
        RETURN true;
    END IF;
    
    -- Check role permissions
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
        AND p.module = p_module
        AND p.action = p_action
        AND (p_resource IS NULL OR p.resource = p_resource OR p.resource IS NULL)
        AND p.is_active = true
    ) INTO v_has_permission;
    
    IF v_has_permission THEN
        RETURN true;
    END IF;
    
    -- Check direct user permissions
    SELECT EXISTS (
        SELECT 1
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
        AND p.module = p_module
        AND p.action = p_action
        AND (p_resource IS NULL OR p.resource = p_resource OR p.resource IS NULL)
        AND p.is_active = true
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE (
    module VARCHAR,
    action VARCHAR,
    resource VARCHAR,
    display_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.module,
        p.action,
        p.resource,
        p.display_name
    FROM permissions p
    WHERE p.is_active = true
    AND (
        -- Super admin gets all
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = p_user_id AND u.is_super_admin = true
        )
        OR
        -- Role permissions
        EXISTS (
            SELECT 1
            FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            WHERE ur.user_id = p_user_id
            AND rp.permission_id = p.id
        )
        OR
        -- Direct user permissions
        EXISTS (
            SELECT 1
            FROM user_permissions up
            WHERE up.user_id = p_user_id
            AND up.permission_id = p.id
        )
    )
    ORDER BY p.module, p.action;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE users IS 'User accounts with authentication details';
COMMENT ON TABLE roles IS 'User roles for RBAC';
COMMENT ON TABLE permissions IS 'Module-action based permissions';
COMMENT ON TABLE user_roles IS 'User to role assignments';
COMMENT ON TABLE role_permissions IS 'Role to permission assignments';
COMMENT ON TABLE user_permissions IS 'Direct user to permission assignments';
COMMENT ON TABLE user_sessions IS 'Active user sessions with JSON data';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
