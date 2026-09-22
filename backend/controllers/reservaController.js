const db = require('../config/db');

// Capacidad por cada turno (misma fecha y hora).
const TOTAL_MESAS = 10;
const CUPO_MAXIMO = 48;

const obtenerMesasActivas = (callback) => {
  db.get("SELECT valor FROM configuracion_restaurante WHERE clave = 'mesas_activas'", (err, fila) => {
    if (err) return callback(err);
    callback(null, Number(fila?.valor || TOTAL_MESAS));
  });
};

const calcularDisponibilidad = (fecha, hora, personas, excluirId, callback) => {
  let query = `
    SELECT COUNT(*) AS mesasOcupadas, COALESCE(SUM(personas), 0) AS cupoOcupado
    FROM reservas
    WHERE fecha = ? AND hora = ? AND estado != 'cancelada'
  `;
  const params = [fecha, hora];

  if (excluirId) {
    query += ' AND id != ?';
    params.push(excluirId);
  }

  db.get(query, params, (err, row) => {
    if (err) return callback(err);

    obtenerMesasActivas((configError, totalMesas) => {
      if (configError) return callback(configError);
      const mesasOcupadas = Number(row.mesasOcupadas || 0);
      const cupoOcupado = Number(row.cupoOcupado || 0);
      const cantidad = Number(personas || 0);
      const mesasDisponibles = Math.max(0, totalMesas - mesasOcupadas);
      const cupoDisponible = Math.max(0, CUPO_MAXIMO - cupoOcupado);

      callback(null, {
        totalMesas,
        mesasOcupadas,
        mesasDisponibles,
        cupoMaximo: CUPO_MAXIMO,
        cupoOcupado,
        cupoDisponible,
        disponible: mesasDisponibles > 0 && cupoDisponible >= cantidad,
      });
    });
  });
};

