const { Sequelize } = require('sequelize');

// Direct connection - no .env
const sequelize = new Sequelize('expense_tracker_db', 'root', '12345678', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // Set true if you want to see SQL logs
});

sequelize.authenticate()
  .then(() => console.log('Connected to MySQL via Sequelize'))
  .catch(err => console.error('Sequelize connection error:', err));

module.exports = sequelize;