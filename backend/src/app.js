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

// Auto seed function
async function seedDatabase() {
  const { User, Recipe, RecipeElement, DataRecord, RecordValue } = require('./models');
  
  // Check if already seeded
  const userCount = await User.count();
  if (userCount > 0) {
    console.log('Database already seeded');
    return;
  }
  
  console.log('Seeding database...');
  
  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    username: 'admin',
    password_hash: adminHash,
    role: 'admin'
  });
  
  // Create operator user
  const operatorHash = await bcrypt.hash('operator123', 10);
  await User.create({
    username: 'operator',
    password_hash: operatorHash,
    role: 'operator'
  });
  
  // Recipe 1: Rulo Açıcı (Coil Opener)
  const coilOpener = await Recipe.create({
    name: 'Coil Opener',
    description: 'Rulo açma makinesi parametreleri',
    created_by: admin.id
  });
  
  const coilElements = await RecipeElement.bulkCreate([
    { recipe_id: coilOpener.id, name: 'Line Speed', data_type: 'float', unit: 'm/min', min_value: '0', max_value: '100', default_value: '25', sort_order: 1 },
    { recipe_id: coilOpener.id, name: 'Coil Width', data_type: 'integer', unit: 'mm', min_value: '500', max_value: '2000', default_value: '1000', sort_order: 2 },
    { recipe_id: coilOpener.id, name: 'Thickness', data_type: 'float', unit: 'mm', min_value: '0.3', max_value: '6.0', default_value: '1.5', sort_order: 3 },
    { recipe_id: coilOpener.id, name: 'Tension', data_type: 'integer', unit: 'N', min_value: '100', max_value: '5000', default_value: '1500', sort_order: 4 },
    { recipe_id: coilOpener.id, name: 'Loop Pit Depth', data_type: 'integer', unit: 'mm', min_value: '500', max_value: '3000', default_value: '1500', sort_order: 5 }
  ]);
  
  // Create data records for Coil Opener
  const coilRecord1 = await DataRecord.create({ recipe_id: coilOpener.id, name: 'Steel 1.5mm', record_number: 1, created_by: admin.id });
  await RecordValue.bulkCreate([
    { data_record_id: coilRecord1.id, element_id: coilElements[0].id, value: '30.5' },
    { data_record_id: coilRecord1.id, element_id: coilElements[1].id, value: '1250' },
    { data_record_id: coilRecord1.id, element_id: coilElements[2].id, value: '1.5' },
    { data_record_id: coilRecord1.id, element_id: coilElements[3].id, value: '2000' },
    { data_record_id: coilRecord1.id, element_id: coilElements[4].id, value: '1800' }
  ]);
  
  const coilRecord2 = await DataRecord.create({ recipe_id: coilOpener.id, name: 'Aluminum 0.8mm', record_number: 2, created_by: admin.id });
  await RecordValue.bulkCreate([
    { data_record_id: coilRecord2.id, element_id: coilElements[0].id, value: '45.0' },
    { data_record_id: coilRecord2.id, element_id: coilElements[1].id, value: '1000' },
    { data_record_id: coilRecord2.id, element_id: coilElements[2].id, value: '0.8' },
    { data_record_id: coilRecord2.id, element_id: coilElements[3].id, value: '800' },
    { data_record_id: coilRecord2.id, element_id: coilElements[4].id, value: '1200' }
  ]);
  
  // Recipe 2: Press Machine
  const pressMachine = await Recipe.create({
    name: 'Press Machine',
    description: 'Hydraulic press machine settings',
    created_by: admin.id
  });
  
  const pressElements = await RecipeElement.bulkCreate([
    { recipe_id: pressMachine.id, name: 'Press Force', data_type: 'integer', unit: 'ton', min_value: '10', max_value: '500', default_value: '100', sort_order: 1 },
    { recipe_id: pressMachine.id, name: 'Stroke Length', data_type: 'integer', unit: 'mm', min_value: '50', max_value: '800', default_value: '200', sort_order: 2 },
    { recipe_id: pressMachine.id, name: 'Speed Down', data_type: 'float', unit: 'mm/s', min_value: '1', max_value: '100', default_value: '20', sort_order: 3 },
    { recipe_id: pressMachine.id, name: 'Speed Up', data_type: 'float', unit: 'mm/s', min_value: '1', max_value: '150', default_value: '50', sort_order: 4 },
    { recipe_id: pressMachine.id, name: 'Dwell Time', data_type: 'float', unit: 'sec', min_value: '0', max_value: '30', default_value: '2', sort_order: 5 },
    { recipe_id: pressMachine.id, name: 'Cushion Pressure', data_type: 'integer', unit: 'bar', min_value: '0', max_value: '350', default_value: '150', sort_order: 6 }
  ]);
  
  const pressRecord1 = await DataRecord.create({ recipe_id: pressMachine.id, name: 'Deep Draw Part A', record_number: 1, created_by: admin.id });
  await RecordValue.bulkCreate([
    { data_record_id: pressRecord1.id, element_id: pressElements[0].id, value: '250' },
    { data_record_id: pressRecord1.id, element_id: pressElements[1].id, value: '350' },
    { data_record_id: pressRecord1.id, element_id: pressElements[2].id, value: '15.5' },
    { data_record_id: pressRecord1.id, element_id: pressElements[3].id, value: '80' },
    { data_record_id: pressRecord1.id, element_id: pressElements[4].id, value: '3.5' },
    { data_record_id: pressRecord1.id, element_id: pressElements[5].id, value: '200' }
  ]);
  
  // Recipe 3: CNC Machine
  const cncMachine = await Recipe.create({
    name: 'CNC Milling',
    description: 'CNC milling machine parameters',
    created_by: admin.id
  });
  
  const cncElements = await RecipeElement.bulkCreate([
    { recipe_id: cncMachine.id, name: 'Spindle Speed', data_type: 'integer', unit: 'RPM', min_value: '100', max_value: '24000', default_value: '8000', sort_order: 1 },
    { recipe_id: cncMachine.id, name: 'Feed Rate', data_type: 'integer', unit: 'mm/min', min_value: '10', max_value: '15000', default_value: '2000', sort_order: 2 },
    { recipe_id: cncMachine.id, name: 'Depth of Cut', data_type: 'float', unit: 'mm', min_value: '0.1', max_value: '10', default_value: '2', sort_order: 3 },
    { recipe_id: cncMachine.id, name: 'Tool Diameter', data_type: 'float', unit: 'mm', min_value: '1', max_value: '50', default_value: '10', sort_order: 4 },
    { recipe_id: cncMachine.id, name: 'Coolant Flow', data_type: 'float', unit: 'L/min', min_value: '0', max_value: '50', default_value: '15', sort_order: 5 }
  ]);
  
  const cncRecord1 = await DataRecord.create({ recipe_id: cncMachine.id, name: 'Aluminum Roughing', record_number: 1, created_by: admin.id });
  await RecordValue.bulkCreate([
    { data_record_id: cncRecord1.id, element_id: cncElements[0].id, value: '12000' },
    { data_record_id: cncRecord1.id, element_id: cncElements[1].id, value: '3500' },
    { data_record_id: cncRecord1.id, element_id: cncElements[2].id, value: '3.5' },
    { data_record_id: cncRecord1.id, element_id: cncElements[3].id, value: '16' },
    { data_record_id: cncRecord1.id, element_id: cncElements[4].id, value: '20' }
  ]);
  
  // Recipe 4: Paint Mixing
  const paintMixing = await Recipe.create({
    name: 'Paint Mixing',
    description: 'RGB paint color mixing parameters',
    created_by: admin.id
  });
  
  const paintElements = await RecipeElement.bulkCreate([
    { recipe_id: paintMixing.id, name: 'Red', data_type: 'integer', unit: '%', min_value: '0', max_value: '100', default_value: '0', sort_order: 1 },
    { recipe_id: paintMixing.id, name: 'Green', data_type: 'integer', unit: '%', min_value: '0', max_value: '100', default_value: '0', sort_order: 2 },
    { recipe_id: paintMixing.id, name: 'Blue', data_type: 'integer', unit: '%', min_value: '0', max_value: '100', default_value: '0', sort_order: 3 },
    { recipe_id: paintMixing.id, name: 'Mix Time', data_type: 'integer', unit: 'sec', min_value: '10', max_value: '300', default_value: '60', sort_order: 4 },
    { recipe_id: paintMixing.id, name: 'Temperature', data_type: 'float', unit: '°C', min_value: '15', max_value: '40', default_value: '25', sort_order: 5 }
  ]);
  
  const paintRecord1 = await DataRecord.create({ recipe_id: paintMixing.id, name: 'Ocean Blue', record_number: 1, created_by: admin.id });
  await RecordValue.bulkCreate([
    { data_record_id: paintRecord1.id, element_id: paintElements[0].id, value: '0' },
    { data_record_id: paintRecord1.id, element_id: paintElements[1].id, value: '45' },
    { data_record_id: paintRecord1.id, element_id: paintElements[2].id, value: '90' },
    { data_record_id: paintRecord1.id, element_id: paintElements[3].id, value: '120' },
    { data_record_id: paintRecord1.id, element_id: paintElements[4].id, value: '22.5' }
  ]);
  
  const paintRecord2 = await DataRecord.create({ recipe_id: paintMixing.id, name: 'Sunset Orange', record_number: 2, created_by: admin.id });
  await RecordValue.bulkCreate([
    { data_record_id: paintRecord2.id, element_id: paintElements[0].id, value: '95' },
    { data_record_id: paintRecord2.id, element_id: paintElements[1].id, value: '45' },
    { data_record_id: paintRecord2.id, element_id: paintElements[2].id, value: '5' },
    { data_record_id: paintRecord2.id, element_id: paintElements[3].id, value: '90' },
    { data_record_id: paintRecord2.id, element_id: paintElements[4].id, value: '25' }
  ]);
  
  console.log('Database seeded successfully!');
  console.log('Admin user: admin / admin123');
  console.log('Operator user: operator / operator123');
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
