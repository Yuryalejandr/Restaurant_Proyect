const express = require('express');
const controller = require('../controllers/menuController');
const { autenticar, soloAdmin } = require('../middleware/auth');

const router = express.Router();
router.get('/', controller.listar);
router.post('/', autenticar, soloAdmin, controller.crear);
router.put('/:id', autenticar, soloAdmin, controller.actualizar);
router.delete('/:id', autenticar, soloAdmin, controller.eliminar);

module.exports = router;