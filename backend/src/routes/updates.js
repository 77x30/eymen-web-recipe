const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const SystemUpdate = require('../models/SystemUpdate');
const Workspace = require('../models/Workspace');

// GitHub repo info
const GITHUB_OWNER = '77x30';
const GITHUB_REPO = 'eymen-web-recipe';

// Get recent GitHub commits
router.get('/commits', async (req, res) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=20`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BaridaRecipeManager'
      }
    });
    
    if (!response.ok) {
      throw new Error('GitHub API error');
    }
    
    const commits = await response.json();
    
    // Format commits for frontend
    const formattedCommits = commits.map(c => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0], // First line only
      fullMessage: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url
    }));
    
    res.json(formattedCommits);
  } catch (error) {
    console.error('GitHub commits error:', error);
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
});

// Get latest update info (for WinForms app)
router.get('/check', async (req, res) => {
  try {
    const { workspace_id, current_version } = req.query;
    
    // Build where clause
    let whereClause = { is_active: true };
    
    // Find latest update
    const update = await SystemUpdate.findOne({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    if (!update) {
      return res.json({ 
        hasUpdate: false,
        message: 'No updates available'
      });
    }
    
    // Check workspace targeting
    if (update.target_workspaces && workspace_id) {
      const targets = JSON.parse(update.target_workspaces);
      if (targets.length > 0 && !targets.includes(parseInt(workspace_id))) {
        return res.json({ 
          hasUpdate: false,
          message: 'No updates for this workspace'
        });
      }
    }
    
    // Check if user needs update
    const needsUpdate = !current_version || update.version !== current_version;
    
    res.json({
      hasUpdate: needsUpdate,
      version: update.version,
      download_url: update.download_url || 'https://barida.xyz/downloads/BaridaRecipeManager.exe',
      release_notes: update.note,
      is_mandatory: update.is_mandatory || false,
      file_size: update.file_size || 0
    });
  } catch (error) {
    console.error('Update check error:', error);
    res.status(500).json({ error: 'Failed to check for updates' });
  }
});

// Create new update (admin only)
router.post('/', async (req, res) => {
  try {
    const { version, download_url, note, is_mandatory, target_workspaces, file_size, created_by } = req.body;
    
    // Deactivate previous active updates
    await SystemUpdate.update(
      { is_active: false },
      { where: { is_active: true } }
    );
    
    // Create new update
    const update = await SystemUpdate.create({
      version,
      download_url: download_url || 'https://barida.xyz/downloads/BaridaRecipeManager.exe',
      note,
      is_mandatory: is_mandatory || false,
      target_workspaces: target_workspaces ? JSON.stringify(target_workspaces) : null,
      file_size: file_size || 0,
      is_active: true,
      created_by: created_by || 1
    });
    
    res.json(update);
  } catch (error) {
    console.error('Create update error:', error);
    res.status(500).json({ error: 'Failed to create update' });
  }
});

// List all updates
router.get('/', async (req, res) => {
  try {
    const updates = await SystemUpdate.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(updates);
  } catch (error) {
    console.error('List updates error:', error);
    res.status(500).json({ error: 'Failed to list updates' });
  }
});

// Delete update
router.delete('/:id', async (req, res) => {
  try {
    await SystemUpdate.destroy({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete update error:', error);
    res.status(500).json({ error: 'Failed to delete update' });
  }
});

// Update an update record
router.put('/:id', async (req, res) => {
  try {
    const { version, note, is_mandatory, is_active, target_workspaces } = req.body;
    
    const [count] = await SystemUpdate.update({
      version,
      note,
      is_mandatory,
      is_active,
      target_workspaces: target_workspaces ? JSON.stringify(target_workspaces) : null
    }, {
      where: { id: req.params.id }
    });
    
    if (count === 0) {
      return res.status(404).json({ error: 'Update not found' });
    }
    
    const update = await SystemUpdate.findByPk(req.params.id);
    res.json(update);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;
