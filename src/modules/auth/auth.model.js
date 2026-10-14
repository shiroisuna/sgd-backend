const { getConnection, sql } = require('../../config/db');

class AuthModel {

    static async findByUsername(username) {
        const pool = await getConnection();
        const query = `
            SELECT 
                u.IdUsuario AS IdUsuario,
                u.Username AS Username,
                u.PasswordHash AS PasswordHash, -- <-- Asegúrate de incluir esto
                u.NombreCompleto AS NombreCompleto,
                u.DebeCambiarPassword AS DebeCambiarPassword,
                u.IdDepartamento AS IdDepartamento,
                d.Nombre AS departamentoNombre,
                d.Codigo AS codigoDepartamento
            FROM Usuarios u
            LEFT JOIN Departamentos d ON u.IdDepartamento = d.IdDepartamento
            WHERE u.Username = @Username AND u.Activo = 1
        `;

        const result = await pool.request()
            .input('Username', sql.VarChar, username)
            .query(query);

        const user = result.recordset[0];

        if (user) {
            user.esAdmin = (user.Username.toLowerCase() === 'admin');
        }

        return user;
        
    }

    // Departamentos que maneja el usuario: el principal + los adicionales
    static async getUserDepartments(idUsuario, idPrincipal) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdUsuario', sql.Int, idUsuario)
            .input('IdPrincipal', sql.Int, idPrincipal)
            .query(`
                SELECT d.IdDepartamento AS id, d.Codigo AS codigo, d.Nombre AS nombre
                FROM Departamentos d
                WHERE d.IdDepartamento = @IdPrincipal
                   OR d.IdDepartamento IN (SELECT IdDepartamento FROM UsuarioDepartamentos WHERE IdUsuario = @IdUsuario)
                ORDER BY CASE WHEN d.IdDepartamento = @IdPrincipal THEN 0 ELSE 1 END, d.Nombre
            `);
        return result.recordset;
    }

    // Nuevo método para cambiar contraseña y desmarcar el primer ingreso
    static async updatePasswordAndClearFlag(idUsuario, hashedPassword) {
        const pool = await getConnection();
        await pool.request()
        .input('IdUsuario', sql.Int, idUsuario)
        .input('PasswordHash', sql.VarChar(100), hashedPassword)
        .query(`
            UPDATE Usuarios 
            SET PasswordHash = @PasswordHash, DebeCambiarPassword = 0 
            WHERE IdUsuario = @IdUsuario
        `);
    }

    // Buscar usuario por correo electrónico para el restablecimiento
    static async findByEmail(email) {
        const pool = await getConnection();
        const result = await pool.request()
        .input('Email', sql.VarChar, email)
        .query('SELECT IdUsuario, Username, email FROM Usuarios WHERE email = @Email AND Activo = 1');
        return result.recordset[0];
    }

    // Actualizar contraseña por ID
    static async updatePassword(idUsuario, hashedPassword) {
        const pool = await getConnection();
        await pool.request()
        .input('IdUsuario', sql.Int, idUsuario)
        .input('PasswordHash', sql.VarChar(100), hashedPassword)
        .query('UPDATE Usuarios SET PasswordHash = @PasswordHash WHERE IdUsuario = @IdUsuario');
    }
}

module.exports = AuthModel;