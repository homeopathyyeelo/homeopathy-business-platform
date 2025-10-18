-- ═══════════════════════════════════════════════════════════════
-- DATABASE INITIALIZATION SCRIPT
-- Creates extensions, schemas, and base configuration
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create application schema
CREATE SCHEMA IF NOT EXISTS public;

-- Set search path
ALTER DATABASE yeelo_homeopathy SET search_path TO public;

-- Create audit log function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE yeelo_homeopathy TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Create application user (if needed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'yeelo_app') THEN
        CREATE USER yeelo_app WITH PASSWORD 'yeelo_app_password';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE yeelo_homeopathy TO yeelo_app;
GRANT USAGE ON SCHEMA public TO yeelo_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yeelo_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yeelo_app;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yeelo_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yeelo_app;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database yeelo_homeopathy initialized successfully';
END
$$;
