const express = require('express');
const { Recipe, RecipeElement, DataRecord, RecordValue, Workspace } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const isAdmin = (user) => user.role === 'admin';

function ensureWorkspaceAccess(user, res) {
  if (!isAdmin(user) && !user.workspace_id) {
    res.status(403).json({ error: 'Workspace access required' });
    return false;
  }
  return true;
}

function sortRecipeElements(recipe) {
  if (recipe?.elements) {
    recipe.elements.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
}

async function getRecipeOr404(recipeId) {
  return Recipe.findByPk(recipeId, {
    include: [{ model: RecipeElement, as: 'elements' }]
  });
}

function canAccessRecipe(recipe, user) {
  return isAdmin(user) || recipe.workspace_id === user.workspace_id;
}

// Get all recipes
router.get('/', authenticate, async (req, res) => {
  try {
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const where = {};
    if (isAdmin(req.user)) {
      if (req.query.workspace_id) {
        where.workspace_id = parseInt(req.query.workspace_id, 10);
      }
    } else {
      where.workspace_id = req.user.workspace_id;
    }

    const recipes = await Recipe.findAll({
      where,
      include: [{ model: RecipeElement, as: 'elements' }],
      order: [['name', 'ASC']]
    });

    recipes.forEach(sortRecipeElements);
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single recipe with elements
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const recipe = await getRecipeOr404(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    if (!canAccessRecipe(recipe, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    sortRecipeElements(recipe);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recipe
router.post('/', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const { name, description, elements } = req.body;

    let workspaceId = null;
    if (isAdmin(req.user)) {
      workspaceId = req.body.workspace_id || null;
      if (workspaceId) {
        const workspace = await Workspace.findByPk(workspaceId);
        if (!workspace) {
          return res.status(400).json({ error: 'Workspace not found' });
        }
      }
    } else {
      workspaceId = req.user.workspace_id;
    }

    const recipe = await Recipe.create({
      name,
      description,
      created_by: req.user.id,
      workspace_id: workspaceId
    });

    if (elements && elements.length > 0) {
      const elementData = elements.map((el, index) => ({
        ...el,
        recipe_id: recipe.id,
        sort_order: el.sort_order ?? index
      }));
      await RecipeElement.bulkCreate(elementData);
    }

    const createdRecipe = await getRecipeOr404(recipe.id);
    sortRecipeElements(createdRecipe);
    res.status(201).json(createdRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update recipe
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const { name, description } = req.body;
    const recipe = await Recipe.findByPk(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    if (!canAccessRecipe(recipe, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await recipe.update({ name, description });

    const updatedRecipe = await getRecipeOr404(recipe.id);
    sortRecipeElements(updatedRecipe);
    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete recipe
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    if (!canAccessRecipe(recipe, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
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
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    if (!canAccessRecipe(recipe, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
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
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    if (!canAccessRecipe(recipe, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

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
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    if (!canAccessRecipe(recipe, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, values } = req.body;

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
      const valueData = values.map((v) => ({
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
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const recipe = await getRecipeOr404(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    if (!canAccessRecipe(recipe, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    sortRecipeElements(recipe);
    const records = await DataRecord.findAll({
      where: { recipe_id: req.params.id },
      include: [{ model: RecordValue, as: 'values' }],
      order: [['record_number', 'ASC']]
    });

    const headers = ['Record Name', 'Record Number', ...recipe.elements.map((e) => e.name)];
    const rows = records.map((record) => {
      const row = [record.name, record.record_number];
      recipe.elements.forEach((element) => {
        const value = record.values.find((v) => v.element_id === element.id);
        row.push(value?.value || '');
      });
      return row;
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${recipe.name}_export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
