const User = require('./User');
const Recipe = require('./Recipe');
const RecipeElement = require('./RecipeElement');
const DataRecord = require('./DataRecord');
const RecordValue = require('./RecordValue');
const ActivityLog = require('./ActivityLog');

// Define associations
Recipe.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Recipe.hasMany(RecipeElement, { foreignKey: 'recipe_id', as: 'elements', onDelete: 'CASCADE' });
Recipe.hasMany(DataRecord, { foreignKey: 'recipe_id', as: 'records', onDelete: 'CASCADE' });

RecipeElement.belongsTo(Recipe, { foreignKey: 'recipe_id' });
RecipeElement.hasMany(RecordValue, { foreignKey: 'element_id', onDelete: 'CASCADE' });

DataRecord.belongsTo(Recipe, { foreignKey: 'recipe_id' });
DataRecord.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
DataRecord.hasMany(RecordValue, { foreignKey: 'data_record_id', as: 'values', onDelete: 'CASCADE' });

RecordValue.belongsTo(DataRecord, { foreignKey: 'data_record_id' });
RecordValue.belongsTo(RecipeElement, { foreignKey: 'element_id', as: 'element' });

ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Recipe,
  RecipeElement,
  DataRecord,
  RecordValue,
  ActivityLog
};
