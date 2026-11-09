const app = require('./app');
const env = require('./config/env');
const sequelize = require('./config/database');
const startCareScheduler = require('./jobs/careScheduler');

async function start() {
  try {
    await sequelize.authenticate();
    app.listen(env.port, () => {
      console.log(`Carely running at ${env.appUrl}`);
      startCareScheduler();
    });
  } catch (error) {
    console.error('Cannot start Carely:', error.message);
    process.exit(1);
  }
}

start();
