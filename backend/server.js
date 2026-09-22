require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const menuRoutes = require('./routes/menuRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/menu', menuRoutes);


app.get('/', (req, res) => {
  res.json({ mensaje: 'API del Restaurante funcionando correctamente' });
});



app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor API corriendo en http://0.0.0.0:${PORT}`);
});
