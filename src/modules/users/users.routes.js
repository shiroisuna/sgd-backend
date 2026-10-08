const express = require('express');
const router = express.Router();
const UsersController = require('./users.controller');

// 1. Colocar las rutas específicas PRIMERO
router.get('/departments', UsersController.getDepartments);

// 2. Luego la ruta raíz
router.get('/', UsersController.getUsers);

router.post('/', UsersController.createUser);
router.put('/:id', UsersController.updateUser);
router.delete('/:id', UsersController.deleteUser);

module.exports = router;