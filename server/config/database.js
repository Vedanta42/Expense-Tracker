// config/database.js
const { Sequelize } = require('sequelize');

// Use environment variables for DB credentials
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false, // Set true if you want to see SQL logs
});

sequelize.authenticate()
  .then(() => console.log('Connected to MySQL via Sequelize'))
  .catch(err => console.error('Sequelize connection error:', err));

module.exports = sequelize;