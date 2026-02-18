const express = require('express');
const router = express.Router();
const { User, Recipe, DataRecord, Workspace } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// All admin routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'workspace_id', 'biometric_verified', 'biometric_photo', 'first_login', 'created_at'],
      include: [{ model: Workspace, as: 'workspace', attributes: ['id', 'name', 'subdomain'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get users by workspace
router.get('/workspaces/:workspaceId/users', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { workspace_id: req.params.workspaceId },
      attributes: ['id', 'username', 'role', 'biometric_verified', 'biometric_photo', 'first_login', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching workspace users:', error);
    res.status(500).json({ error: 'Failed to fetch workspace users' });
  }
});

// Create new user (with workspace assignment)
router.post('/users', async (req, res) => {
  try {
    const { username, password, role, workspace_id } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Validate workspace if provided
    if (workspace_id) {
      const workspace = await Workspace.findByPk(workspace_id);
      if (!workspace) {
        return res.status(400).json({ error: 'Workspace not found' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password_hash: hashedPassword,
      role: role || 'operator',
      workspace_id: workspace_id || null,
      first_login: true,
      biometric_verified: false
    });

    const userWithWorkspace = await User.findByPk(user.id, {
      attributes: ['id', 'username', 'role', 'workspace_id', 'biometric_verified', 'first_login', 'created_at'],
      include: [{ model: Workspace, as: 'workspace', attributes: ['id', 'name', 'subdomain'] }]
    });

    res.status(201).json(userWithWorkspace);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user role and workspace
router.put('/users/:id', async (req, res) => {
  try {
    const { role, workspace_id } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate workspace if provided
    if (workspace_id) {
      const workspace = await Workspace.findByPk(workspace_id);
      if (!workspace) {
        return res.status(400).json({ error: 'Workspace not found' });
      }
    }

    await user.update({ 
      role: role || user.role,
      workspace_id: workspace_id !== undefined ? workspace_id : user.workspace_id
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'username', 'role', 'workspace_id', 'biometric_verified', 'first_login', 'created_at'],
      include: [{ model: Workspace, as: 'workspace', attributes: ['id', 'name', 'subdomain'] }]
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset user password
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ 
      password_hash: hashedPassword,
      first_login: true // Force biometric verification on next login
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Reset biometric verification
router.put('/users/:id/reset-biometric', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ 
      biometric_verified: false,
      biometric_photo: null,
      first_login: true
    });

    res.json({ message: 'Biometric verification reset' });
  } catch (error) {
    console.error('Error resetting biometric:', error);
    res.status(500).json({ error: 'Failed to reset biometric' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const [userCount, recipeCount, recordCount, workspaceCount] = await Promise.all([
      User.count(),
      Recipe.count(),
      DataRecord.count(),
      Workspace.count()
    ]);

    res.json({
      users: userCount,
      recipes: recipeCount,
      records: recordCount,
      workspaces: workspaceCount,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
