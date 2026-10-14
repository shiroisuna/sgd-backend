const bcrypt = require('bcrypt');
const UsersModel = require('./users.model');
const EmailService = require('../../services/email.service'); // Ajusta la ruta a donde guardaste el servicio de correo

class UsersController {
  // Obtener la lista de departamentos para el select
  static async getDepartments(req, res) {
    try {
      const departments = await UsersModel.getAllDepartments();
      res.json(departments);
    } catch (err) {
      console.error('Error al obtener departamentos:', err);
      res.status(500).json({ error: 'Error al obtener departamentos' });
    }
  }

  // Registrar un nuevo usuario y enviar correo con credenciales
  static async createUser(req, res) {
    try {
      const { username, email, password, departamentoId, departamentosAdicionales } = req.body;

      if (!username || !email || !password || !departamentoId) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      // Encriptar la contraseña antes de guardarla en la base de datos
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Guardar el usuario usando el modelo
      const userId = await UsersModel.create(username, email, hashedPassword, departamentoId);

      // Departamentos adicionales (ej. AL + PT)
      if (Array.isArray(departamentosAdicionales)) {
        await UsersModel.setAdditionalDepartments(userId, departamentosAdicionales, departamentoId);
      }

      // Intentar enviar el correo electrónico con las credenciales en texto plano
      try {
        await EmailService.sendCredentials(email, username, password);
      } catch (emailErr) {
        console.error('El usuario se creó correctamente, pero falló el envío del correo:', emailErr);
        // Opcional: Puedes decidir si quieres retornar un aviso sin detener el éxito de la creación
      }

      res.status(201).json({ 
        message: 'Usuario registrado exitosamente y credenciales enviadas por correo', 
        userId 
      });

    } catch (err) {
      console.error('Error al registrar usuario:', err);
      // Validar si es un error de duplicado (ej. usuario o correo ya existen en la BD)
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'El nombre de usuario o el correo electrónico ya se encuentran registrados.' });
      }
      res.status(500).json({ error: 'Error interno al registrar el usuario' });
    }
  }


  static async getUsers(req, res) {
    try {
      const users = await UsersModel.getAll();
      res.json(users);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  }


  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, password, activo, departamentoId, departamentosAdicionales } = req.body;
      
      let hashedPassword = null;
      if (password && password.trim() !== '') {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const affectedRows = await UsersModel.update(id, username, email, hashedPassword, activo, departamentoId);
      if (affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (Array.isArray(departamentosAdicionales)) {
        await UsersModel.setAdditionalDepartments(id, departamentosAdicionales, departamentoId);
      }

      res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }


  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const affectedRows = await UsersModel.delete(id);
      if (affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
}

module.exports = UsersController;