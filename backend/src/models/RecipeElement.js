const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeElement = sequelize.define('RecipeElement', {
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
  data_type: {
    type: DataTypes.ENUM('integer', 'float', 'string', 'boolean'),
    defaultValue: 'string'
  },
  unit: {
    type: DataTypes.STRING(20)
  },
  min_value: {
    type: DataTypes.DECIMAL(15, 5)
  },
  max_value: {
    type: DataTypes.DECIMAL(15, 5)
  },
  default_value: {
    type: DataTypes.STRING(255)
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'recipe_elements',
  timestamps: false
});

module.exports = RecipeElement;
