-- Cấu trúc Carely cho database kiểm thử carely_test.

CREATE DATABASE IF NOT EXISTS carely_test
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE carely_test;

-- Tạo bảng users.
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NULL,

    account_type ENUM('member', 'facility', 'admin') NOT NULL,

    status ENUM('active', 'locked') NOT NULL DEFAULT 'active',

    auth_version INT UNSIGNED NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- Tạo bảng password_reset_tokens.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,

    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_password_reset_token_hash UNIQUE (token_hash),

    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    INDEX idx_password_reset_tokens_user_expiry
        (user_id, expires_at, used_at)
) ENGINE=InnoDB;

-- Tạo bảng families.
CREATE TABLE IF NOT EXISTS families (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    owner_user_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_families_owner
        FOREIGN KEY (owner_user_id)
        REFERENCES users(id)
) ENGINE=InnoDB;

-- Tạo bảng people.
CREATE TABLE IF NOT EXISTS people (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    family_id BIGINT UNSIGNED NULL,

    user_id BIGINT UNSIGNED NULL,

    person_type ENUM('member', 'dependent') NOT NULL,

    full_name VARCHAR(120) NOT NULL,
    date_of_birth DATE NULL,
    gender ENUM('male', 'female', 'other', 'unspecified')
        NOT NULL DEFAULT 'unspecified',

    relationship_to_manager VARCHAR(50) NULL,

    manager_user_id BIGINT UNSIGNED NULL,

    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_people_user UNIQUE (user_id),

    CONSTRAINT fk_people_family
        FOREIGN KEY (family_id)
        REFERENCES families(id),

    CONSTRAINT fk_people_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_people_manager
        FOREIGN KEY (manager_user_id)
        REFERENCES users(id),

    INDEX idx_people_family_status (family_id, status),
    INDEX idx_people_manager (manager_user_id)
) ENGINE=InnoDB;

-- Tạo bảng user_consents.
CREATE TABLE IF NOT EXISTS user_consents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    subject_person_id BIGINT UNSIGNED NULL,

    consent_type ENUM(
        'terms',
        'privacy',
        'health_data',
        'dependent_health_data'
    ) NOT NULL,

    document_version VARCHAR(30) NOT NULL,

    status ENUM('granted', 'revoked') NOT NULL DEFAULT 'granted',

    granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_consents_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_user_consents_subject
        FOREIGN KEY (subject_person_id)
        REFERENCES people(id),

    INDEX idx_user_consents_user_type
        (user_id, consent_type, status),

    INDEX idx_user_consents_subject_type
        (subject_person_id, consent_type, status),

    CONSTRAINT chk_user_consents_revocation CHECK (
        (status = 'granted' AND revoked_at IS NULL)
        OR
        (status = 'revoked' AND revoked_at IS NOT NULL)
    )
) ENGINE=InnoDB;

-- Tạo bảng family_invites.
CREATE TABLE IF NOT EXISTS family_invites (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(64) NOT NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,

    expires_at DATETIME NOT NULL,
    status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_family_invites_code UNIQUE (code),

    CONSTRAINT fk_family_invites_family
        FOREIGN KEY (family_id)
        REFERENCES families(id),

    CONSTRAINT fk_family_invites_creator
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    INDEX idx_family_invites_family_status_expiry
        (family_id, status, expires_at)
) ENGINE=InnoDB;

-- Tạo bảng family_join_requests.
CREATE TABLE IF NOT EXISTS family_join_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    invite_id BIGINT UNSIGNED NOT NULL,

    status ENUM('pending', 'approved', 'rejected', 'cancelled')
        NOT NULL DEFAULT 'pending',

    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    reviewed_by_user_id BIGINT UNSIGNED NULL,

    CONSTRAINT fk_join_requests_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_join_requests_invite
        FOREIGN KEY (invite_id)
        REFERENCES family_invites(id),

    CONSTRAINT fk_join_requests_reviewer
        FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users(id),

    INDEX idx_join_requests_invite_status (invite_id, status),
    INDEX idx_join_requests_user_status (user_id, status)
) ENGINE=InnoDB;

