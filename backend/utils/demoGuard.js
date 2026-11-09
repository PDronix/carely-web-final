function assertDemoSafe(env) {
  const allowedHosts = new Set(['localhost', '127.0.0.1', '::1']);
  if (!env || env.nodeEnv === 'production' || !allowedHosts.has(env.db?.host)) {
    throw new Error('Từ chối tạo tài khoản DEMO trên production hoặc MySQL từ xa.');
  }
  if (env.db.name !== 'carely' && !/_test$/.test(env.db.name)) {
    throw new Error('Script DEMO chỉ được chạy trên DB carely local hoặc DB kết thúc bằng _test.');
  }
}
module.exports = assertDemoSafe;
