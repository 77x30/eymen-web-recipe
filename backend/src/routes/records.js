const express = require('express');
const { DataRecord, RecordValue, RecipeElement } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get single record with values
router.get('/:id', authenticate, async (req, res) => {
  try {
    const record = await DataRecord.findByPk(req.params.id, {
      include: [{
        model: RecordValue,
        as: 'values',
        include: [{ model: RecipeElement, as: 'element' }]
      }]
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update record
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { name, values } = req.body;
    const record = await DataRecord.findByPk(req.params.id);
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (name) {
      await record.update({ name });
    }

    if (values && values.length > 0) {
      for (const v of values) {
        await RecordValue.upsert({
          data_record_id: record.id,
          element_id: v.element_id,
          value: v.value
        });
      }
    }

    const updatedRecord = await DataRecord.findByPk(record.id, {
      include: [{
        model: RecordValue,
        as: 'values',
        include: [{ model: RecipeElement, as: 'element' }]
      }]
    });

    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete record
router.delete('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const record = await DataRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