-- Tạo bảng health_profiles.
CREATE TABLE IF NOT EXISTS health_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_id BIGINT UNSIGNED NOT NULL,

    blood_type ENUM(
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'
    ) NOT NULL DEFAULT 'unknown',

    general_note TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_health_profiles_person UNIQUE (person_id),

    CONSTRAINT fk_health_profiles_person
        FOREIGN KEY (person_id)
        REFERENCES people(id)
) ENGINE=InnoDB;

-- Tạo bảng profile_permissions.
CREATE TABLE IF NOT EXISTS profile_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,
    grantee_user_id BIGINT UNSIGNED NOT NULL,
    access_level ENUM('view', 'full') NOT NULL,
    granted_by_user_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_profile_permission
        UNIQUE (health_profile_id, grantee_user_id),

    CONSTRAINT fk_profile_permissions_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_profile_permissions_grantee
        FOREIGN KEY (grantee_user_id)
        REFERENCES users(id),

    CONSTRAINT fk_profile_permissions_granter
        FOREIGN KEY (granted_by_user_id)
        REFERENCES users(id),

    INDEX idx_profile_permissions_grantee (grantee_user_id)
) ENGINE=InnoDB;

-- Tạo bảng facilities.
CREATE TABLE IF NOT EXISTS facilities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,

    facility_name VARCHAR(180) NOT NULL,
    address VARCHAR(255) NULL,
    specialty VARCHAR(180) NULL,
    phone VARCHAR(20) NULL,
    description TEXT NULL,

    license_number VARCHAR(100) NOT NULL,

    verification_status ENUM('pending', 'approved', 'rejected')
        NOT NULL DEFAULT 'pending',

    reviewed_at DATETIME NULL,
    reviewed_by_user_id BIGINT UNSIGNED NULL,
    rejection_reason VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_facilities_user UNIQUE (user_id),
    CONSTRAINT uq_facilities_license_number UNIQUE (license_number),

    CONSTRAINT fk_facilities_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_facilities_reviewer
        FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users(id),

    INDEX idx_facilities_verification_status
        (verification_status)
) ENGINE=InnoDB;

-- Tạo bảng facility_documents.
CREATE TABLE IF NOT EXISTS facility_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    facility_id BIGINT UNSIGNED NOT NULL,
    uploaded_by_user_id BIGINT UNSIGNED NOT NULL,

    document_type ENUM('operating_license', 'other')
        NOT NULL DEFAULT 'operating_license',

    original_name VARCHAR(255) NOT NULL,

    storage_key VARCHAR(255) NOT NULL,

    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT UNSIGNED NOT NULL,
    sha256 CHAR(64) NOT NULL,

    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_facility_documents_storage_key UNIQUE (storage_key),

    CONSTRAINT fk_facility_documents_facility
        FOREIGN KEY (facility_id)
        REFERENCES facilities(id),

    CONSTRAINT fk_facility_documents_uploader
        FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(id),

    INDEX idx_facility_documents_facility_type
        (facility_id, document_type, uploaded_at),

    CONSTRAINT chk_facility_documents_size CHECK (size_bytes > 0)
) ENGINE=InnoDB;

