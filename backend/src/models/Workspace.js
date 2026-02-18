const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  subdomain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/i // Only alphanumeric and hyphens
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'workspaces',
  timestamps: true,
  underscored: true
});

module.exports = Workspace;
