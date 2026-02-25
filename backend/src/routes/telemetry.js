const express = require('express');
const router = express.Router();
const { SystemUpdate, AppTelemetry, User, Workspace } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Screenshot upload storage
const screenshotDir = path.join(__dirname, '../../uploads/screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, screenshotDir),
  filename: (req, file, cb) => {
    const deviceId = req.body.device_id || 'unknown';
    const safeId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeId}_latest.jpg`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// Serve screenshots
router.get('/screenshots/:filename', authenticate, authorize('admin'), (req, res) => {
  const filepath = path.join(screenshotDir, req.params.filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'Screenshot not found' });
  }
});

// Get all system updates (admin only)
router.get('/updates', authenticate, authorize('admin'), async (req, res) => {
  try {
    const updates = await SystemUpdate.findAll({
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish new update (admin only)
router.post('/updates', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { version, note, target, workspace_ids } = req.body;
    
    // Store workspace_ids as JSON array for targeted updates
    const targetWorkspaces = target === 'workspace' && workspace_ids?.length > 0 
      ? JSON.stringify(workspace_ids) 
      : null;
    
    const update = await SystemUpdate.create({
      version: version || '1.0.0',
      note,
      target_workspaces: targetWorkspaces,
      created_by: req.user.id,
      is_active: true
    });
    
    res.status(201).json(update);
  } catch (error) {
    console.error('Create update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete update (admin only)
router.delete('/updates/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const update = await SystemUpdate.findByPk(req.params.id);
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }
    await update.destroy();
    res.json({ message: 'Update deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get telemetry overview (admin only)
router.get('/telemetry', authenticate, authorize('admin'), async (req, res) => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Get all telemetry records
    const allTelemetry = await AppTelemetry.findAll({
      include: [{ model: Workspace, as: 'workspace', attributes: ['id', 'name', 'subdomain'] }],
      order: [['last_ping', 'DESC']]
    });
    
    // Calculate stats
    const onlineClients = allTelemetry.filter(t => new Date(t.last_ping) > oneMinuteAgo);
    const idleClients = allTelemetry.filter(t => {
      const lastPing = new Date(t.last_ping);
      return lastPing <= oneMinuteAgo && lastPing > fiveMinutesAgo;
    });
    const offlineClients = allTelemetry.filter(t => new Date(t.last_ping) <= fiveMinutesAgo);
    
    // Average RAM usage for online clients
    const avgRam = onlineClients.length > 0 
      ? onlineClients.reduce((sum, t) => sum + (t.ram_usage_mb || 0), 0) / onlineClients.length 
      : 0;
    
    // Version distribution
    const versionMap = {};
    allTelemetry.forEach(t => {
      if (t.app_version) {
        versionMap[t.app_version] = (versionMap[t.app_version] || 0) + 1;
      }
    });
    
    res.json({
      summary: {
        total: allTelemetry.length,
        online: onlineClients.length,
        idle: idleClients.length,
        offline: offlineClients.length,
        avgRamMb: Math.round(avgRam * 10) / 10
      },
      versions: versionMap,
      clients: allTelemetry.map(t => ({
        device_id: t.device_id,
        workspace: t.workspace?.name || 'Unknown',
        username: t.username,
        app_version: t.app_version,
        ram_usage_mb: t.ram_usage_mb,
        cpu_usage_percent: t.cpu_usage_percent,
        os_info: t.os_info,
        status: new Date(t.last_ping) > oneMinuteAgo ? 'online' : 
                new Date(t.last_ping) > fiveMinutesAgo ? 'idle' : 'offline',
        last_ping: t.last_ping,
        first_seen: t.first_seen,
        screenshot_url: t.screenshot_url
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Screenshot upload endpoint (from WinForms apps, no auth)
router.post('/telemetry/screenshot', upload.single('screenshot'), async (req, res) => {
  try {
    const { device_id } = req.body;
    if (!device_id || !req.file) {
      return res.status(400).json({ error: 'device_id and screenshot file required' });
    }
    
    const screenshotUrl = `/api/system/screenshots/${req.file.filename}`;
    
    await AppTelemetry.update(
      { screenshot_url: screenshotUrl },
      { where: { device_id } }
    );
    
    res.json({ status: 'ok', screenshot_url: screenshotUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Telemetry heartbeat endpoint (from WinForms apps)
router.post('/telemetry/heartbeat', async (req, res) => {
  try {
    const { 
      device_id, 
      workspace_subdomain, 
      username,
      app_version, 
      ram_usage_mb, 
      cpu_usage_percent,
      os_info,
      screen_resolution
    } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }
    
    // Find workspace by subdomain if provided
    let workspace_id = null;
    if (workspace_subdomain) {
      const workspace = await Workspace.findOne({ where: { subdomain: workspace_subdomain } });
      if (workspace) workspace_id = workspace.id;
    }
    
    // Upsert telemetry record
    const existingRecord = await AppTelemetry.findOne({ where: { device_id } });
    
    if (existingRecord) {
      await existingRecord.update({
        workspace_id,
        username,
        app_version,
        ram_usage_mb,
        cpu_usage_percent,
        os_info,
        screen_resolution,
        status: 'online',
        last_ping: new Date()
      });
    } else {
      await AppTelemetry.create({
        device_id,
        workspace_id,
        username,
        app_version,
        ram_usage_mb,
        cpu_usage_percent,
        os_info,
        screen_resolution,
        status: 'online',
        last_ping: new Date(),
        first_seen: new Date()
      });
    }
    
    // Get latest update for this workspace
    const latestUpdate = await SystemUpdate.findOne({
      where: {
        [Op.or]: [
          { target_workspaces: null },
          workspace_id ? { target_workspaces: { [Op.like]: `%${workspace_id}%` } } : {}
        ]
      },
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      status: 'ok',
      server_time: new Date().toISOString(),
      latest_update: latestUpdate ? {
        version: latestUpdate.version,
        note: latestUpdate.note,
        released_at: latestUpdate.created_at
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest version info (public, for WinForms update check)
router.get('/version', async (req, res) => {
  try {
    const latestUpdate = await SystemUpdate.findOne({
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      version: latestUpdate?.version || '1.0.0',
      note: latestUpdate?.note || null,
      released_at: latestUpdate?.created_at || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detailed system status (admin only)
router.get('/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Database latency test
    const dbStart = Date.now();
    await AppTelemetry.sequelize.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;
    
    // Memory usage
    const mem = process.memoryUsage();
    
    // Count records
    const [totalUsers, totalWorkspaces, totalUpdates, activeTelemetry] = await Promise.all([
      User.count(),
      Workspace.count(),
      SystemUpdate.count(),
      AppTelemetry.count({ where: { last_ping: { [Op.gt]: new Date(Date.now() - 5 * 60 * 1000) } } })
    ]);
    
    const totalLatency = Date.now() - startTime;
    
    res.json({
      api: {
        status: 'online',
        latency: totalLatency,
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version
      },
      database: {
        status: 'online',
        latency: dbLatency,
        records: { users: totalUsers, workspaces: totalWorkspaces, updates: totalUpdates }
      },
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024)
      },
      connections: {
        activeClients: activeTelemetry
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
