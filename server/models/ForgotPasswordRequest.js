// models/ForgotPasswordRequest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const ForgotPasswordRequest = sequelize.define('ForgotPasswordRequest', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  isactive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'forgot_password_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['userId'] }]
});

// Associations
User.hasMany(ForgotPasswordRequest, { foreignKey: 'userId' });
ForgotPasswordRequest.belongsTo(User, { foreignKey: 'userId' });

module.exports = ForgotPasswordRequest;