-- Tạo bảng appointments.
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    health_profile_id BIGINT UNSIGNED NOT NULL,
    facility_id BIGINT UNSIGNED NOT NULL,
    requested_by_user_id BIGINT UNSIGNED NOT NULL,

    reason VARCHAR(500) NULL,

    requested_for DATETIME NOT NULL,

    proposed_for DATETIME NULL,

    confirmed_for DATETIME NULL,

    status ENUM(
        'pending',
        'proposed_time',
        'confirmed',
        'rejected',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    facility_response_note VARCHAR(500) NULL,

    confirmed_at DATETIME NULL,

    rejected_at DATETIME NULL,
    rejected_by_user_id BIGINT UNSIGNED NULL,

    completed_at DATETIME NULL,

    cancelled_at DATETIME NULL,
    cancelled_by_user_id BIGINT UNSIGNED NULL,

    access_revoked_at DATETIME NULL,
    access_revoked_by_user_id BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointments_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_appointments_facility
        FOREIGN KEY (facility_id)
        REFERENCES facilities(id),

    CONSTRAINT fk_appointments_requester
        FOREIGN KEY (requested_by_user_id)
        REFERENCES users(id),

    CONSTRAINT fk_appointments_rejector
        FOREIGN KEY (rejected_by_user_id)
        REFERENCES users(id),

    CONSTRAINT fk_appointments_canceller
        FOREIGN KEY (cancelled_by_user_id)
        REFERENCES users(id),

    CONSTRAINT fk_appointments_access_revoker
        FOREIGN KEY (access_revoked_by_user_id)
        REFERENCES users(id),

    CONSTRAINT chk_appointments_proposed_time CHECK (
        status <> 'proposed_time' OR proposed_for IS NOT NULL
    ),

    CONSTRAINT chk_appointments_confirmed_time CHECK (
        status NOT IN ('confirmed', 'completed')
        OR (confirmed_for IS NOT NULL AND confirmed_at IS NOT NULL)
    ),

    CONSTRAINT chk_appointments_rejected_time CHECK (
        status <> 'rejected'
        OR (rejected_at IS NOT NULL AND rejected_by_user_id IS NOT NULL)
    ),

    CONSTRAINT chk_appointments_completed_time CHECK (
        status <> 'completed' OR completed_at IS NOT NULL
    ),

    CONSTRAINT chk_appointments_cancelled_time CHECK (
        status <> 'cancelled' OR cancelled_at IS NOT NULL
    ),

    INDEX idx_appointments_facility_status (facility_id, status),
    INDEX idx_appointments_profile_status (health_profile_id, status),
    INDEX idx_appointments_confirmed_for (confirmed_for)
) ENGINE=InnoDB;

-- Tạo bảng visit_results.
CREATE TABLE IF NOT EXISTS visit_results (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT UNSIGNED NOT NULL,
    recorded_by_user_id BIGINT UNSIGNED NOT NULL,

    doctor_name VARCHAR(120) NULL,
    examined_at DATETIME NOT NULL,

    diagnosis TEXT NULL,
    conclusion TEXT NULL,
    instructions TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_visit_results_appointment UNIQUE (appointment_id),

    CONSTRAINT fk_visit_results_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id),

    CONSTRAINT fk_visit_results_recorder
        FOREIGN KEY (recorded_by_user_id)
        REFERENCES users(id)
) ENGINE=InnoDB;

-- Tạo bảng medical_conditions.
CREATE TABLE IF NOT EXISTS medical_conditions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,

    condition_name VARCHAR(180) NOT NULL,
    diagnosed_on DATE NULL,
    status ENUM('active', 'resolved') NOT NULL DEFAULT 'active',
    note TEXT NULL,

    source_type ENUM('member', 'facility') NOT NULL DEFAULT 'member',
    visit_result_id BIGINT UNSIGNED NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_medical_conditions_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_medical_conditions_visit
        FOREIGN KEY (visit_result_id)
        REFERENCES visit_results(id),

    CONSTRAINT fk_medical_conditions_creator
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    INDEX idx_medical_conditions_profile_status
        (health_profile_id, status)
) ENGINE=InnoDB;

-- Tạo bảng health_restrictions.
CREATE TABLE IF NOT EXISTS health_restrictions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,

    restriction_type ENUM('allergy', 'dietary', 'other') NOT NULL,
    name VARCHAR(180) NOT NULL,
    note TEXT NULL,

    created_by_user_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_health_restrictions_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_health_restrictions_creator
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    INDEX idx_health_restrictions_profile_type
        (health_profile_id, restriction_type)
) ENGINE=InnoDB;

-- Tạo bảng care_notes.
CREATE TABLE IF NOT EXISTS care_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,
    author_user_id BIGINT UNSIGNED NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_care_notes_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_care_notes_author
        FOREIGN KEY (author_user_id)
        REFERENCES users(id),

    INDEX idx_care_notes_profile_created
        (health_profile_id, created_at)
) ENGINE=InnoDB;

-- Tạo bảng personal_appointments.
CREATE TABLE IF NOT EXISTS personal_appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(180) NOT NULL,
    facility_name VARCHAR(180) NULL,
    doctor_name VARCHAR(120) NULL,

    scheduled_at DATETIME NOT NULL,
    reminder_at DATETIME NULL,

    status ENUM('scheduled', 'completed', 'cancelled')
        NOT NULL DEFAULT 'scheduled',

    note TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_personal_appointments_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_personal_appointments_creator
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT chk_personal_appointments_reminder CHECK (
        reminder_at IS NULL OR reminder_at <= scheduled_at
    ),

    INDEX idx_personal_appointments_profile_time
        (health_profile_id, scheduled_at)
) ENGINE=InnoDB;

