const express = require('express');
const router = express.Router();
const { Recipe, RecipeElement, DataRecord, RecordValue, User, Workspace, ActivityLog, AppTelemetry } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');

// ==================== PRODUCTION ANALYTICS ====================

// Daily production summary - records created per day
router.get('/production/daily', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await DataRecord.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('DataRecord.id')), 'count']
      ],
      where: { created_at: { [Op.gte]: since } },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    // Records per recipe per day
    const byRecipe = await DataRecord.findAll({
      attributes: [
        [fn('DATE', col('DataRecord.created_at')), 'date'],
        'recipe_id',
        [fn('COUNT', col('DataRecord.id')), 'count']
      ],
      include: [{ model: Recipe, attributes: ['name'], required: true }],
      where: { created_at: { [Op.gte]: since } },
      group: [fn('DATE', col('DataRecord.created_at')), 'recipe_id'],
      order: [[fn('DATE', col('DataRecord.created_at')), 'ASC']],
      raw: true
    });

    // Total stats
    const totalRecords = await DataRecord.count({ where: { created_at: { [Op.gte]: since } } });
    const totalRecipes = await Recipe.count();
    const todayCount = await DataRecord.count({
      where: { created_at: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } }
    });

    res.json({
      daily: records,
      byRecipe,
      summary: { totalRecords, totalRecipes, todayCount, period: days }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Production analysis - speed, efficiency, trends
router.get('/production/analysis', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Records per hour of day (production distribution)
    const hourly = await DataRecord.findAll({
      attributes: [
        [fn('HOUR', col('created_at')), 'hour'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: { created_at: { [Op.gte]: since } },
      group: [fn('HOUR', col('created_at'))],
      order: [[fn('HOUR', col('created_at')), 'ASC']],
      raw: true
    });

    // Recipe distribution
    const recipeDistribution = await DataRecord.findAll({
      attributes: [
        'recipe_id',
        [fn('COUNT', col('DataRecord.id')), 'count']
      ],
      include: [{ model: Recipe, attributes: ['name'], required: true }],
      where: { created_at: { [Op.gte]: since } },
      group: ['recipe_id'],
      order: [[fn('COUNT', col('DataRecord.id')), 'DESC']],
      raw: true
    });

    // Weekly comparison (this week vs last week)
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeek = await DataRecord.count({ where: { created_at: { [Op.gte]: thisWeekStart } } });
    const lastWeek = await DataRecord.count({
      where: { created_at: { [Op.gte]: lastWeekStart, [Op.lt]: thisWeekStart } }
    });

    res.json({
      hourlyDistribution: hourly,
      recipeDistribution,
      weeklyComparison: {
        thisWeek,
        lastWeek,
        changePercent: lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EMPLOYEE PERFORMANCE ====================

router.get('/employees', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Records created per user
    const userProduction = await DataRecord.findAll({
      attributes: [
        'created_by',
        [fn('COUNT', col('DataRecord.id')), 'recordCount']
      ],
      include: [{ model: User, as: 'creator', attributes: ['username', 'role'] }],
      where: { created_at: { [Op.gte]: since }, created_by: { [Op.ne]: null } },
      group: ['created_by'],
      order: [[fn('COUNT', col('DataRecord.id')), 'DESC']],
      raw: true
    });

    // Activity per user (actions logged)
    const userActivity = await ActivityLog.findAll({
      attributes: [
        'user_id',
        'action',
        [fn('COUNT', col('ActivityLog.id')), 'count']
      ],
      include: [{ model: User, attributes: ['username'] }],
      where: { created_at: { [Op.gte]: since } },
      group: ['user_id', 'action'],
      raw: true
    });

    // Daily activity per user
    const dailyActivity = await DataRecord.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        'created_by',
        [fn('COUNT', col('DataRecord.id')), 'count']
      ],
      where: { created_at: { [Op.gte]: since }, created_by: { [Op.ne]: null } },
      group: [fn('DATE', col('created_at')), 'created_by'],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    // Working hours estimate (first and last record of each day per user)
    const workingHours = await sequelize.query(`
      SELECT created_by, DATE(created_at) as date,
        MIN(TIME(created_at)) as first_activity,
        MAX(TIME(created_at)) as last_activity,
        COUNT(*) as actions,
        TIMESTAMPDIFF(MINUTE, MIN(created_at), MAX(created_at)) as active_minutes
      FROM data_records
      WHERE created_at >= :since AND created_by IS NOT NULL
      GROUP BY created_by, DATE(created_at)
      ORDER BY date DESC
    `, {
      replacements: { since },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => []);

    res.json({ userProduction, userActivity, dailyActivity, workingHours });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RECIPE/MACHINE ANALYSIS ====================

// Machine utilization (recipe usage patterns)
router.get('/machines', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Records per recipe (machine = recipe in this context)
    const recipeUsage = await DataRecord.findAll({
      attributes: [
        'recipe_id',
        [fn('COUNT', col('DataRecord.id')), 'totalRecords'],
        [fn('MIN', col('DataRecord.created_at')), 'firstUsed'],
        [fn('MAX', col('DataRecord.created_at')), 'lastUsed']
      ],
      include: [{
        model: Recipe,
        attributes: ['name', 'description'],
        include: [{ model: RecipeElement, as: 'elements', attributes: ['id', 'name', 'data_type', 'unit'] }]
      }],
      where: { created_at: { [Op.gte]: since } },
      group: ['recipe_id'],
      order: [[fn('COUNT', col('DataRecord.id')), 'DESC']],
      raw: false
    });

    // Daily usage per recipe
    const dailyUsage = await DataRecord.findAll({
      attributes: [
        [fn('DATE', col('DataRecord.created_at')), 'date'],
        'recipe_id',
        [fn('COUNT', col('DataRecord.id')), 'count']
      ],
      include: [{ model: Recipe, attributes: ['name'], required: true }],
      where: { created_at: { [Op.gte]: since } },
      group: [fn('DATE', col('DataRecord.created_at')), 'recipe_id'],
      order: [[fn('DATE', col('DataRecord.created_at')), 'ASC']],
      raw: true
    });

    res.json({ recipeUsage, dailyUsage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== QUALITY ANALYSIS ====================

// Quality analysis - element value distributions and out-of-range counts
router.get('/quality', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recipeId = req.query.recipe_id;

    const whereClause = {};
    if (recipeId) {
      whereClause.recipe_id = recipeId;
    }

    // Get all elements with min/max constraints
    const elementsWithLimits = await RecipeElement.findAll({
      where: {
        [Op.or]: [
          { min_value: { [Op.ne]: null } },
          { max_value: { [Op.ne]: null } }
        ],
        ...(recipeId ? { recipe_id: recipeId } : {})
      },
      include: [{ model: Recipe, attributes: ['name'] }],
      raw: true
    });

    // For each element with limits, count in-range vs out-of-range
    const qualityResults = [];
    for (const element of elementsWithLimits) {
      const values = await RecordValue.findAll({
        attributes: ['value'],
        where: { element_id: element.id },
        include: [{
          model: DataRecord,
          attributes: [],
          where: { created_at: { [Op.gte]: since }, ...whereClause }
        }],
        raw: true
      });

      let inRange = 0, outOfRange = 0, totalValues = 0;
      const numericValues = [];

      for (const v of values) {
        const num = parseFloat(v.value);
        if (isNaN(num)) continue;
        totalValues++;
        numericValues.push(num);

        const min = element.min_value !== null ? parseFloat(element.min_value) : -Infinity;
        const max = element.max_value !== null ? parseFloat(element.max_value) : Infinity;
        if (num >= min && num <= max) inRange++;
        else outOfRange++;
      }

      const avg = numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
      const stdDev = numericValues.length > 1
        ? Math.sqrt(numericValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (numericValues.length - 1))
        : 0;

      qualityResults.push({
        elementId: element.id,
        elementName: element.name,
        recipeName: element['Recipe.name'],
        unit: element.unit,
        minValue: element.min_value,
        maxValue: element.max_value,
        totalValues,
        inRange,
        outOfRange,
        defectRate: totalValues > 0 ? Math.round((outOfRange / totalValues) * 10000) / 100 : 0,
        avg: Math.round(avg * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100
      });
    }

    // Overall quality score
    const totalInRange = qualityResults.reduce((s, r) => s + r.inRange, 0);
    const totalAll = qualityResults.reduce((s, r) => s + r.totalValues, 0);

    res.json({
      elements: qualityResults,
      overallQuality: totalAll > 0 ? Math.round((totalInRange / totalAll) * 10000) / 100 : 100,
      totalMeasurements: totalAll,
      period: days
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== KPI DASHBOARD ====================

router.get('/kpi', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const previousPeriod = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);

    // Current period metrics
    const [currentRecords, previousRecords, activeUsers, totalUsers,
           activeRecipes, totalWorkspaces, onlineClients] = await Promise.all([
      DataRecord.count({ where: { created_at: { [Op.gte]: since } } }),
      DataRecord.count({ where: { created_at: { [Op.gte]: previousPeriod, [Op.lt]: since } } }),
      DataRecord.count({
        attributes: [[fn('DISTINCT', col('created_by')), 'users']],
        where: { created_at: { [Op.gte]: since }, created_by: { [Op.ne]: null } },
        distinct: true, col: 'created_by'
      }),
      User.count(),
      Recipe.count(),
      Workspace.count(),
      AppTelemetry.count({ where: { last_ping: { [Op.gt]: new Date(Date.now() - 5 * 60 * 1000) } } })
    ]);

    // Recipes with records in period
    const activeRecipesInPeriod = await DataRecord.count({
      attributes: [[fn('DISTINCT', col('recipe_id')), 'recipes']],
      where: { created_at: { [Op.gte]: since } },
      distinct: true, col: 'recipe_id'
    });

    // Quality score (from elements with limits)
    const elementsWithLimits = await RecipeElement.count({
      where: { [Op.or]: [{ min_value: { [Op.ne]: null } }, { max_value: { [Op.ne]: null } }] }
    });

    const changePercent = previousRecords > 0
      ? Math.round(((currentRecords - previousRecords) / previousRecords) * 100) : 0;

    res.json({
      kpis: [
        { id: 'total-records', label: 'Total Records', value: currentRecords, change: changePercent, unit: '' },
        { id: 'daily-avg', label: 'Daily Average', value: days > 0 ? Math.round(currentRecords / days * 10) / 10 : 0, change: null, unit: '/day' },
        { id: 'active-users', label: 'Active Users', value: activeUsers, total: totalUsers, unit: '' },
        { id: 'active-recipes', label: 'Active Recipes', value: activeRecipesInPeriod, total: activeRecipes, unit: '' },
        { id: 'workspaces', label: 'Workspaces', value: totalWorkspaces, unit: '' },
        { id: 'online-clients', label: 'Online Clients', value: onlineClients, unit: '' },
        { id: 'quality-params', label: 'Quality Parameters', value: elementsWithLimits, unit: '' }
      ],
      period: days
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RAW MATERIALS / ELEMENT VALUES ====================

// Element value trends over time (for raw materials tracking)
router.get('/elements/:elementId/trends', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { elementId } = req.params;
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const element = await RecipeElement.findByPk(elementId, {
      include: [{ model: Recipe, attributes: ['name'] }]
    });
    if (!element) return res.status(404).json({ error: 'Element not found' });

    const values = await RecordValue.findAll({
      where: { element_id: elementId },
      include: [{
        model: DataRecord,
        attributes: ['created_at', 'name', 'record_number'],
        where: { created_at: { [Op.gte]: since } }
      }],
      order: [[DataRecord, 'created_at', 'ASC']],
      raw: true
    });

    const dataPoints = values
      .map(v => ({
        date: v['DataRecord.created_at'],
        recordName: v['DataRecord.name'],
        recordNumber: v['DataRecord.record_number'],
        value: parseFloat(v.value)
      }))
      .filter(v => !isNaN(v.value));

    res.json({
      element: { id: element.id, name: element.name, unit: element.unit, min: element.min_value, max: element.max_value },
      recipe: element.Recipe?.name,
      dataPoints,
      stats: dataPoints.length > 0 ? {
        min: Math.min(...dataPoints.map(d => d.value)),
        max: Math.max(...dataPoints.map(d => d.value)),
        avg: Math.round(dataPoints.reduce((s, d) => s + d.value, 0) / dataPoints.length * 100) / 100,
        count: dataPoints.length
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PLANNED VS ACTUAL ====================

// Compare recipe default values (planned) vs actual recorded values
router.get('/planned-vs-actual', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recipeId = req.query.recipe_id;

    const recipeWhere = recipeId ? { id: recipeId } : {};
    const recipes = await Recipe.findAll({
      where: recipeWhere,
      include: [{
        model: RecipeElement, as: 'elements',
        where: { default_value: { [Op.ne]: null }, data_type: { [Op.in]: ['integer', 'float'] } },
        required: true
      }]
    });

    const results = [];
    for (const recipe of recipes) {
      for (const element of recipe.elements) {
        const planned = parseFloat(element.default_value);
        if (isNaN(planned)) continue;

        const values = await RecordValue.findAll({
          attributes: ['value'],
          where: { element_id: element.id },
          include: [{
            model: DataRecord,
            attributes: [],
            where: { created_at: { [Op.gte]: since }, recipe_id: recipe.id }
          }],
          raw: true
        });

        const actuals = values.map(v => parseFloat(v.value)).filter(v => !isNaN(v));
        if (actuals.length === 0) continue;

        const avgActual = actuals.reduce((a, b) => a + b, 0) / actuals.length;
        const deviation = planned !== 0 ? Math.round(((avgActual - planned) / planned) * 10000) / 100 : 0;

        results.push({
          recipeName: recipe.name,
          elementName: element.name,
          unit: element.unit,
          planned: Math.round(planned * 100) / 100,
          actual: Math.round(avgActual * 100) / 100,
          deviation,
          sampleCount: actuals.length,
          min: Math.round(Math.min(...actuals) * 100) / 100,
          max: Math.round(Math.max(...actuals) * 100) / 100
        });
      }
    }

    res.json({ comparisons: results, period: days });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MONITORING / LIVE DATA ====================

// Live system metrics for monitoring dashboard
router.get('/monitoring/live', authenticate, authorize('admin'), async (req, res) => {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [onlineClients, allClients, todayRecords, todayRecipes] = await Promise.all([
      AppTelemetry.findAll({
        where: { last_ping: { [Op.gt]: oneMinAgo } },
        include: [{ model: Workspace, as: 'workspace', attributes: ['name'] }],
        raw: true
      }),
      AppTelemetry.findAll({
        where: { last_ping: { [Op.gt]: fiveMinAgo } },
        raw: true
      }),
      DataRecord.count({ where: { created_at: { [Op.gte]: todayStart } } }),
      DataRecord.count({
        attributes: [[fn('DISTINCT', col('recipe_id')), 'c']],
        where: { created_at: { [Op.gte]: todayStart } },
        distinct: true, col: 'recipe_id'
      })
    ]);

    // Memory/RAM distribution of clients
    const avgClientRam = allClients.length > 0
      ? Math.round(allClients.reduce((s, c) => s + (c.ram_usage_mb || 0), 0) / allClients.length)
      : 0;

    // Server metrics
    const mem = process.memoryUsage();
    const dbStart = Date.now();
    await sequelize.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    res.json({
      clients: {
        online: onlineClients.length,
        total: allClients.length,
        avgRamMb: avgClientRam,
        list: onlineClients.map(c => ({
          device_id: c.device_id,
          username: c.username,
          workspace: c['workspace.name'] || 'N/A',
          ram_mb: c.ram_usage_mb,
          cpu: c.cpu_usage_percent,
          version: c.app_version,
          os: c.os_info
        }))
      },
      server: {
        memoryMb: Math.round(mem.heapUsed / 1024 / 1024),
        uptimeHours: Math.round(process.uptime() / 3600 * 10) / 10,
        dbLatencyMs: dbLatency
      },
      production: {
        todayRecords,
        todayActiveRecipes: todayRecipes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OEE / Scrap / Downtime trends (simulated from quality data)
router.get('/monitoring/oee', authenticate, authorize('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get daily record counts and quality metrics
    const dailyRecords = await DataRecord.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'total']
      ],
      where: { created_at: { [Op.gte]: since } },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    // Get elements with limits for quality calculation
    const elementsWithLimits = await RecipeElement.findAll({
      where: { [Op.or]: [{ min_value: { [Op.ne]: null } }, { max_value: { [Op.ne]: null } }] },
      raw: true
    });
    const elementIds = elementsWithLimits.map(e => e.id);

    // Daily quality rate
    const dailyData = [];
    for (const day of dailyRecords) {
      let inRange = 0, totalValues = 0;

      if (elementIds.length > 0) {
        const dayValues = await RecordValue.findAll({
          where: { element_id: { [Op.in]: elementIds } },
          include: [{
            model: DataRecord,
            attributes: [],
            where: sequelize.where(fn('DATE', col('DataRecord.created_at')), day.date)
          }],
          raw: true
        });

        for (const v of dayValues) {
          const num = parseFloat(v.value);
          if (isNaN(num)) continue;
          totalValues++;
          const elem = elementsWithLimits.find(e => e.id === v.element_id);
          if (!elem) continue;
          const min = elem.min_value !== null ? parseFloat(elem.min_value) : -Infinity;
          const max = elem.max_value !== null ? parseFloat(elem.max_value) : Infinity;
          if (num >= min && num <= max) inRange++;
        }
      }

      const qualityRate = totalValues > 0 ? Math.round((inRange / totalValues) * 100) : 100;

      dailyData.push({
        date: day.date,
        totalRecords: parseInt(day.total),
        qualityRate,
        scrapRate: 100 - qualityRate
      });
    }

    res.json({ daily: dailyData, period: days });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
