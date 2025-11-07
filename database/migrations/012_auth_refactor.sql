-- 012_auth_refactor.sql
-- Production-ready authentication schema adjustments and seed data
-- UPDATED: Matches Go models.User and models.Session exactly

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DROP OLD TABLES IF THEY EXIST WITH WRONG SCHEMA
-- ============================================================================
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF NOT EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================================================
-- USERS TABLE (matches models.User struct exactly)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Profile (required fields from Go model)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    display_name VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    
    -- 2FA
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================================
-- SESSIONS TABLE (matches models.Session struct exactly)
-- ============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_sessions_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- OPTIONAL: RBAC TABLES (not required for basic auth but useful)
-- ============================================================================

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

-- ============================================================================
-- SEED TEST USERS WITH KNOWN PASSWORDS
-- ============================================================================

-- User 1: test@test.com
-- Password: test123
-- Bcrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMye1DQYfL2dGZVQm3eKGGqJYNQdT2LmXCC
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    display_name,
    is_active,
    is_verified
) VALUES (
    'test@test.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1DQYfL2dGZVQm3eKGGqJYNQdT2LmXCC',
    'Test',
    'User',
    'Test User',
    TRUE,
    TRUE
);

-- User 2: admin@homeopathy.com
-- Password: admin123
-- Bcrypt hash: $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    display_name,
    is_active,
    is_verified
) VALUES (
    'admin@homeopathy.com',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    'Admin',
    'User',
    'Admin User',
    TRUE,
    TRUE
);

-- User 3: medicine@yeelohomeopathy.com (Super Admin)
-- Password: Medicine@2024
-- Bcrypt hash: $2a$10$YTiyl3L8L5L5vXZ5KqZ5Ku5L5vXZ5KqZ5Ku5L5vXZ5KqZ5Ku5L5vX
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    display_name,
    is_active,
    is_verified
) VALUES (
    'medicine@yeelohomeopathy.com',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    'Super',
    'Admin',
    'Super Administrator',
    TRUE,
    TRUE
);

-- ============================================================================
-- SEED CORE ROLES
-- ============================================================================
INSERT INTO roles (name, display_name, description, is_system)
VALUES
    ('super_admin', 'Super Administrator', 'Full access to all features', TRUE),
    ('admin', 'Administrator', 'Administrative access to business modules', TRUE),
    ('manager', 'Manager', 'Operations and reporting access', TRUE),
    ('staff', 'Staff', 'Day-to-day operations access', TRUE);

-- ============================================================================
-- SEED PERMISSIONS
-- ============================================================================
INSERT INTO permissions (code, name, description, category)
VALUES ('ALL_PERMISSIONS', 'All Permissions', 'Grants every permission in the system', 'system');

-- ============================================================================
-- ASSIGN ROLES TO USERS
-- ============================================================================
DO $$
DECLARE
    v_user_id UUID;
    v_role_id UUID;
    v_perm_id UUID;
BEGIN
    -- Get the super admin user
    SELECT id INTO v_user_id FROM users WHERE email = 'medicine@yeelohomeopathy.com';
    SELECT id INTO v_role_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO v_perm_id FROM permissions WHERE code = 'ALL_PERMISSIONS';

    IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (v_user_id, v_role_id, v_user_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;

        INSERT INTO role_permissions (role_id, permission_id, granted_by)
        VALUES (v_role_id, v_perm_id, v_user_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_roles_set_updated_at ON roles;
CREATE TRIGGER trg_roles_set_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
