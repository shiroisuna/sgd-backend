const { getConnection, sql } = require('../../config/db');

class IndicatorModel {
    // Obtener la lista de indicadores configurados para un departamento y año específico
    static async getByDepartmentAndYear(idDepartamento, anio) {
        const pool = await getConnection();
        const query = `
            SELECT IdIndicador, NombreIndicador, FormulaDescripcion, Anio, Meta 
            FROM IndicadoresConfig 
            WHERE IdDepartamento = @IdDepartamento AND Anio = @Anio
        `;
        const result = await pool.request()
            .input('IdDepartamento', sql.Int, idDepartamento)
            .input('Anio', sql.Int, anio)
            .query(query);
        
        return result.recordset;
    }

    // Registrar un nuevo indicador en la configuración anual
    static async createConfig({ nombre, idDepartamento, formulaDescripcion, anio, meta }) {
        const pool = await getConnection();
        const query = `
            INSERT INTO IndicadoresConfig (NombreIndicador, IdDepartamento, FormulaDescripcion, Anio, Meta)
            VALUES (@NombreIndicador, @IdDepartamento, @FormulaDescripcion, @Anio, @Meta);
            SELECT SCOPE_IDENTITY() AS IdIndicador;
        `;
        const result = await pool.request()
            .input('NombreIndicador', sql.VarChar, nombre)
            .input('IdDepartamento', sql.Int, idDepartamento)
            .input('FormulaDescripcion', sql.VarChar, formulaDescripcion || 'N/A')
            .input('Anio', sql.Int, anio)
            .input('Meta', sql.Decimal(5, 2), meta === '' || meta === undefined || meta === null ? null : Number(meta))
            .query(query);
        
        return result.recordset[0];
    }

    // Actualizar la meta (%) de un indicador
    static async updateMeta(idIndicador, meta) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdIndicador', sql.Int, parseInt(idIndicador))
            .input('Meta', sql.Decimal(5, 2), meta === '' || meta === undefined || meta === null ? null : Number(meta))
            .query('UPDATE IndicadoresConfig SET Meta = @Meta WHERE IdIndicador = @IdIndicador');
        return result.rowsAffected[0];
    }

    // Datos para las gráficas: cargas mensuales entre dos años, de un departamento o de todos
    static async getDashboardData(anioDesde, anioHasta, idDepartamento = null) {
        const pool = await getConnection();
        const request = pool.request()
            .input('Desde', sql.Int, parseInt(anioDesde))
            .input('Hasta', sql.Int, parseInt(anioHasta));

        let deptoCondition = '';
        if (idDepartamento) {
            request.input('IdDepartamento', sql.Int, parseInt(idDepartamento));
            deptoCondition = 'AND I.IdDepartamento = @IdDepartamento';
        }

        const result = await request.query(`
            SELECT I.IdIndicador, I.NombreIndicador, I.Meta, I.IdDepartamento,
                   D.Codigo AS CodigoDepartamento, D.Nombre AS NombreDepartamento,
                   C.Anio, C.Mes, C.Numerador, C.Denominador
            FROM IndicadoresCargaMensual C
            INNER JOIN IndicadoresConfig I ON C.IdIndicador = I.IdIndicador
            LEFT JOIN Departamentos D ON I.IdDepartamento = D.IdDepartamento
            WHERE C.Anio BETWEEN @Desde AND @Hasta
              ${deptoCondition}
            ORDER BY C.Anio, C.Mes
        `);
        return result.recordset;
    }

    // Registrar o actualizar la carga mensual de un indicador
    static async saveMonthlyLoad({ idIndicador, anio, mes, numerador, denominador, observaciones, idUsuario }) {
        const pool = await getConnection();
        const query = `
            IF EXISTS (SELECT 1 FROM IndicadoresCargaMensual WHERE IdIndicador = @IdIndicador AND Anio = @Anio AND Mes = @Mes)
                UPDATE IndicadoresCargaMensual 
                SET Numerador = @Numerador, Denominador = @Denominador, Observaciones = @Observaciones, RegistradoPor = @IdUsuario, FechaRegistro = GETDATE()
                WHERE IdIndicador = @IdIndicador AND Anio = @Anio AND Mes = @Mes;
            ELSE
                INSERT INTO IndicadoresCargaMensual (IdIndicador, Anio, Mes, Numerador, Denominador, Observaciones, RegistradoPor)
                VALUES (@IdIndicador, @Anio, @Mes, @Numerador, @Denominador, @Observaciones, @IdUsuario);
        `;

        await pool.request()
            .input('IdIndicador', sql.Int, idIndicador)
            .input('Anio', sql.Int, anio)
            .input('Mes', sql.Int, mes)
            .input('Numerador', sql.Decimal(18, 2), numerador)
            .input('Denominador', sql.Decimal(18, 2), denominador)
            .input('Observaciones', sql.VarChar, observaciones)
            .input('IdUsuario', sql.Int, idUsuario)
            .query(query);
    }

    // Consultar el historial de cargas mensuales por departamento, año y mes
    static async getRecordsByFilter(idDepartamento, anio, mes) {
        const pool = await getConnection();
        const request = pool.request()
            .input('IdDepartamento', sql.Int, parseInt(idDepartamento))
            .input('Anio', sql.Int, parseInt(anio));

        let mesCondition = "";
        if (mes && mes !== 'TODOS' && mes !== '') {
            request.input('Mes', sql.Int, parseInt(mes));
            mesCondition = "AND C.Mes = @Mes";
        }

        const query = `
            SELECT C.*, I.NombreIndicador, I.FormulaDescripcion, U.Username AS RegistradoPorNombre
            FROM IndicadoresCargaMensual C
            INNER JOIN IndicadoresConfig I ON C.IdIndicador = I.IdIndicador
            LEFT JOIN Usuarios U ON C.RegistradoPor = U.IdUsuario
            WHERE I.IdDepartamento = @IdDepartamento 
              AND C.Anio = @Anio 
              ${mesCondition}
            ORDER BY C.Anio DESC, C.Mes DESC, C.IdCarga DESC
        `;

        const result = await request.query(query);
        return result.recordset;
    }

    // Eliminar una carga mensual (ej. se cargó en el mes equivocado)
    static async deleteLoad(idCarga) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdCarga', sql.Int, parseInt(idCarga))
            .query('DELETE FROM IndicadoresCargaMensual WHERE IdCarga = @IdCarga');
        return result.rowsAffected[0];
    }
}

module.exports = IndicatorModel;