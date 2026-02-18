const express = require('express');
const router = express.Router();
const { User, Recipe, DataRecord, Workspace } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// All admin routes require admin or sub_admin role
router.use(authenticate);

// Helper to check if user can manage another user
const canManageRole = (managerRole, targetRole) => {
  const hierarchy = { admin: 4, sub_admin: 3, operator: 2, viewer: 1 };
  return hierarchy[managerRole] > hierarchy[targetRole];
};

// Get all users (filtered for sub_admin)
router.get('/users', authorize('admin', 'sub_admin'), async (req, res) => {
  try {
    const whereClause = {};
    
    // sub_admin can only see users in their workspace
    if (req.user.role === 'sub_admin') {
      whereClause.workspace_id = req.user.workspace_id;
    }
    
    const users = await User.findAll({
      where: whereClause,
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
router.get('/workspaces/:workspaceId/users', authorize('admin', 'sub_admin'), async (req, res) => {
  try {
    // sub_admin can only access their own workspace
    if (req.user.role === 'sub_admin' && req.user.workspace_id !== parseInt(req.params.workspaceId)) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }
    
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
router.post('/users', authorize('admin', 'sub_admin'), async (req, res) => {
  try {
    const { username, password, role, workspace_id } = req.body;

    // sub_admin restrictions
    if (req.user.role === 'sub_admin') {
      // Can only add to their own workspace
      if (workspace_id !== req.user.workspace_id) {
        return res.status(403).json({ error: 'You can only add users to your own workspace' });
      }
      
      // Can only add operator or viewer (not admin or sub_admin)
      if (role === 'admin' || role === 'sub_admin') {
        return res.status(403).json({ error: 'You cannot create admin or sub_admin users' });
      }
      
      // Check user limit (max 4 users per sub_admin)
      const userCount = await User.count({ 
        where: { workspace_id: req.user.workspace_id }
      });
      if (userCount >= 4) {
        return res.status(403).json({ error: 'User limit reached (max 4 users per workspace)' });
      }
    }

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
router.put('/users/:id', authorize('admin', 'sub_admin'), async (req, res) => {
  try {
    const { role, workspace_id } = req.body;
    const userId = req.params.id;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // sub_admin restrictions
    if (req.user.role === 'sub_admin') {
      // Can only manage users in their workspace
      if (targetUser.workspace_id !== req.user.workspace_id) {
        return res.status(403).json({ error: 'You can only manage users in your workspace' });
      }
      
      // Cannot change to admin or sub_admin
      if (role === 'admin' || role === 'sub_admin') {
        return res.status(403).json({ error: 'You cannot assign admin or sub_admin roles' });
      }
      
      // Cannot change workspace
      if (workspace_id !== undefined && workspace_id !== req.user.workspace_id) {
        return res.status(403).json({ error: 'You cannot move users to another workspace' });
      }
      
      // Cannot manage admin or sub_admin users
      if (!canManageRole(req.user.role, targetUser.role)) {
        return res.status(403).json({ error: 'You cannot manage this user' });
      }
    }

    // Validate workspace if provided
    if (workspace_id) {
      const workspace = await Workspace.findByPk(workspace_id);
      if (!workspace) {
        return res.status(400).json({ error: 'Workspace not found' });
      }
    }

    await targetUser.update({ 
      role: role || targetUser.role,
      workspace_id: workspace_id !== undefined ? workspace_id : targetUser.workspace_id
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
router.put('/users/:id/reset-password', authorize('admin', 'sub_admin'), async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // sub_admin restrictions
    if (req.user.role === 'sub_admin') {
      if (targetUser.workspace_id !== req.user.workspace_id) {
        return res.status(403).json({ error: 'You can only manage users in your workspace' });
      }
      if (!canManageRole(req.user.role, targetUser.role)) {
        return res.status(403).json({ error: 'You cannot manage this user' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await targetUser.update({ 
      password_hash: hashedPassword,
      first_login: true
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Reset biometric verification
router.put('/users/:id/reset-biometric', authorize('admin', 'sub_admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // sub_admin restrictions
    if (req.user.role === 'sub_admin') {
      if (targetUser.workspace_id !== req.user.workspace_id) {
        return res.status(403).json({ error: 'You can only manage users in your workspace' });
      }
      if (!canManageRole(req.user.role, targetUser.role)) {
        return res.status(403).json({ error: 'You cannot manage this user' });
      }
    }

    await targetUser.update({ 
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
router.delete('/users/:id', authorize('admin', 'sub_admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // sub_admin restrictions
    if (req.user.role === 'sub_admin') {
      if (targetUser.workspace_id !== req.user.workspace_id) {
        return res.status(403).json({ error: 'You can only manage users in your workspace' });
      }
      if (!canManageRole(req.user.role, targetUser.role)) {
        return res.status(403).json({ error: 'You cannot delete this user' });
      }
    }

    await targetUser.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system stats
router.get('/stats', authorize('admin', 'sub_admin'), async (req, res) => {
  try {
    let userCount, workspaceCount;
    
    if (req.user.role === 'sub_admin') {
      // sub_admin only sees their workspace stats
      userCount = await User.count({ where: { workspace_id: req.user.workspace_id } });
      workspaceCount = 1;
    } else {
      userCount = await User.count();
      workspaceCount = await Workspace.count();
    }
    
    const [recipeCount, recordCount] = await Promise.all([
      Recipe.count(),
      DataRecord.count()
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