-- Tạo bảng medications.
CREATE TABLE IF NOT EXISTS medications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,

    visit_result_id BIGINT UNSIGNED NULL,

    created_by_user_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(180) NOT NULL,
    dosage VARCHAR(120) NULL,
    instructions TEXT NULL,

    start_date DATE NOT NULL,
    end_date DATE NULL,

    source_type ENUM('self_recorded', 'facility_prescribed')
        NOT NULL DEFAULT 'self_recorded',

    status ENUM('active', 'completed', 'stopped')
        NOT NULL DEFAULT 'active',

    reminder_state ENUM('none', 'draft', 'active')
        NOT NULL DEFAULT 'none',

    reminder_confirmed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_medications_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_medications_visit
        FOREIGN KEY (visit_result_id)
        REFERENCES visit_results(id),

    CONSTRAINT fk_medications_creator
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT chk_medications_dates CHECK (
        end_date IS NULL OR end_date >= start_date
    ),

    CONSTRAINT chk_medications_reminder_confirmation CHECK (
        (
            source_type = 'facility_prescribed'
            AND reminder_state = 'active'
            AND reminder_confirmed_at IS NOT NULL
        )
        OR
        (
            source_type = 'facility_prescribed'
            AND reminder_state <> 'active'
        )
        OR
        (
            source_type = 'self_recorded'
        )
    ),

    INDEX idx_medications_profile_status_dates
        (health_profile_id, status, start_date, end_date),

    INDEX idx_medications_visit (visit_result_id)
) ENGINE=InnoDB;

-- Tạo bảng medication_schedules.
CREATE TABLE IF NOT EXISTS medication_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    medication_id BIGINT UNSIGNED NOT NULL,

    time_of_day TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_medication_schedule_time
        UNIQUE (medication_id, time_of_day),

    INDEX idx_medication_schedules_medication_active (medication_id, is_active),

    CONSTRAINT fk_medication_schedules_medication
        FOREIGN KEY (medication_id)
        REFERENCES medications(id)
) ENGINE=InnoDB;

-- Tạo bảng care_tasks.
CREATE TABLE IF NOT EXISTS care_tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,

    task_type ENUM('medication', 'appointment', 'general') NOT NULL,

    medication_schedule_id BIGINT UNSIGNED NULL,
    personal_appointment_id BIGINT UNSIGNED NULL,

    title VARCHAR(180) NOT NULL,
    description VARCHAR(500) NULL,

    due_at DATETIME NOT NULL,

    status ENUM('pending', 'completed', 'missed', 'cancelled')
        NOT NULL DEFAULT 'pending',

    completed_at DATETIME NULL,
    completed_by_user_id BIGINT UNSIGNED NULL,
    completion_note VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_care_tasks_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_care_tasks_medication_schedule
        FOREIGN KEY (medication_schedule_id)
        REFERENCES medication_schedules(id),

    CONSTRAINT fk_care_tasks_personal_appointment
        FOREIGN KEY (personal_appointment_id)
        REFERENCES personal_appointments(id),

    CONSTRAINT fk_care_tasks_completer
        FOREIGN KEY (completed_by_user_id)
        REFERENCES users(id),

    CONSTRAINT uq_care_task_medication_occurrence
        UNIQUE (medication_schedule_id, due_at),

    CONSTRAINT uq_care_task_appointment_occurrence
        UNIQUE (personal_appointment_id, due_at),

    INDEX idx_care_tasks_profile_due_status
        (health_profile_id, due_at, status),

    INDEX idx_care_tasks_due_status
        (due_at, status)
) ENGINE=InnoDB;

-- Tạo bảng metric_types.
CREATE TABLE IF NOT EXISTS metric_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NULL,

    CONSTRAINT uq_metric_types_code UNIQUE (code)
) ENGINE=InnoDB;

-- Tạo bảng metric_components.
CREATE TABLE IF NOT EXISTS metric_components (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    metric_type_id BIGINT UNSIGNED NOT NULL,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    unit VARCHAR(30) NOT NULL,

    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,

    CONSTRAINT uq_metric_component_code
        UNIQUE (metric_type_id, code),

    CONSTRAINT fk_metric_components_type
        FOREIGN KEY (metric_type_id)
        REFERENCES metric_types(id)
) ENGINE=InnoDB;

