const bcrypt = require('bcrypt');
const AuthModel = require('./auth.model');
const EmailService = require('../../services/email.service');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Debe ingresar el usuario y la contraseña' });
      }

      const user = await AuthModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }

      res.json({
        message: '¡Bienvenido al sistema!',
        usuario: {
          id: user.IdUsuario,
          username: user.Username,
          nombreCompleto: user.NombreCompleto,
          departamentoId: user.IdDepartamento,
          departamentoNombre: user.departamentoNombre, // <--- ¡Agregado aquí!
          codigoDepartamento: user.codigoDepartamento,   // <--- (Opcional si también lo quieres)
          esAdmin: user.esAdmin,
          debeCambiarPassword: user.DebeCambiarPassword
        }
      });

    } catch (err) {
      console.error('Error en el inicio de sesión:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }


  // Nuevo endpoint para cambio obligatorio de clave
  static async changePassword(req, res) {
    try {
      const { idUsuario, newPassword } = req.body;

      if (!idUsuario || !newPassword) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await AuthModel.updatePasswordAndClearFlag(idUsuario, hashedPassword);

      res.json({ message: 'Contraseña actualizada correctamente. Ya puede acceder al sistema.' });

    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Debe ingresar un correo electrónico' });
      }

      const user = await AuthModel.findByEmail(email);
      if (!user) {
        // Por seguridad, a veces se responde éxito genérico, pero puedes retornar error si prefieres
        return res.status(404).json({ error: 'No se encontró un usuario activo con este correo electrónico' });
      }

      // Generar una contraseña temporal aleatoria (ej. 8 caracteres)
      const tempPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Actualizar en la base de datos
      await AuthModel.updatePassword(user.IdUsuario, hashedPassword);

      // Enviar el correo con la nueva contraseña temporal
      await EmailService.sendCredentials(user.email, user.Username, tempPassword);

      res.json({ message: 'Se ha enviado una nueva contraseña temporal a su correo electrónico.' });

    } catch (err) {
      console.error('Error en recuperación de contraseña:', err);
      res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud' });
    }
  }
}

module.exports = AuthController;