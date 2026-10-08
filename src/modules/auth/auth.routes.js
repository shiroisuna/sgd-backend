const express = require('express');
const router = express.Router();
const { login, forgotPassword, changePassword } = require('./auth.controller');

router.post('/login', login);
router.post('/forgot-password', forgotPassword); // <--- Nueva ruta
router.post('/change-password', changePassword);

module.exports = router;