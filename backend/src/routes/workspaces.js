const express = require('express');
const router = express.Router();
const { Workspace, User, Recipe } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Get all workspaces (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const workspaces = await Workspace.findAll({
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workspace by subdomain (public)
router.get('/subdomain/:subdomain', async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      where: { subdomain: req.params.subdomain, status: 'active' }
    });
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single workspace
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }]
    });
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create workspace (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, subdomain, description, company, location, settings } = req.body;
    
    // Check if subdomain already exists
    const existing = await Workspace.findOne({ where: { subdomain } });
    if (existing) {
      return res.status(400).json({ error: 'Subdomain already in use' });
    }
    
    const workspace = await Workspace.create({
      name,
      subdomain: subdomain.toLowerCase(),
      description,
      company,
      location,
      settings,
      created_by: req.user.id
    });
    
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update workspace (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    const { name, description, company, location, status, settings } = req.body;
    
    await workspace.update({
      name: name || workspace.name,
      description: description !== undefined ? description : workspace.description,
      company: company !== undefined ? company : workspace.company,
      location: location !== undefined ? location : workspace.location,
      status: status || workspace.status,
      settings: settings || workspace.settings
    });
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete workspace (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    await workspace.destroy();
    res.json({ message: 'Workspace deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test workspace connection (admin only)
router.post('/:id/test', authenticate, authorize('admin'), async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Simulate connection test
    const testResult = {
      workspace: workspace.name,
      subdomain: workspace.subdomain,
      status: workspace.status,
      url: `https://${workspace.subdomain}.barida.xyz`,
      ping: Math.floor(Math.random() * 50) + 10,
      online: workspace.status === 'active',
      timestamp: new Date().toISOString()
    };
    
    res.json(testResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
