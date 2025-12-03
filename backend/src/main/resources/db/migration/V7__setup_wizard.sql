-- Installation state table (singleton pattern)
CREATE TABLE installation_state (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'INSTALLATION_STATE',
    state VARCHAR(20) NOT NULL DEFAULT 'UNCONFIGURED',
    configured_at TIMESTAMPTZ,
    configured_by_ip VARCHAR(45),
    configured_by_user_agent VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_installation_state CHECK (state IN ('UNCONFIGURED', 'CONFIGURED'))
);

-- Insert initial state
INSERT INTO installation_state (id, state, created_at, updated_at)
VALUES ('INSTALLATION_STATE', 'UNCONFIGURED', NOW(), NOW());

-- Mobile link table (connection to Mobile App backend)
CREATE TABLE mobile_link (
    id UUID PRIMARY KEY,
    mobile_company_id UUID NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    service_token_enc VARCHAR(512) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_mobile_link_company ON mobile_link (mobile_company_id);

