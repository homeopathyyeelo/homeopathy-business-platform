-- 012_auth_refactor.sql
-- Production-ready authentication schema adjustments and seed data

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions catalog
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- User <-> Role mapping
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID,
    PRIMARY KEY (user_id, role_id)
);

-- Role <-> Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID,
    PRIMARY KEY (role_id, permission_id)
);

-- User-specific permissions overrides
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID,
    PRIMARY KEY (user_id, permission_id)
);

-- Session table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255),
    session_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Seed core roles
INSERT INTO roles (name, display_name, description, is_system)
VALUES
    ('super_admin', 'Super Administrator', 'Full access to all features', TRUE),
    ('admin', 'Administrator', 'Administrative access to business modules', TRUE),
    ('manager', 'Manager', 'Operations and reporting access', TRUE),
    ('staff', 'Staff', 'Day-to-day operations access', TRUE)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    is_system = EXCLUDED.is_system,
    updated_at = NOW();

-- Seed a catch-all permission used for super admin
INSERT INTO permissions (code, name, description, category)
VALUES ('ALL_PERMISSIONS', 'All Permissions', 'Grants every permission in the system', 'system')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = NOW();

-- Seed super admin user and ensure role mappings
DO $$
DECLARE
    v_user_id UUID;
    v_role_id UUID;
    v_perm_id UUID;
BEGIN
    INSERT INTO users (email, password_hash, full_name, first_name, last_name, role, is_active, is_super_admin, email_verified)
    VALUES (
        'medicine@yeelohomeopathy.com',
        '$2b$10$4/BOWLBqc8pDOhpKWKmHteB9/lNGWkBjmbqhvDWZcIsHu8Xa80uQS',
        'Super Administrator',
        'Super',
        'Administrator',
        'super_admin',
        TRUE,
        TRUE,
        TRUE
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        is_super_admin = TRUE,
        email_verified = TRUE,
        updated_at = NOW()
    RETURNING id INTO v_user_id;

    SELECT id INTO v_role_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO v_perm_id FROM permissions WHERE code = 'ALL_PERMISSIONS';

    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users WHERE email = 'medicine@yeelohomeopathy.com';
    END IF;

    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (v_user_id, v_role_id, v_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id, granted_by)
    VALUES (v_role_id, v_perm_id, v_user_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

COMMIT;
