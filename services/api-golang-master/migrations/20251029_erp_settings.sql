-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- BRANCHES
-- =========================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  parent_id UUID NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  manager_id UUID NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_parent_id ON branches(parent_id);
CREATE INDEX IF NOT EXISTS idx_branches_name ON branches(name);

-- =========================
-- TAX SLABS
-- =========================
CREATE TABLE IF NOT EXISTS tax_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slab_name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  category VARCHAR(50),
  effective_from TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tax_slabs_name ON tax_slabs(slab_name);
CREATE INDEX IF NOT EXISTS idx_tax_slabs_active ON tax_slabs(is_active);

-- =========================
-- HSN CODES
-- =========================
CREATE TABLE IF NOT EXISTS hsn_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hsn_code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  gst_rate NUMERIC(5,2),
  cess_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hsn_codes_active ON hsn_codes(is_active);

-- =========================
-- ROLES
-- =========================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  level INT NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- =========================
-- PERMISSIONS
-- =========================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active);

-- =========================
-- ROLE PERMISSIONS
-- =========================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- =========================
-- PAYMENT METHODS
-- =========================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

-- =========================
-- GATEWAY CONFIGS
-- =========================
CREATE TABLE IF NOT EXISTS gateway_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gateway_configs_type ON gateway_configs(type);
CREATE INDEX IF NOT EXISTS idx_gateway_configs_active ON gateway_configs(is_active);

-- =========================
-- INTEGRATION SETTINGS
-- =========================
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  api_key VARCHAR(500),
  meta JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_integration_settings_provider ON integration_settings(provider);
CREATE INDEX IF NOT EXISTS idx_integration_settings_active ON integration_settings(is_active);

-- =========================
-- AI MODEL CONFIGS
-- =========================
CREATE TABLE IF NOT EXISTS ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(150) NOT NULL,
  endpoint VARCHAR(500),
  api_key VARCHAR(500),
  params JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_model_name ON ai_model_configs(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_active ON ai_model_configs(is_active);

-- =========================
-- SYSTEM BACKUPS
-- =========================
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL
);
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups(created_at);

-- =========================
-- UNITS
-- =========================
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20) NOT NULL,
  base_unit_id UUID NULL,
  conversion_factor NUMERIC(12,6) NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_units_base FOREIGN KEY(base_unit_id) REFERENCES units(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_units_name ON units(name);
CREATE INDEX IF NOT EXISTS idx_units_active ON units(is_active);

-- =========================
-- OPTIONAL FKs (no-ops if columns missing)
-- =========================
-- Add parent_id FK after branches is created (self-reference)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='parent_id') THEN
    ALTER TABLE branches
    ADD CONSTRAINT IF NOT EXISTS fk_branches_parent FOREIGN KEY(parent_id) REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Touch updated_at on UPDATE using triggers (generic helper)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT table_name FROM information_schema.columns WHERE column_name='updated_at' AND table_schema='public' LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', r.table_name, r.table_name);
  END LOOP;
END $$;
