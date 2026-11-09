const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.nodeEnv === 'development' ? false : false,
  timezone: '+07:00',
  define: { freezeTableName: true, timestamps: false },
  pool: { max: 10, min: 0, idle: 10000, acquire: 30000 }
});

module.exports = sequelize;
