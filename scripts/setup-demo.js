const { spawnSync } = require('node:child_process');
const path = require('node:path');

const steps = [
  ['seed.js', 'Tạo dữ liệu nền'],
  ['seed-demo.js', 'Tạo dữ liệu minh họa'],
  ['verify-demo.js', 'Kiểm tra dữ liệu demo']
];

for (const [file, label] of steps) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env
  });

  if (result.error) {
    console.error(`Không thể chạy ${file}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Dừng thiết lập demo vì ${file} thất bại.`);
    process.exit(result.status || 1);
  }
}

console.log('\nCARELY DEMO SETUP COMPLETED.');
