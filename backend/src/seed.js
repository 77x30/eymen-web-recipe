const { User } = require('./models');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');

const seedData = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password_hash: adminPassword,
      role: 'admin'
    });

    console.log('\n✅ Seed completed successfully!');
    console.log('Only admin user was created. No sample recipes were added.');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
