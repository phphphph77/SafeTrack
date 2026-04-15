const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hse_portal',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-03:00',
});

pool.getConnection()
  .then((conn) => {
    console.log('[DB] Conexão com MySQL estabelecida com sucesso.');
    conn.release();
  })
  .catch((err) => {
    console.error('[DB] Falha ao conectar ao MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;