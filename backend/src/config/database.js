const { Sequelize } = require('sequelize');
require('dotenv').config();

// Railway uses MYSQLHOST etc. - prioritize these over DB_ vars
const dbHost = process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
const dbPort = process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || '3306';
const dbName = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'recipe_management';
const dbUser = process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || 'root';
const dbPassword = process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';

console.log('DB Config:', { host: dbHost, port: dbPort, database: dbName, user: dbUser });

const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || `mysql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

const sequelize = new Sequelize(connectionUrl, {
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
