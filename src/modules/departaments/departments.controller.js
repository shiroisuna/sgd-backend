const DepartmentModel = require('./departments.model');

const getDepartments = async (req, res) => {
    try {
        const departamentos = await DepartmentModel.getAllDepartments();
        res.json(departamentos);
    } catch (err) {
        console.error('Error al obtener los departamentos:', err);
        res.status(500).json({ error: 'Error al consultar los departamentos.' });
    }
};

module.exports = {
    getDepartments
};