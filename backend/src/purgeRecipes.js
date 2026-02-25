const { Recipe, RecipeElement, DataRecord, RecordValue } = require('./models');
const sequelize = require('./config/database');

async function purgeRecipes() {
  try {
    await sequelize.authenticate();

    const before = {
      recipes: await Recipe.count(),
      elements: await RecipeElement.count(),
      records: await DataRecord.count(),
      values: await RecordValue.count()
    };

    await RecordValue.destroy({ where: {} });
    await DataRecord.destroy({ where: {} });
    await RecipeElement.destroy({ where: {} });
    await Recipe.destroy({ where: {} });

    const after = {
      recipes: await Recipe.count(),
      elements: await RecipeElement.count(),
      records: await DataRecord.count(),
      values: await RecordValue.count()
    };

    console.log('Recipe data purge completed.');
    console.log(JSON.stringify({ before, after }, null, 2));
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Recipe data purge failed:', error);
    process.exit(1);
  }
}

purgeRecipes();
