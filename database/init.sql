-- ============================================================
-- SecureCI Database Schema
-- PostgreSQL 15+ compatible
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- ── ENUMS ─────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'developer', 'security_engineer', 'project_manager');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM ('critical', 'high', 'medium', 'low', 'info');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE vuln_status AS ENUM ('open', 'fixed', 'accepted', 'false_positive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE repo_provider AS ENUM ('github', 'gitlab', 'bitbucket', 'local');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pipeline_trigger AS ENUM ('push', 'manual', 'schedule', 'webhook');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(100) UNIQUE NOT NULL,
    full_name       VARCHAR(200) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'developer',
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_superuser    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ── PROJECTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    security_score  FLOAT DEFAULT 0.0,
    grade           VARCHAR(5) DEFAULT 'C',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- ── PROJECT MEMBERS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        user_role NOT NULL DEFAULT 'developer',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- ── REPOSITORIES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repositories (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name                VARCHAR(200) NOT NULL,
    url                 VARCHAR(500) NOT NULL,
    provider            repo_provider NOT NULL DEFAULT 'github',
    default_branch      VARCHAR(100) DEFAULT 'main',
    is_private          BOOLEAN DEFAULT TRUE,
    webhook_url         VARCHAR(500),
    webhook_secret      VARCHAR(255),
    scan_count          INTEGER DEFAULT 0,
    vulnerability_count INTEGER DEFAULT 0,
    security_score      FLOAT DEFAULT 0.0,
    grade               VARCHAR(5) DEFAULT 'C',
    last_commit_sha     VARCHAR(40),
    last_commit_msg     TEXT,
    last_commit_author  VARCHAR(200),
    last_commit_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repos_project ON repositories(project_id);
CREATE INDEX IF NOT EXISTS idx_repos_url ON repositories(url);

-- ── PIPELINES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipelines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id   UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    trigger         pipeline_trigger NOT NULL DEFAULT 'manual',
    branch          VARCHAR(100) DEFAULT 'main',
    commit_sha      VARCHAR(40),
    commit_message  TEXT,
    status          scan_status NOT NULL DEFAULT 'pending',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    duration        INTEGER,  -- seconds
    triggered_by    VARCHAR(200),
    stages_result   JSONB,
    metadata        JSONB
);

CREATE INDEX IF NOT EXISTS idx_pipelines_repo ON pipelines(repository_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_status ON pipelines(status);
CREATE INDEX IF NOT EXISTS idx_pipelines_started ON pipelines(started_at DESC);

-- ── SCANS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    repository_id   UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    scanner_type    VARCHAR(50) NOT NULL,
    status          scan_status NOT NULL DEFAULT 'pending',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    duration        INTEGER,  -- seconds
    total_findings  INTEGER DEFAULT 0,
    critical        INTEGER DEFAULT 0,
    high            INTEGER DEFAULT 0,
    medium          INTEGER DEFAULT 0,
    low             INTEGER DEFAULT 0,
    info            INTEGER DEFAULT 0,
    score           FLOAT DEFAULT 0.0,
    raw_output      TEXT
);

CREATE INDEX IF NOT EXISTS idx_scans_pipeline ON scans(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_scans_repo ON scans(repository_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);

-- ── VULNERABILITIES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id             UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    severity            severity_level NOT NULL,
    scanner             VARCHAR(50) NOT NULL,
    file_path           VARCHAR(500),
    line_number         INTEGER,
    code_snippet        TEXT,
    cve_id              VARCHAR(50),
    cwe_id              VARCHAR(50),
    owasp_category      VARCHAR(20),
    cvss_score          FLOAT,
    fix_recommendation  TEXT,
    references          JSONB,
    status              vuln_status NOT NULL DEFAULT 'open',
    false_positive_reason TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vulns_scan ON vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulns_status ON vulnerabilities(status);
CREATE INDEX IF NOT EXISTS idx_vulns_cve ON vulnerabilities(cve_id) WHERE cve_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vulns_scanner ON vulnerabilities(scanner);

-- ── NOTIFICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(20) NOT NULL DEFAULT 'info',
    channel         VARCHAR(30) NOT NULL DEFAULT 'in_app',
    is_read         BOOLEAN DEFAULT FALSE,
    related_id      UUID,
    related_type    VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ── AUDIT LOGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    username        VARCHAR(100),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     VARCHAR(100),
    details         JSONB,
    ip_address      INET,
    user_agent      TEXT,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ── REPORTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(300) NOT NULL,
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    repository_id   UUID REFERENCES repositories(id) ON DELETE SET NULL,
    type            VARCHAR(30) NOT NULL,
    format          VARCHAR(10) NOT NULL DEFAULT 'pdf',
    file_path       VARCHAR(500),
    created_by      UUID NOT NULL REFERENCES users(id),
    scan_ids        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);

-- ── NOTIFICATION SETTINGS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_settings (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled       BOOLEAN DEFAULT TRUE,
    slack_webhook       VARCHAR(500),
    discord_webhook     VARCHAR(500),
    telegram_bot_token  VARCHAR(200),
    telegram_chat_id    VARCHAR(100),
    notify_critical     BOOLEAN DEFAULT TRUE,
    notify_high         BOOLEAN DEFAULT TRUE,
    notify_pipeline_fail BOOLEAN DEFAULT TRUE,
    notify_deploy_block  BOOLEAN DEFAULT TRUE,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── SCANNER CONFIG ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scanner_configs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID REFERENCES projects(id) ON DELETE CASCADE,
    bandit_enabled      BOOLEAN DEFAULT TRUE,
    semgrep_enabled     BOOLEAN DEFAULT TRUE,
    trivy_enabled       BOOLEAN DEFAULT TRUE,
    safety_enabled      BOOLEAN DEFAULT TRUE,
    pip_audit_enabled   BOOLEAN DEFAULT TRUE,
    gitleaks_enabled    BOOLEAN DEFAULT TRUE,
    severity_threshold  severity_level DEFAULT 'low',
    custom_rules        TEXT,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED: Default admin user (password: admin123) ─────────
INSERT INTO users (email, username, full_name, hashed_password, role, is_superuser)
VALUES (
    'admin@secureci.dev',
    'admin',
    'Alex Admin',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  -- admin123
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Trigger: update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_projects_updated
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
