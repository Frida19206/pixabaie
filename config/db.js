const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// Connexion chiffrée (SSL) requise par les hébergeurs MySQL en ligne comme Aiven.
// En local (XAMPP/WAMP), laissez DB_SSL_CA_PATH vide dans .env : la connexion reste en clair.
const sslConfig = process.env.DB_SSL_CA_PATH
  ? { ca: fs.readFileSync(process.env.DB_SSL_CA_PATH) }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pixabaie',
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
