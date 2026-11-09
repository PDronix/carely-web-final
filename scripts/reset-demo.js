/**
 * Carely V4.1 LOCAL DEMO REBUILD. Destructive by explicit opt-in ONLY.
 * DRY RUN : npm run demo:reset:plan
 * ACTUAL  : npm run demo:reset -- --confirm=ERASE_LOCAL_CARELY --backup-acknowledged
 * Do not run while the web server is up. This script cannot access remote DBs.
 */
'use strict';
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const mysql = require('mysql2/promise');
const { parseDateOnly, toDateOnlyLocal } = require('../backend/utils/dateTime');
const env = require('../backend/config/env');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const confirmed = args.includes('--confirm=ERASE_LOCAL_CARELY');
const backupAcknowledged = args.includes('--backup-acknowledged');
const endArg = args.find(arg => arg.startsWith('--end='));
const end = parseDateOnly(endArg ? endArg.slice(6) : toDateOnlyLocal());
const safeLocalHosts = ['localhost', '127.0.0.1', '::1'];
function safetyChecks() {
  if (env.nodeEnv === 'production') throw new Error('TỪ CHỐI: NODE_ENV=production.');
  if (!safeLocalHosts.includes(env.db.host)) throw new Error(`TỪ CHỐI: DB_HOST=${env.db.host} không phải localhost.`);
  if (env.db.name !== 'carely') throw new Error(`TỪ CHỐI: DB_NAME=${env.db.name} không phải database demo carely.`);
  if (end > toDateOnlyLocal()) throw new Error('Ngày kết thúc dữ liệu không thể nằm trong tương lai.');
}
function run(script, extra = []) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script), ...extra], {
    cwd: path.join(__dirname, '..'), env: process.env, stdio: 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} thất bại (exit=${result.status}). Không chạy app trước khi xử lý lỗi.`);
}
async function main() {
  safetyChecks();
  console.log(`DATABASE TARGET: ${env.db.host}:${env.db.port}/${env.db.name}`);
  console.log(`21-day demo ends: ${end}. User accounts, clinical records, appointments and sessions in this DB will be DELETED.`);
  console.log('STOP THE WEBSITE. Sao lưu database bằng MySQL Workbench hoặc mysqldump trước khi xóa.');
  if (dryRun) return console.log('DRY RUN OK. Chưa kết nối hoặc xóa bất kỳ dữ liệu nào.');
  if (!confirmed || !backupAcknowledged) {
    throw new Error('Thiếu 2 xác nhận: --confirm=ERASE_LOCAL_CARELY --backup-acknowledged');
  }
  const cn = await mysql.createConnection({
    host: env.db.host, port: env.db.port, user: env.db.user,
    password: env.db.pass, multipleStatements: true, charset: 'utf8mb4'
  });
  try {
    await cn.query('DROP DATABASE IF EXISTS `carely`');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await cn.query(schema);
    const [tables] = await cn.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema='carely' AND table_name NOT LIKE 'app_sessions'");
    if (Number(tables[0].n) !== 27) throw new Error(`Schema không đủ 27 bảng (${tables[0].n}).`);
    console.log('Đã tạo mới 27 bảng theo schema.sql.');
  } finally { await cn.end(); }
  run('seed.js');
  run('seed-demo.js', [`--end=${end}`]);
  run('verify-demo.js', [`--end=${end}`]);
  console.log('DONE: local Carely demo reset + seed + verify. Sessions cũ không còn hiệu lực.');
}
main().catch(error => { console.error('RESET DEMO FAILED:', error.message); process.exitCode = 1; });
