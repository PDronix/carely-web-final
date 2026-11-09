/** Guard rails for all local integration commands. Never target an existing Carely DB. */
'use strict';

function assertTestDbConfig(env) {
  if (env.NODE_ENV !== 'test') throw new Error('NODE_ENV phải là test trong .env.test.');
  if (env.CARELY_TEST_DB !== '1') throw new Error('CARELY_TEST_DB phải là 1.');
  if (env.DB_NAME !== 'carely_test') throw new Error('DB_NAME bắt buộc chính xác là carely_test.');
  if (!['localhost', '127.0.0.1', '::1'].includes(env.DB_HOST)) {
    throw new Error('Chỉ cho phép MySQL loopback (localhost/127.0.0.1/::1), không kết nối DB remote.');
  }
  const port = Number(env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT không hợp lệ.');
  if (!env.DB_USER) throw new Error('Thiếu DB_USER trong .env.test.');
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET test phải dài ít nhất 32 ký tự.');
  return { host: env.DB_HOST, port, database: 'carely_test', user: env.DB_USER, password: env.DB_PASS || '' };
}
module.exports = { assertTestDbConfig };
