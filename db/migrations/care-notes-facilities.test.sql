-- Bổ sung completion_note và specialty cho carely_test.

USE carely_test;
SET @exists_care_completion_note = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'care_tasks' AND COLUMN_NAME = 'completion_note'
);
SET @migration_sql = IF(@exists_care_completion_note = 0,
  'ALTER TABLE care_tasks ADD COLUMN completion_note VARCHAR(500) NULL AFTER completed_by_user_id',
  'SELECT ''completion_note already exists'' AS info'
);
PREPARE v46_stmt FROM @migration_sql; EXECUTE v46_stmt; DEALLOCATE PREPARE v46_stmt;

SET @exists_facility_specialty = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facilities' AND COLUMN_NAME = 'specialty'
);
SET @migration_sql = IF(@exists_facility_specialty = 0,
  'ALTER TABLE facilities ADD COLUMN specialty VARCHAR(180) NULL AFTER address',
  'SELECT ''specialty already exists'' AS info'
);
PREPARE v46_stmt FROM @migration_sql; EXECUTE v46_stmt; DEALLOCATE PREPARE v46_stmt;
