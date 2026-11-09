'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, '.env.test');
if (!fs.existsSync(file)) {
  console.error('Thiếu .env.test. Sao chép .env.test.example và cấu hình MySQL test local.');
  process.exit(1);
}
require('dotenv').config({ path: file, override: true, quiet: true });
const { assertTestDbConfig } = require('./test-db-policy');
async function main() {
  const config = assertTestDbConfig(process.env);
  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({ ...config, connectTimeout: 6000 });
  try {
    const [[{ db }]] = await conn.query('SELECT DATABASE() AS db');
    if (db !== 'carely_test') throw new Error('Database hiện hành không phải carely_test.');
    const [rows] = await conn.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      ['carely_test']
    );
    const actual = new Set(rows.map(row => row.TABLE_NAME));
    const required = [
      'users', 'people', 'families', 'user_consents', 'health_profiles', 'profile_permissions',
      'care_tasks', 'personal_appointments', 'facilities', 'appointments', 'visit_results',
      'invoices', 'audit_logs', 'medication_schedules'
    ];
    const missing = required.filter(name => !actual.has(name));
    if (missing.length) {
      throw new Error(`Schema test chưa hoàn chỉnh (thiếu: ${missing.join(', ')}). Chạy db/schema.integration.sql và db/migrations/medication-schedule.test.sql.`);
    }
    const [columns] = await conn.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'carely_test' AND TABLE_NAME = 'medication_schedules' AND COLUMN_NAME = 'is_active'"
    );
    if (!columns.length) throw new Error('Thiếu medication_schedules.is_active. Chạy db/migrations/medication-schedule.test.sql.');
    for (const [table, column] of [['care_tasks','completion_note'],['facilities','specialty']]) {
      const [colRows] = await conn.query(
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        ['carely_test', table, column]
      );
      if (!colRows.length) throw new Error(`Thiếu ${table}.${column}. Hãy chạy db/migrations/care-notes-facilities.test.sql trước khi kiểm thử V4.6.`);
    }
    console.log(`PASS: kết nối MySQL local đến '${db}', ${rows.length} bảng; migration V4.6 đã có. Không ghi dữ liệu.`);
  } finally {
    await conn.end();
  }
}
main().catch(error => { console.error('FAIL test DB preflight:', error.message); process.exitCode = 1; });
