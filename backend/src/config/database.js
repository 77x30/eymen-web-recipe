const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support both DB_ and MYSQL_ prefixed env vars (Railway uses MYSQL_)
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || '3306';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'recipe_management';
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';

const sequelize = new Sequelize(
  process.env.DATABASE_URL || process.env.MYSQL_URL || `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
  {
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
