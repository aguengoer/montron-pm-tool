CREATE TABLE employee (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    username VARCHAR(64) NOT NULL,
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    department VARCHAR(64),
    status VARCHAR(16) NOT NULL,
    etag VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX ux_employee_company_username ON employee (company_id, username);
CREATE INDEX idx_employee_company ON employee (company_id);
CREATE INDEX idx_employee_company_username ON employee (company_id, username);

CREATE TABLE workday (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee(id),
    work_date DATE NOT NULL,
    status VARCHAR(16) NOT NULL,
    has_tb BOOLEAN NOT NULL DEFAULT FALSE,
    has_rs BOOLEAN NOT NULL DEFAULT FALSE,
    has_streetwatch BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX ux_workday_company_employee_date ON workday (company_id, employee_id, work_date);
CREATE INDEX idx_workday_company_employee_date ON workday (company_id, employee_id, work_date);

CREATE TABLE tb_entry (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    workday_id UUID NOT NULL REFERENCES workday(id) ON DELETE CASCADE,
    source_submission_id UUID NOT NULL,
    start_time TIME,
    end_time TIME,
    break_minutes INT,
    travel_minutes INT,
    license_plate VARCHAR(32),
    department VARCHAR(64),
    overnight BOOLEAN,
    km_start INT,
    km_end INT,
    comment TEXT,
    extra JSONB,
    version INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_tb_entry_workday ON tb_entry (workday_id);

CREATE TABLE rs_entry (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    workday_id UUID NOT NULL REFERENCES workday(id) ON DELETE CASCADE,
    source_submission_id UUID NOT NULL,
    customer_id VARCHAR(64),
    customer_name VARCHAR(128),
    start_time TIME,
    end_time TIME,
    break_minutes INT,
    positions JSONB,
    pdf_object_key TEXT,
    version INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_rs_entry_workday ON rs_entry (workday_id);

CREATE TABLE attachment (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    workday_id UUID NOT NULL REFERENCES workday(id) ON DELETE CASCADE,
    kind VARCHAR(32) NOT NULL,
    s3_key TEXT NOT NULL,
    filename TEXT NOT NULL,
    bytes BIGINT,
    source_submission_id UUID,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_attachment_workday ON attachment (workday_id);
