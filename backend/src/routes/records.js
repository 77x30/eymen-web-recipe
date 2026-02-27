const express = require('express');
const { DataRecord, RecordValue, RecipeElement, Recipe } = require('../models');
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

function canAccessWorkspace(resourceWorkspaceId, user) {
  return isAdmin(user) || resourceWorkspaceId === user.workspace_id;
}

async function getRecordWithRecipe(recordId) {
  return DataRecord.findByPk(recordId, {
    include: [{ model: Recipe, attributes: ['id', 'workspace_id'] }]
  });
}

// Get single record with values
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const scopedRecord = await getRecordWithRecipe(req.params.id);
    if (!scopedRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }
    if (!canAccessWorkspace(scopedRecord.Recipe?.workspace_id, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const record = await DataRecord.findByPk(req.params.id, {
      include: [{
        model: RecordValue,
        as: 'values',
        include: [{ model: RecipeElement, as: 'element' }]
      }]
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update record
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const { name, values } = req.body;
    const scopedRecord = await getRecordWithRecipe(req.params.id);

    if (!scopedRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }
    if (!canAccessWorkspace(scopedRecord.Recipe?.workspace_id, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const record = await DataRecord.findByPk(req.params.id);
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
    if (!ensureWorkspaceAccess(req.user, res)) return;

    const scopedRecord = await getRecordWithRecipe(req.params.id);
    if (!scopedRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }
    if (!canAccessWorkspace(scopedRecord.Recipe?.workspace_id, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const record = await DataRecord.findByPk(req.params.id);
    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
