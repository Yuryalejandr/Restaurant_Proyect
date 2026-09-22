const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authController');
const { autenticar } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', autenticar, authController.getProfile);
router.put('/profile', autenticar, authController.updateProfile);

module.exports = router;