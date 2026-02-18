const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Workspace } = require('../models');
const jwtConfig = require('../config/jwt');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, subdomain } = req.body;

    const user = await User.findOne({ 
      where: { username },
      include: [{ model: Workspace, as: 'workspace' }]
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If login is from a subdomain, check if user belongs to that workspace
    if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
      const workspace = await Workspace.findOne({ where: { subdomain } });
      
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }
      
      // Admin can access any workspace
      if (user.role !== 'admin' && user.workspace_id !== workspace.id) {
        return res.status(403).json({ error: 'You do not have access to this workspace' });
      }
    }

    // If user is not admin and trying to login from main domain, deny
    if (!subdomain && user.role !== 'admin') {
      return res.status(403).json({ error: 'Please login from your workspace subdomain' });
    }

    // Check if first login and biometric verification required
    const requiresBiometric = user.first_login && !user.biometric_verified && user.role !== 'admin';

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        workspace_id: user.workspace_id
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        workspace_id: user.workspace_id,
        workspace: user.workspace,
        biometric_verified: user.biometric_verified,
        first_login: user.first_login
      },
      requiresBiometric
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [{ model: Workspace, as: 'workspace' }],
    attributes: ['id', 'username', 'role', 'workspace_id', 'biometric_verified', 'biometric_photo', 'first_login']
  });
  
  res.json(user);
});

// Generate QR verification token
router.post('/generate-verification', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a unique verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    await user.update({ verification_token: verificationToken });
    
    // QR code will contain this URL
    const verificationUrl = `https://identity.barida.xyz/verify/${verificationToken}`;
    
    res.json({ 
      verificationUrl,
      token: verificationToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify biometric (called from identity.barida.xyz)
router.post('/verify-biometric', async (req, res) => {
  try {
    const { token, photoData } = req.body;
    
    if (!token || !photoData) {
      return res.status(400).json({ error: 'Token and photo data required' });
    }

    const user = await User.findOne({ where: { verification_token: token } });
    
    if (!user) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    // Store biometric photo and mark as verified
    await user.update({
      biometric_verified: true,
      biometric_photo: photoData,
      verification_token: null,
      first_login: false
    });

    res.json({ 
      success: true, 
      message: 'Biometric verification completed',
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check verification status
router.get('/verification-status/:token', async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { verification_token: req.params.token },
      attributes: ['id', 'username', 'biometric_verified']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Token not found or already used' });
    }

    res.json({
      pending: true,
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register - ADMIN ONLY
router.post('/register', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { username, password, role, workspace_id } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Validate workspace exists if provided
    if (workspace_id) {
      const workspace = await Workspace.findByPk(workspace_id);
      if (!workspace) {
        return res.status(400).json({ error: 'Workspace not found' });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password_hash,
      role: role || 'operator',
      workspace_id: workspace_id || null,
      first_login: true,
      biometric_verified: false
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
      workspace_id: user.workspace_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
