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
  download_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: 'https://barida.xyz/downloads/BaridaRecipeManager-Setup.exe'
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  is_mandatory: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
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
