// Script à usage unique : importe sql/schema.sql sur une base MySQL distante (ex. Aiven).
// Utilise mysql2 (déjà présent dans node_modules), qui gère nativement l'authentification
// moderne (caching_sha2_password), contrairement à l'ancien client mysql.exe de XAMPP.
//
// Utilisation :
//   1. Renseignez les 6 constantes ci-dessous avec vos informations Aiven.
//   2. Lancez : node scripts/import-schema.js

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_HOST = 'mysql-1ce43dc8-pixabaie.k.aivencloud.com';
const DB_PORT = 19346;
const DB_USER = 'avnadmin';
const DB_PASSWORD = 'COLLEZ_VOTRE_MOT_DE_PASSE_AIVEN_ICI';
const DB_NAME = 'defaultdb';
const CA_CERT_PATH = path.join(__dirname, '../certs/aiven-ca.pem');

async function main() {
  console.log('Connexion à', DB_HOST, '...');

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: { ca: fs.readFileSync(CA_CERT_PATH) },
    multipleStatements: true // nécessaire pour exécuter tout le fichier .sql d'un coup
  });

  console.log('Connecté ! Lecture de sql/schema.sql...');
  const schemaPath = path.join(__dirname, '../sql/schema.sql');
  let sql = fs.readFileSync(schemaPath, 'utf8');

  // Aiven crée déjà la base "defaultdb" : on retire les lignes CREATE/USE DATABASE
  // qui référencent "pixabaie" pour ne pas essayer de créer une base en plus.
  sql = sql
    .split('\n')
    .filter(line => !/^CREATE DATABASE/i.test(line.trim()) && !/^USE pixabaie/i.test(line.trim()))
    .join('\n');

  console.log('Exécution du schéma...');
  await connection.query(sql);

  console.log('✅ Schéma importé avec succès dans la base', DB_NAME);
  await connection.end();
}

main().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
