const express = require('express');
const router = express.Router();
const { getDepartments } = require('./departments.controller');

// Endpoint para listar todos los departamentos
router.get('/', getDepartments);

module.exports = router;