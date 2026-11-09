-- Cập nhật schema V3.2 cho carely_test.

USE carely_test;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_schedules'
    AND COLUMN_NAME = 'is_active'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE medication_schedules ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER time_of_day',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_schedules'
    AND INDEX_NAME = 'idx_medication_schedules_medication_active'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_medication_schedules_medication_active ON medication_schedules (medication_id, is_active)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE family_invites
SET expires_at = LEAST(expires_at, DATE_ADD(created_at, INTERVAL 24 HOUR))
WHERE status = 'active';

UPDATE family_invites
SET status = 'revoked'
WHERE status = 'active' AND expires_at <= NOW();
