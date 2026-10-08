const { getConnection, sql } = require('../../config/db');

class UsersModel {

  static async create(username, email, hashedPassword, departamentoId, nombreCompleto = '') {
    const pool = await getConnection();
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('NombreCompleto', sql.VarChar, nombreCompleto)
      .input('email', sql.VarChar, email)
      .input('PasswordHash', sql.VarChar(100), hashedPassword)
      .input('departamentoId', sql.Int, departamentoId)
      .query(`
        INSERT INTO usuarios (Username, NombreCompleto, email, PasswordHash, IdDepartamento, Activo) 
        OUTPUT INSERTED.IdUsuario AS insertId
        VALUES (@username, @NombreCompleto, @email, @PasswordHash, @departamentoId, 1)
      `);
    return result.recordset[0].insertId;
  }

  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT u.IdUsuario, u.Username, u.NOMBRECOMPLETO, u.email, u.IdDepartamento, d.nombre AS departamentoNombre 
      FROM usuarios u
      LEFT JOIN Departamentos d ON u.IdDepartamento = d.IdDepartamento
    `);
    return result.recordset;
  }

  static async update(id, username, email, hashedPassword, activo) {
    const pool = await getConnection();
    const request = pool.request()
      .input('id', sql.Int, id)
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .input('activo', sql.Bit, activo);

    let passwordQuery = '';
    if (hashedPassword) {
      request.input('password', sql.VarChar, hashedPassword);
      passwordQuery = ', PasswordHash = @password';
    }

    const result = await request.query(`
      UPDATE Usuarios 
      SET username = @username, email = @email, activo = @activo ${passwordQuery}
      WHERE IdUsuario = @id
    `);
    return result.rowsAffected[0];
  }

  static async delete(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM usuarios WHERE IdUsuario = @id');
    return result.rowsAffected[0];
  }

  static async getAllDepartments() {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT IdDepartamento, Codigo, Nombre FROM Departamentos');
    return result.recordset;
  }
}

module.exports = UsersModel;