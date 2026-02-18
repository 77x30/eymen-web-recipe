const express = require('express');
const { RecipeElement } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Update element
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const element = await RecipeElement.findByPk(req.params.id);
    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }

    await element.update(req.body);
    res.json(element);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete element
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const element = await RecipeElement.findByPk(req.params.id);
    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }

    await element.destroy();
    res.json({ message: 'Element deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
