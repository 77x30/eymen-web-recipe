const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecordValue = sequelize.define('RecordValue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  data_record_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  element_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'record_values',
  timestamps: false
});

module.exports = RecordValue;
