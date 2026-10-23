const { getConnection, sql } = require('../../config/db');

class NotificationsModel {
    // Indicadores configurados para el año que NO tienen carga en el mes indicado
    static async getIndicadoresPendientes(anio, mes) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('Anio', sql.Int, anio)
            .input('Mes', sql.Int, mes)
            .query(`
                SELECT I.IdDepartamento, D.Codigo AS CodigoDepartamento, D.Nombre AS NombreDepartamento,
                       I.IdIndicador, I.NombreIndicador
                FROM IndicadoresConfig I
                INNER JOIN Departamentos D ON I.IdDepartamento = D.IdDepartamento
                WHERE I.Anio = @Anio
                  AND NOT EXISTS (
                      SELECT 1 FROM IndicadoresCargaMensual C
                      WHERE C.IdIndicador = I.IdIndicador AND C.Anio = @Anio AND C.Mes = @Mes
                  )
                ORDER BY D.Codigo, I.NombreIndicador
            `);
        return result.recordset;
    }

    // Departamentos que tienen indicadores configurados en el año
    static async getDepartamentosConIndicadores(anio) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('Anio', sql.Int, anio)
            .query('SELECT DISTINCT IdDepartamento FROM IndicadoresConfig WHERE Anio = @Anio');
        return result.recordset.map(r => r.IdDepartamento);
    }

    static async getDepartamentos() {
        const pool = await getConnection();
        const result = await pool.request()
            .query('SELECT IdDepartamento, Codigo, Nombre FROM Departamentos');
        return result.recordset;
    }

    // Usuarios activos (sin el admin) con su departamento principal y los adicionales
    static async getUsuariosActivos() {
        const pool = await getConnection();
        const usuarios = await pool.request().query(`
            SELECT IdUsuario, Username, NombreCompleto, email, IdDepartamento
            FROM Usuarios
            WHERE Activo = 1 AND LOWER(Username) <> 'admin'
        `);
        const extras = await pool.request().query('SELECT IdUsuario, IdDepartamento FROM UsuarioDepartamentos');

        return usuarios.recordset.map(u => ({
            ...u,
            departamentos: [
                u.IdDepartamento,
                ...extras.recordset.filter(e => e.IdUsuario === u.IdUsuario).map(e => e.IdDepartamento)
            ].filter(Boolean)
        }));
    }

    static async getUsuario(idUsuario) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdUsuario', sql.Int, parseInt(idUsuario))
            .query('SELECT IdUsuario, Username, IdDepartamento FROM Usuarios WHERE IdUsuario = @IdUsuario');
        const usuario = result.recordset[0];
        if (!usuario) return null;

        const extras = await pool.request()
            .input('IdUsuario', sql.Int, usuario.IdUsuario)
            .query('SELECT IdDepartamento FROM UsuarioDepartamentos WHERE IdUsuario = @IdUsuario');
        usuario.departamentos = [usuario.IdDepartamento, ...extras.recordset.map(e => e.IdDepartamento)].filter(Boolean);
        usuario.esAdmin = (usuario.Username || '').toLowerCase() === 'admin';
        return usuario;
    }
}

module.exports = NotificationsModel;
