-- ============================================================================
-- SUPER ADMIN SEED DATA
-- Creates the initial super admin user with proper password hashing
-- ============================================================================

BEGIN;

-- Insert Super Admin Role
INSERT INTO roles (id, name, description, is_system)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'SUPERADMIN', 'Super Administrator with full system access', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert Super Admin User
-- Password: Medicine@2024 (hashed with bcrypt cost 10)
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    display_name,
    is_active,
    is_verified
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'medicine@yeelohomeopathy.com',
    '$2a$10$YQ5LQ5LQ5LQ5LQ5LQ5LQ5O5YXqZ1YxYvK8Gx7wZ5YQ5LQ5LQ5LQ5L',  -- This will be replaced by Go script
    'Super',
    'Admin',
    'Super Admin',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_active = TRUE,
    is_verified = TRUE;

-- Assign Super Admin Role to User
INSERT INTO user_roles (user_id, role_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Grant ALL permissions to Super Admin role (will be created by app)
-- This is handled by the application logic

COMMIT;
