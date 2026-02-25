const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppTelemetry = sequelize.define('AppTelemetry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  workspace_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  app_version: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ram_usage_mb: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  cpu_usage_percent: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  os_info: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  screen_resolution: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('online', 'idle', 'offline'),
    defaultValue: 'online'
  },
  last_ping: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  first_seen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'app_telemetry',
  timestamps: false
});

module.exports = AppTelemetry;
