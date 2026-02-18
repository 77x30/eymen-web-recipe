const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'sub_admin', 'operator', 'viewer'),
    defaultValue: 'operator'
  },
  workspace_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  biometric_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  biometric_photo: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  first_login: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = User;
