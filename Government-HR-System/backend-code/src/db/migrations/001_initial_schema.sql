-- Migration: 001_initial_schema.sql
-- Purpose: Initial schema creation for Government HR System
-- Creates: EMPLOYEE, DEPARTMENT, LEAVE_REQUEST, PAYROLL_RECORD,
--          PERFORMANCE_REVIEW, ONBOARDING_CHECKLIST tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- DEPARTMENT
-- =============================================================================
CREATE TABLE IF NOT EXISTS department (
    department_id       UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name_arabic         VARCHAR(255)    NOT NULL,
    name_english        VARCHAR(255)    NOT NULL,
    manager_id          UUID,           -- FK to employee; deferred to avoid circular reference
    parent_department_id UUID,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_department_manager_id
    ON department (manager_id);

CREATE INDEX IF NOT EXISTS idx_department_parent_id
    ON department (parent_department_id);

-- =============================================================================
-- EMPLOYEE
-- =============================================================================
CREATE TABLE IF NOT EXISTS employee (
    employee_id             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name_arabic             VARCHAR(255)    NOT NULL,
    name_english            VARCHAR(255)    NOT NULL,
    national_id             VARCHAR(20)     NOT NULL UNIQUE,
    email                   VARCHAR(320)    NOT NULL UNIQUE,
    phone                   VARCHAR(20),
    job_title_arabic        VARCHAR(255),
    job_title_english       VARCHAR(255),
    department_id           UUID            REFERENCES department (department_id) ON DELETE SET NULL,
    manager_id              UUID            REFERENCES employee  (employee_id)   ON DELETE SET NULL,
    role                    VARCHAR(50)     NOT NULL
                                            CHECK (role IN ('HR Staff', 'Manager', 'Employee')),
    employment_status       VARCHAR(50)     NOT NULL DEFAULT 'Active'
                                            CHECK (employment_status IN ('Active', 'On Leave', 'Terminated', 'Suspended')),
    hire_date_hijri         VARCHAR(10),    -- Stored as YYYY-MM-DD in Hijri calendar
    hire_date_gregorian     DATE,
    base_salary             NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    housing_allowance       NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    transport_allowance     NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    sso_subject             VARCHAR(512)    UNIQUE,  -- SSO/AD identifier
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_department_id
    ON employee (department_id);

CREATE INDEX IF NOT EXISTS idx_employee_manager_id
    ON employee (manager_id);

CREATE INDEX IF NOT EXISTS idx_employee_role
    ON employee (role);

CREATE INDEX IF NOT EXISTS idx_employee_employment_status
    ON employee (employment_status);

CREATE INDEX IF NOT EXISTS idx_employee_national_id
    ON employee (national_id);

-- Now add the deferred FK from department.manager_id → employee.employee_id
ALTER TABLE department
    ADD CONSTRAINT fk_department_manager
    FOREIGN KEY (manager_id)
    REFERENCES employee (employee_id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE department
    ADD CONSTRAINT fk_department_parent
    FOREIGN KEY (parent_department_id)
    REFERENCES department (department_id)
    ON DELETE SET NULL;

-- =============================================================================
-- LEAVE_REQUEST
-- =============================================================================
CREATE TABLE IF NOT EXISTS leave_request (
    leave_id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID            NOT NULL REFERENCES employee (employee_id) ON DELETE CASCADE,
    leave_type          VARCHAR(50)     NOT NULL
                                        CHECK (leave_type IN ('Annual', 'Sick', 'Maternity', 'Paternity', 'Emergency', 'Unpaid', 'Other')),
    start_date_hijri    VARCHAR(10)     NOT NULL,   -- YYYY-MM-DD Hijri
    end_date_hijri      VARCHAR(10)     NOT NULL,   -- YYYY-MM-DD Hijri
    start_date_gregorian DATE,
    end_date_gregorian  DATE,
    duration_days       INTEGER         NOT NULL DEFAULT 0,
    status              VARCHAR(20)     NOT NULL DEFAULT 'Pending'
                                        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    comments_employee   TEXT,
    comments_manager    TEXT,
    reviewed_by         UUID            REFERENCES employee (employee_id) ON DELETE SET NULL,
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_request_employee_id
    ON leave_request (employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_request_status
    ON leave_request (status);

CREATE INDEX IF NOT EXISTS idx_leave_request_reviewed_by
    ON leave_request (reviewed_by);

CREATE INDEX IF NOT EXISTS idx_leave_request_start_date
    ON leave_request (start_date_gregorian);

-- =============================================================================
-- PAYROLL_RECORD
-- =============================================================================
CREATE TABLE IF NOT EXISTS payroll_record (
    payroll_id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id             UUID            NOT NULL REFERENCES employee (employee_id) ON DELETE RESTRICT,
    payroll_period_hijri    VARCHAR(7)      NOT NULL,   -- YYYY-MM Hijri period
    payroll_period_gregorian VARCHAR(7)     NOT NULL,   -- YYYY-MM Gregorian period
    base_salary             NUMERIC(14, 2)  NOT NULL,
    housing_allowance       NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    transport_allowance     NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    other_allowances        NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    gross_salary            NUMERIC(14, 2)  NOT NULL,
    gosi_deduction          NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    absence_deduction       NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    other_deductions        NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    total_deductions        NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    net_salary              NUMERIC(14, 2)  NOT NULL,
    status                  VARCHAR(30)     NOT NULL DEFAULT 'Draft'
                                            CHECK (status IN ('Draft', 'Processed', 'Approved', 'Paid', 'Cancelled')),
    anomaly_flag            BOOLEAN         NOT NULL DEFAULT FALSE,
    anomaly_notes           TEXT,
    processed_by            UUID            REFERENCES employee (employee_id) ON DELETE SET NULL,
    processed_at            TIMESTAMPTZ,
    payslip_pdf_path        VARCHAR(512),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, payroll_period_gregorian)
);

CREATE INDEX IF NOT EXISTS idx_payroll_record_employee_id
    ON payroll_record (employee_id);

CREATE INDEX IF NOT EXISTS idx_payroll_record_period
    ON payroll_record (payroll_period_gregorian);

CREATE INDEX IF NOT EXISTS idx_payroll_record_status
    ON payroll_record (status);

CREATE INDEX IF NOT EXISTS idx_payroll_record_anomaly
    ON payroll_record (anomaly_flag)
    WHERE anomaly_flag = TRUE;

-- =============================================================================
-- PERFORMANCE_REVIEW
-- =============================================================================
CREATE TABLE IF NOT EXISTS performance_review (
    review_id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id             UUID            NOT NULL REFERENCES employee (employee_id) ON DELETE CASCADE,
    reviewer_id             UUID            NOT NULL REFERENCES employee (employee_id) ON DELETE RESTRICT,
    review_period_start     DATE            NOT NULL,
    review_period_end       DATE            NOT NULL,
    review_period_hijri     VARCHAR(20),
    overall_score           NUMERIC(5, 2)   CHECK (overall_score BETWEEN 0 AND 100),
    kpi_data                JSONB,          -- Flexible KPI tracking structure
    goals                   JSONB,          -- Goals and achievement tracking
    strengths               TEXT,
    areas_for_improvement   TEXT,
    reviewer_comments       TEXT,
    employee_comments       TEXT,
    status                  VARCHAR(30)     NOT NULL DEFAULT 'Draft'
                                            CHECK (status IN ('Draft', 'In Progress', 'Submitted', 'Acknowledged', 'Completed')),
    acknowledged_at         TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_review_employee_id
    ON performance_review (employee_id);

CREATE INDEX IF NOT EXISTS idx_performance_review_reviewer_id
    ON performance_review (reviewer_id);

CREATE INDEX IF NOT EXISTS idx_performance_review_period
    ON performance_review (review_period_start, review_period_end);

CREATE INDEX IF NOT EXISTS idx_performance_review_status
    ON performance_review (status);

-- =============================================================================
-- ONBOARDING_CHECKLIST
-- =============================================================================
CREATE TABLE IF NOT EXISTS onboarding_checklist (
    checklist_id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID            NOT NULL REFERENCES employee (employee_id) ON DELETE CASCADE,
    task_name_arabic    VARCHAR(500)    NOT NULL,
    task_name_english   VARCHAR(500)    NOT NULL,
    task_category       VARCHAR(100)    NOT NULL
                                        CHECK (task_category IN (
                                            'Documentation', 'IT Setup', 'Access & Permissions',
                                            'Training', 'HR Administration', 'Department Orientation', 'Other'
                                        )),
    is_mandatory        BOOLEAN         NOT NULL DEFAULT TRUE,
    is_completed        BOOLEAN         NOT NULL DEFAULT FALSE,
    due_date_hijri      VARCHAR(10),
    due_date_gregorian  DATE,
    completed_at        TIMESTAMPTZ,
    completed_by        UUID            REFERENCES employee (employee_id) ON DELETE SET NULL,
    notes               TEXT,
    sort_order          INTEGER         NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_employee_id
    ON onboarding_checklist (employee_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_is_completed
    ON onboarding_checklist (is_completed);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_category
    ON onboarding_checklist (task_category);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_due_date
    ON onboarding_checklist (due_date_gregorian);

-- =============================================================================
-- AUDIT / TIMESTAMP TRIGGER FUNCTION
-- Updates updated_at automatically on row modification
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_department_updated_at
    BEFORE UPDATE ON department
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employee_updated_at
    BEFORE UPDATE ON employee
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_leave_request_updated_at
    BEFORE UPDATE ON leave_request
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payroll_record_updated_at
    BEFORE UPDATE ON payroll_record
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_performance_review_updated_at
    BEFORE UPDATE ON performance_review
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_onboarding_checklist_updated_at
    BEFORE UPDATE ON onboarding_checklist
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();