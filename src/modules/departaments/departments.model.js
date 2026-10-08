const { getConnection } = require('../../config/db');

class DepartmentModel {
    static async getAllDepartments() {
        const pool = await getConnection();
        // Usamos alias en minúscula para evitar problemas en el frontend
        const result = await pool.request().query('SELECT IdDepartamento AS id, Codigo AS codigo, Nombre AS nombre FROM Departamentos ORDER BY Nombre ASC');
        return result.recordset;
    }
}

module.exports = DepartmentModel;