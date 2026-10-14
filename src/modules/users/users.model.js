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
      SELECT u.IdUsuario, u.Username, u.NOMBRECOMPLETO, u.email, u.Activo, u.IdDepartamento, d.nombre AS departamentoNombre 
      FROM usuarios u
      LEFT JOIN Departamentos d ON u.IdDepartamento = d.IdDepartamento
    `);

    // Departamentos adicionales de cada usuario
    const extras = await pool.request().query(`
      SELECT ud.IdUsuario, ud.IdDepartamento, d.Codigo, d.Nombre
      FROM UsuarioDepartamentos ud
      INNER JOIN Departamentos d ON ud.IdDepartamento = d.IdDepartamento
    `);

    return result.recordset.map(u => {
      const propios = extras.recordset.filter(e => e.IdUsuario === u.IdUsuario);
      return {
        ...u,
        departamentosAdicionales: propios.map(e => e.IdDepartamento),
        departamentosAdicionalesNombres: propios.map(e => e.Nombre)
      };
    });
  }

  // Reemplaza los departamentos adicionales de un usuario (sin incluir el principal)
  static async setAdditionalDepartments(idUsuario, departamentos = [], idPrincipal = null) {
    const ids = [...new Set((departamentos || []).map(Number))]
      .filter(id => Number.isInteger(id) && id > 0 && id !== Number(idPrincipal));

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction)
        .input('IdUsuario', sql.Int, idUsuario)
        .query('DELETE FROM UsuarioDepartamentos WHERE IdUsuario = @IdUsuario');

      for (const idDepto of ids) {
        await new sql.Request(transaction)
          .input('IdUsuario', sql.Int, idUsuario)
          .input('IdDepartamento', sql.Int, idDepto)
          .query('INSERT INTO UsuarioDepartamentos (IdUsuario, IdDepartamento) VALUES (@IdUsuario, @IdDepartamento)');
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async update(id, username, email, hashedPassword, activo, departamentoId = null) {
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

    // Departamento principal (opcional)
    let deptoQuery = '';
    if (departamentoId) {
      request.input('departamentoId', sql.Int, parseInt(departamentoId));
      deptoQuery = ', IdDepartamento = @departamentoId';
    }

    const result = await request.query(`
      UPDATE Usuarios 
      SET username = @username, email = @email, activo = @activo ${passwordQuery} ${deptoQuery}
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