const guardarReserva = (reserva, callback) => {
  const personas = Number(reserva.personas);
  if (!reserva.id || !reserva.usuario_id || !reserva.fecha || !reserva.hora || !Number.isInteger(personas) || personas < 1) {
    return callback({ status: 400, mensaje: 'La reserva tiene datos incompletos.' });
  }

  const insertar = () => {
    db.run(
      `INSERT OR REPLACE INTO reservas
        (id, usuario_id, fecha, hora, personas, estado, sincronizado, plato, nota)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        reserva.id,
        reserva.usuario_id,
        reserva.fecha,
        reserva.hora,
        personas,
        reserva.estado || 'pendiente',
        reserva.plato || '',
        reserva.nota || '',
      ],
      (err) => callback(err, { creado: !err })
    );
  };

  // Una cancelación libera cupo y siempre puede sincronizarse.
  if (reserva.estado === 'cancelada') return insertar();

  calcularDisponibilidad(reserva.fecha, reserva.hora, personas, reserva.id, (err, disponibilidad) => {
    if (err) return callback(err);
    if (!disponibilidad.disponible) {
      return callback({
        status: 409,
        mensaje: 'No hay mesa o cupo disponible para este horario.',
        disponibilidad,
      });
    }
    insertar();
  });
};

// Obtener reservas de un usuario o todas si es administrador.
exports.getReservas = (req, res) => {
  const { usuario_id, rol } = req.query;
  let query = 'SELECT * FROM reservas';
  const params = [];

  if (rol !== 'admin') {
    query += ' WHERE usuario_id = ?';
    params.push(usuario_id);
  }
  query += ' ORDER BY fecha ASC, hora ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ mensaje: err.message });
    res.json(rows);
  });
};

exports.getDisponibilidad = (req, res) => {
  const { fecha, hora, personas = 1, excluir_id } = req.query;
  const cantidad = Number(personas);

  if (!fecha || !hora || !Number.isInteger(cantidad) || cantidad < 1) {
    return res.status(400).json({ mensaje: 'Fecha, hora y número de personas son obligatorios.' });
  }

  calcularDisponibilidad(fecha, hora, cantidad, excluir_id, (err, disponibilidad) => {
    if (err) return res.status(500).json({ mensaje: err.message });
    res.json(disponibilidad);
  });
};

exports.getResumenAdmin = (req, res) => {
  const consultas = {
    reservas: `SELECT reservas.*, usuarios.nombre AS usuario_nombre, usuarios.email AS usuario_email
      FROM reservas LEFT JOIN usuarios ON usuarios.id = reservas.usuario_id
      ORDER BY fecha ASC, hora ASC`,
    menu: 'SELECT * FROM menu_items ORDER BY categoria, nombre',
  };
  db.all(consultas.reservas, [], (reservasError, reservas) => {
    if (reservasError) return res.status(500).json({ mensaje: reservasError.message });
    db.all(consultas.menu, [], (menuError, menu) => {
      if (menuError) return res.status(500).json({ mensaje: menuError.message });
      obtenerMesasActivas((configError, mesasActivas) => {
        if (configError) return res.status(500).json({ mensaje: configError.message });
        const activas = reservas.filter((reserva) => reserva.estado !== 'cancelada');
        res.json({
          reservas,
          menu,
          estadisticas: {
            totalReservas: reservas.length,
            pendientes: reservas.filter((reserva) => reserva.estado === 'pendiente').length,
            confirmadas: reservas.filter((reserva) => reserva.estado === 'confirmada').length,
            mesasOcupadas: activas.length,
            mesasActivas,
            personasActivas: activas.reduce((total, reserva) => total + Number(reserva.personas || 0), 0),
            totalMesas: mesasActivas,
            cupoMaximo: CUPO_MAXIMO,
          },
        });
      });
    });
  });
};

exports.actualizarMesasActivas = (req, res) => {
  const mesasActivas = Number(req.body.mesasActivas);
  if (!Number.isInteger(mesasActivas) || mesasActivas < 1 || mesasActivas > 100) {
    return res.status(400).json({ mensaje: 'Indica entre 1 y 100 mesas activas.' });
  }
  db.run(
    "INSERT INTO configuracion_restaurante (clave, valor) VALUES ('mesas_activas', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor",
    [mesasActivas],
    function (err) {
    if (err) return res.status(500).json({ mensaje: err.message });
    res.json({ mensaje: 'Mesas activas actualizadas.', mesasActivas });
    }
  );
};

exports.createReserva = (req, res) => {
  guardarReserva(req.body, (err) => {
    if (err) {
      const status = err.status || 500;
      return res.status(status).json({ mensaje: err.mensaje || err.message, disponibilidad: err.disponibilidad });
    }
    res.status(201).json({ mensaje: 'Reserva guardada correctamente.' });
  });
};

// Compatibilidad con clientes anteriores que aún envían un arreglo de reservas.
exports.syncReservas = (req, res) => {
  const { reservas } = req.body;
  if (!Array.isArray(reservas) || reservas.length === 0) {
    return res.status(400).json({ mensaje: 'No hay reservas para sincronizar.' });
  }

  let index = 0;
  const siguiente = () => {
    if (index >= reservas.length) return res.json({ mensaje: 'Sincronización exitosa.' });
    guardarReserva(reservas[index], (err) => {
      if (err) {
        const status = err.status || 500;
        return res.status(status).json({ mensaje: err.mensaje || err.message, disponibilidad: err.disponibilidad });
      }
      index += 1;
      siguiente();
    });
  };
  siguiente();
};

// Actualizar estado de una reserva desde la consola de administración.
exports.updateEstado = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'confirmada', 'cancelada'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ mensaje: 'Estado de reserva no válido.' });
  }

  db.run('UPDATE reservas SET estado = ? WHERE id = ?', [estado, id], function (err) {
    if (err) return res.status(500).json({ mensaje: err.message });
    if (this.changes === 0) return res.status(404).json({ mensaje: 'Reserva no encontrada.' });
    res.json({ mensaje: `Reserva actualizada a ${estado}` });
  });
};
