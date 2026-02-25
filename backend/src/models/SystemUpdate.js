const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemUpdate = sequelize.define('SystemUpdate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  target_workspaces: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of workspace IDs, null means all'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'system_updates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = SystemUpdate;
