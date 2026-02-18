const { Sequelize } = require('sequelize');
require('dotenv').config();

// Debug: Log all MySQL-related env vars
console.log('Environment Variables Check:');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('MYSQLPORT:', process.env.MYSQLPORT);
console.log('MYSQL_URL:', process.env.MYSQL_URL);

// Support both DB_ and MYSQL_ prefixed env vars (Railway uses MYSQL_)
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost';
const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'recipe_management';
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '';

console.log('Using DB Config:', { host: dbHost, port: dbPort, database: dbName, user: dbUser });

const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || `mysql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

const sequelize = new Sequelize(connectionUrl, {
  dialect: 'mysql',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
