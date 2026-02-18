const express = require('express');
const { Recipe, RecipeElement, DataRecord, RecordValue } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all recipes
router.get('/', authenticate, async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      include: [{ model: RecipeElement, as: 'elements', order: [['sort_order', 'ASC']] }],
      order: [['name', 'ASC']]
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single recipe with elements
router.get('/:id', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id, {
      include: [{ model: RecipeElement, as: 'elements', order: [['sort_order', 'ASC']] }]
    });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recipe
router.post('/', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { name, description, elements } = req.body;
    
    const recipe = await Recipe.create({
      name,
      description,
      created_by: req.user.id
    });

    if (elements && elements.length > 0) {
      const elementData = elements.map((el, index) => ({
        ...el,
        recipe_id: recipe.id,
        sort_order: el.sort_order ?? index
      }));
      await RecipeElement.bulkCreate(elementData);
    }

    const createdRecipe = await Recipe.findByPk(recipe.id, {
      include: [{ model: RecipeElement, as: 'elements' }]
    });

    res.status(201).json(createdRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update recipe
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const recipe = await Recipe.findByPk(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    await recipe.update({ name, description });
    
    const updatedRecipe = await Recipe.findByPk(recipe.id, {
      include: [{ model: RecipeElement, as: 'elements' }]
    });

    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete recipe
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    await recipe.destroy();
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add element to recipe
router.post('/:id/elements', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const element = await RecipeElement.create({
      ...req.body,
      recipe_id: req.params.id
    });

    res.status(201).json(element);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get records for recipe
router.get('/:id/records', authenticate, async (req, res) => {
  try {
    const records = await DataRecord.findAll({
      where: { recipe_id: req.params.id },
      include: [{
        model: RecordValue,
        as: 'values',
        include: [{ model: RecipeElement, as: 'element' }]
      }],
      order: [['record_number', 'ASC']]
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create data record
router.post('/:id/records', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { name, values } = req.body;
    
    // Get next record number
    const lastRecord = await DataRecord.findOne({
      where: { recipe_id: req.params.id },
      order: [['record_number', 'DESC']]
    });
    const recordNumber = (lastRecord?.record_number || 0) + 1;

    const dataRecord = await DataRecord.create({
      recipe_id: req.params.id,
      name,
      record_number: recordNumber,
      created_by: req.user.id
    });

    if (values && values.length > 0) {
      const valueData = values.map(v => ({
        data_record_id: dataRecord.id,
        element_id: v.element_id,
        value: v.value
      }));
      await RecordValue.bulkCreate(valueData);
    }

    const createdRecord = await DataRecord.findByPk(dataRecord.id, {
      include: [{
        model: RecordValue,
        as: 'values',
        include: [{ model: RecipeElement, as: 'element' }]
      }]
    });

    res.status(201).json(createdRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export recipe as CSV
router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id, {
      include: [{ model: RecipeElement, as: 'elements', order: [['sort_order', 'ASC']] }]
    });
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const records = await DataRecord.findAll({
      where: { recipe_id: req.params.id },
      include: [{ model: RecordValue, as: 'values' }],
      order: [['record_number', 'ASC']]
    });

    // Build CSV
    const headers = ['Record Name', 'Record Number', ...recipe.elements.map(e => e.name)];
    const rows = records.map(record => {
      const row = [record.name, record.record_number];
      recipe.elements.forEach(element => {
        const value = record.values.find(v => v.element_id === element.id);
        row.push(value?.value || '');
      });
      return row;
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${recipe.name}_export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
