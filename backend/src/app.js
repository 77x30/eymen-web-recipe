require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Import routes
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const elementRoutes = require('./routes/elements');
const recordRoutes = require('./routes/records');
const adminRoutes = require('./routes/admin');
const workspaceRoutes = require('./routes/workspaces');
const telemetryRoutes = require('./routes/telemetry');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/elements', elementRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/system', telemetryRoutes);

// Health check with uptime
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

async function cleanupMockRecipes() {
  const { Recipe, RecipeElement, DataRecord, RecordValue } = require('./models');

  const mockNamePatterns = [
    '%Rulo Açıcı%',
    '%Rulo Acici%',
    '%Coil Opener%',
    '%Pres Makinesi%',
    '%Pres Makinası%',
    '%Press Machine%',
    '%CNC Tezgahı%',
    '%CNC Tezgahi%',
    '%CNC Machine%',
    '%Boya Karıştırma%',
    '%Boya Karistirma%',
    '%Boya Makinesi%',
    '%Boya Makineleri%',
    '%Paint Mixing%',
    '%RGB Colors%'
  ];
  const mockDescriptionPatterns = [
    '%Coil opening machine parameters%',
    '%Hydraulic press machine parameters%',
    '%CNC machining center parameters%',
    '%Paint mixing parameters%'
  ];

  const mockRecipes = await Recipe.findAll({
    attributes: ['id', 'name'],
    where: {
      [Op.or]: [
        ...mockNamePatterns.map(pattern => ({
          name: { [Op.like]: pattern }
        })),
        ...mockDescriptionPatterns.map(pattern => ({
          description: { [Op.like]: pattern }
        }))
      ]
    }
  });

  if (mockRecipes.length === 0) {
    return;
  }

  const recipeIds = mockRecipes.map(recipe => recipe.id);
  const elementIds = (await RecipeElement.findAll({
    attributes: ['id'],
    where: { recipe_id: { [Op.in]: recipeIds } }
  })).map(element => element.id);
  const recordIds = (await DataRecord.findAll({
    attributes: ['id'],
    where: { recipe_id: { [Op.in]: recipeIds } }
  })).map(record => record.id);

  const recordValueFilters = [];
  if (recordIds.length > 0) {
    recordValueFilters.push({ data_record_id: { [Op.in]: recordIds } });
  }
  if (elementIds.length > 0) {
    recordValueFilters.push({ element_id: { [Op.in]: elementIds } });
  }
  if (recordValueFilters.length > 0) {
    await RecordValue.destroy({ where: { [Op.or]: recordValueFilters } });
  }

  await DataRecord.destroy({ where: { recipe_id: { [Op.in]: recipeIds } } });
  await RecipeElement.destroy({ where: { recipe_id: { [Op.in]: recipeIds } } });
  await Recipe.destroy({ where: { id: { [Op.in]: recipeIds } } });

  console.log(`Removed ${mockRecipes.length} mock recipes from database`);
}

// Auto seed function - creates only admin users, no mock recipes
async function seedDatabase() {
  const { User } = require('./models');
  
  // Check if already seeded
  const userCount = await User.count();
  if (userCount > 0) {
    console.log('Database already seeded');
    return;
  }
  
  console.log('Seeding database...');
  
  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  await User.create({
    username: 'admin',
    password_hash: adminHash,
    role: 'admin'
  });
  
  console.log('Database seeded successfully!');
  console.log('Admin user: admin / admin123');
}

// Database sync and server start
// Skip sync to avoid index duplication issues - tables should already exist
sequelize.authenticate()
  .then(async () => {
    console.log('Database connection established');
    await cleanupMockRecipes();
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to database:', err);
  });

module.exports = app;
