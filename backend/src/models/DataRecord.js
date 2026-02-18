const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DataRecord = sequelize.define('DataRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recipe_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  record_number: {
    type: DataTypes.INTEGER
  },
  created_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'data_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DataRecord;
