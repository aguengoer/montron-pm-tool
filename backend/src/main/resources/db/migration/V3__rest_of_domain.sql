CREATE TABLE streetwatch_day (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    workday_id UUID NOT NULL REFERENCES workday(id) ON DELETE CASCADE,
    license_plate VARCHAR(32),
    sw_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sw_day_workday ON streetwatch_day (workday_id);

CREATE TABLE streetwatch_entry (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    streetwatch_day_id UUID NOT NULL REFERENCES streetwatch_day(id) ON DELETE CASCADE,
    time TIME NOT NULL,
    km INT NOT NULL,
    lat NUMERIC(9, 6),
    lon NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sw_entry_day ON streetwatch_entry (streetwatch_day_id);

CREATE TABLE validation_issue (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    workday_id UUID NOT NULL REFERENCES workday(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    field_ref VARCHAR(128),
    delta JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_validation_workday ON validation_issue (workday_id);

CREATE TABLE release_action (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    workday_id UUID NOT NULL REFERENCES workday(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    pin_last4 VARCHAR(4) NOT NULL,
    released_at TIMESTAMPTZ NOT NULL,
    target_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_release_workday ON release_action (workday_id);

CREATE TABLE ingest_cursor (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    feed VARCHAR(32) NOT NULL,
    cursor TEXT,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX ux_ingest_cursor_company_feed ON ingest_cursor (company_id, feed);

CREATE TABLE idempotency_key (
    key VARCHAR(80) PRIMARY KEY,
    company_id UUID NOT NULL,
    request_hash VARCHAR(128) NOT NULL,
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE audit_entry (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    entity VARCHAR(32) NOT NULL,
    entity_id UUID NOT NULL,
    field VARCHAR(128),
    old_value JSONB,
    new_value JSONB,
    user_id UUID NOT NULL,
    at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_audit_entity ON audit_entry (entity, entity_id);

CREATE TABLE workday_layout_config (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    name VARCHAR(64) NOT NULL,
    document_type_tb VARCHAR(48) NOT NULL,
    document_type_rs VARCHAR(48) NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX ux_layout_company_name ON workday_layout_config (company_id, name);
