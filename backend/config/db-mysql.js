const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'restaurante',
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

const schema = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'cliente',
    foto_uri VARCHAR(500) NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS reservas (
    id VARCHAR(191) PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha VARCHAR(30),
    hora VARCHAR(30),
    personas INT,
    estado VARCHAR(30) DEFAULT 'pendiente',
    sincronizado TINYINT DEFAULT 1,
    plato TEXT,
    nota TEXT,
    INDEX reservas_usuario_idx (usuario_id),
    CONSTRAINT reservas_usuario_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    detalle TEXT NOT NULL,
    precio INT NOT NULL DEFAULT 0,
    imagen TEXT,
    disponible TINYINT NOT NULL DEFAULT 1,
    calificacion DECIMAL(3,1) NOT NULL DEFAULT 4.8,
    porcentaje_estrellas INT NOT NULL DEFAULT 96,
    resenas TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS configuracion_restaurante (
    clave VARCHAR(100) PRIMARY KEY,
    valor INT NOT NULL
  )`,
];

const menuInicial = [
  ['Corte al carbón', 'plato', 'Puré rústico · chimichurri', 48000, 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80'],
  ['Pasta de la casa', 'plato', 'Pomodoro asado · albahaca', 35000, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80'],
  ['Salmón de temporada', 'plato', 'Vegetales al carbón · mantequilla cítrica', 52000, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80'],
  ['Risotto de hongos', 'plato', 'Parmesano · aceite de trufa', 42000, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=900&q=80'],
  ['Pollo de la casa', 'plato', 'Papas doradas · salsa de hierbas', 39000, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=80'],
  ['Vino tinto reserva', 'bebida', 'Copa · Malbec argentino', 18000, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80'],
  ['Vino blanco sauvignon', 'bebida', 'Copa · notas cítricas', 16000, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80'],
  ['Cacao & avellana', 'postre', 'Postre de autor · vainilla', 22000, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80'],
  ['Cheesecake de frutos rojos', 'postre', 'Coulis de frutos rojos · crema fresca', 24000, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80'],
];

const initialize = async () => {
  for (const statement of schema) await promisePool.query(statement);
  await promisePool.query("INSERT INTO configuracion_restaurante (clave, valor) VALUES ('mesas_activas', 10) ON DUPLICATE KEY UPDATE clave = clave");

  const [menuCount] = await promisePool.query('SELECT COUNT(*) AS total FROM menu_items');
  if (Number(menuCount[0].total) === 0) {
    await promisePool.query(
      'INSERT INTO menu_items (nombre, categoria, detalle, precio, imagen, resenas) VALUES ?',
      [menuInicial.map((item) => [...item, '[]'])]
    );
  }

  const [adminRows] = await promisePool.query("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
  if (adminRows.length === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@zeloura.local';
    const password = process.env.ADMIN_PASSWORD || 'Admin1234!';
    await promisePool.query(
      'INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      ["Administrador Z'eloura", email, bcrypt.hashSync(password, 8), 'admin']
    );
  }
  console.log('Conectado a MySQL.');
};

const ready = initialize().catch((error) => {
  console.error('Error al inicializar MySQL:', error.message);
  throw error;
});

const db = {
  run(sql, params, callback) {
    ready.then(() => promisePool.query(sql, params)).then(([result]) => {
      if (callback) callback.call({ lastID: result.insertId, changes: result.affectedRows }, null);
    }).catch((error) => callback?.call({}, error));
  },
  get(sql, params, callback) {
    ready.then(() => promisePool.query(sql, params)).then(([rows]) => callback?.(null, rows[0])).catch((error) => callback?.(error));
  },
  all(sql, params, callback) {
    ready.then(() => promisePool.query(sql, params)).then(([rows]) => callback?.(null, rows)).catch((error) => callback?.(error));
  },
};

module.exports = db;
