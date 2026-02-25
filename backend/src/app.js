require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

// Import routes
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const elementRoutes = require('./routes/elements');
const recordRoutes = require('./routes/records');
const adminRoutes = require('./routes/admin');
const workspaceRoutes = require('./routes/workspaces');

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
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to database:', err);
  });

module.exports = app;