-- Tạo bảng health_metric_records.
CREATE TABLE IF NOT EXISTS health_metric_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,
    metric_type_id BIGINT UNSIGNED NOT NULL,

    measured_at DATETIME NOT NULL,
    note VARCHAR(500) NULL,

    created_by_user_id BIGINT UNSIGNED NOT NULL,

    is_alert BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_metric_records_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_metric_records_type
        FOREIGN KEY (metric_type_id)
        REFERENCES metric_types(id),

    CONSTRAINT fk_metric_records_creator
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    INDEX idx_metric_records_profile_type_time
        (health_profile_id, metric_type_id, measured_at)
) ENGINE=InnoDB;

-- Tạo bảng health_metric_values.
CREATE TABLE IF NOT EXISTS health_metric_values (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    metric_record_id BIGINT UNSIGNED NOT NULL,
    component_id BIGINT UNSIGNED NOT NULL,

    numeric_value DECIMAL(12,4) NOT NULL,

    CONSTRAINT uq_metric_record_component
        UNIQUE (metric_record_id, component_id),

    CONSTRAINT fk_metric_values_record
        FOREIGN KEY (metric_record_id)
        REFERENCES health_metric_records(id),

    CONSTRAINT fk_metric_values_component
        FOREIGN KEY (component_id)
        REFERENCES metric_components(id)
) ENGINE=InnoDB;

-- Tạo bảng metric_thresholds.
CREATE TABLE IF NOT EXISTS metric_thresholds (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    health_profile_id BIGINT UNSIGNED NOT NULL,
    component_id BIGINT UNSIGNED NOT NULL,

    min_value DECIMAL(12,4) NULL,
    max_value DECIMAL(12,4) NULL,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    set_by_user_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_metric_threshold
        UNIQUE (health_profile_id, component_id),

    CONSTRAINT fk_metric_thresholds_profile
        FOREIGN KEY (health_profile_id)
        REFERENCES health_profiles(id),

    CONSTRAINT fk_metric_thresholds_component
        FOREIGN KEY (component_id)
        REFERENCES metric_components(id),

    CONSTRAINT fk_metric_thresholds_setter
        FOREIGN KEY (set_by_user_id)
        REFERENCES users(id),

    CONSTRAINT chk_metric_threshold_bounds CHECK (
        (min_value IS NOT NULL OR max_value IS NOT NULL)
        AND
        (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
    ),

    INDEX idx_metric_thresholds_profile_enabled
        (health_profile_id, enabled)
) ENGINE=InnoDB;

-- Tạo bảng invoices.
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    visit_result_id BIGINT UNSIGNED NOT NULL,

    invoice_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,

    payment_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',

    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME NULL,

    note TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_invoices_visit UNIQUE (visit_result_id),
    CONSTRAINT uq_invoices_number UNIQUE (invoice_number),

    CONSTRAINT fk_invoices_visit
        FOREIGN KEY (visit_result_id)
        REFERENCES visit_results(id),

    CONSTRAINT chk_invoices_amount CHECK (total_amount >= 0),

    CONSTRAINT chk_invoices_payment CHECK (
        (
            payment_status = 'paid'
            AND paid_at IS NOT NULL
        )
        OR
        (
            payment_status = 'unpaid'
            AND paid_at IS NULL
        )
    )
) ENGINE=InnoDB;

-- Tạo bảng audit_logs.
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    actor_user_id BIGINT UNSIGNED NULL,

    action_code VARCHAR(80) NOT NULL,
    resource_type VARCHAR(60) NOT NULL,
    resource_id BIGINT UNSIGNED NULL,

    outcome ENUM('success', 'denied', 'failure') NOT NULL,

    metadata JSON NULL,

    request_id CHAR(36) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES users(id),

    INDEX idx_audit_logs_actor_created
        (actor_user_id, created_at),

    INDEX idx_audit_logs_resource_created
        (resource_type, resource_id, created_at),

    INDEX idx_audit_logs_action_created
        (action_code, created_at)
) ENGINE=InnoDB;


SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'carely_test';

SELECT 'CARELY_SCHEMA_V2_0_OK' AS schema_status;
