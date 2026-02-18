const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  action: {
    type: DataTypes.STRING(50)
  },
  entity_type: {
    type: DataTypes.STRING(50)
  },
  entity_id: {
    type: DataTypes.INTEGER
  },
  details: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'activity_log',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ActivityLog;
