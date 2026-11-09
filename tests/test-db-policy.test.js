'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assertTestDbConfig } = require('../scripts/test-db-policy');
const valid = {
  NODE_ENV: 'test', CARELY_TEST_DB: '1', DB_HOST: '127.0.0.1', DB_PORT: '3306',
  DB_USER: 'root', DB_PASS: '', DB_NAME: 'carely_test',
  SESSION_SECRET: 'test-only-local-session-secret-32-character-value'
};
test('isolated test DB policy accepts the explicit local test database', () => {
  assert.equal(assertTestDbConfig(valid).database, 'carely_test');
});
test('isolated test DB policy rejects production, main and remote databases', () => {
  for (const [key, value] of Object.entries({
    NODE_ENV: 'production', DB_NAME: 'carely', DB_HOST: '198.51.100.5', CARELY_TEST_DB: '0'
  })) {
    assert.throws(() => assertTestDbConfig({ ...valid, [key]: value }), { name: 'Error' });
  }
});
test('isolated test DB policy rejects missing or weak test session secrets and invalid port', () => {
  assert.throws(() => assertTestDbConfig({ ...valid, SESSION_SECRET: '123' }));
  assert.throws(() => assertTestDbConfig({ ...valid, DB_PORT: '0' }));
});
