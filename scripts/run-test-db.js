/** Isolated fixture seed and database-backed integration tests; NEVER auto-resets DB. */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const testEnvFile = path.join(root, '.env.test');
if (!fs.existsSync(testEnvFile)) {
  console.error('Cần tạo .env.test từ .env.test.example trước khi sử dụng test DB.');
  process.exit(1);
}
require('dotenv').config({ path: testEnvFile, override: true, quiet: true });
const { assertTestDbConfig } = require('./test-db-policy');
try { assertTestDbConfig(process.env); }
catch (error) { console.error('Từ chối kiểm thử DB:', error.message); process.exit(1); }
const mode = process.argv[2];
const args = mode === 'seed' ? ['scripts/seed.js'] : mode === 'test' ? ['--test', 'tests/integration/routes.test.js'] : null;
if (!args) { console.error('Usage: node scripts/run-test-db.js seed|test'); process.exit(1); }
const preflight = spawnSync(process.execPath, ['scripts/check-test-db.js'], { cwd: root, env: process.env, stdio: 'inherit' });
if (preflight.error) { console.error(preflight.error); process.exit(1); }
if (preflight.status !== 0) process.exit(preflight.status ?? 1);
const result = spawnSync(process.execPath, args, { cwd: root, env: process.env, stdio: 'inherit' });
if (result.error) { console.error(result.error); process.exit(1); }
process.exit(result.status ?? 1);
