const cron = require('node-cron');
const ReminderService = require('../services/ReminderService');

function startCareScheduler() {
  cron.schedule('5 * * * *', async () => {
    try {
      await ReminderService.maintainRollingWindow(7);
      console.log('[scheduler] reminder window synchronized');
    } catch (error) {
      console.error('[scheduler] failed:', error.message);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });
}
module.exports = startCareScheduler;
