// const IndicatorModel = require('./indicators.model');

// const getIndicatorsByDepartment = async (req, res) => {
//     try {
//         const { idDepartamento } = req.params;
//         const indicadores = await IndicatorModel.getByDepartment(idDepartamento);
//         res.json(indicadores);
//     } catch (err) {
//         console.error('Error al obtener indicadores:', err);
//         res.status(500).json({ error: 'Error interno al consultar los indicadores.' });
//     }
// };

// const createIndicatorConfig = async (req, res) => {
//     try {
//         const { nombre, idDepartamento, formulaDescripcion } = req.body;

//         if (!nombre || !idDepartamento) {
//             return res.status(400).json({ error: 'El nombre y el ID del departamento son obligatorios.' });
//         }

//         const nuevoIndicador = await IndicatorModel.createConfig({
//             nombre,
//             idDepartamento,
//             formulaDescripcion
//         });

//         res.status(201).json({ 
//             mensaje: 'Indicador configurado exitosamente.', 
//             data: nuevoIndicador 
//         });
//     } catch (err) {
//         console.error('Error al crear la configuración del indicador:', err);
//         res.status(500).json({ error: 'Error interno al guardar la configuración del indicador.' });
//     }
// };

// const saveIndicatorLoad = async (req, res) => {
//     try {
//         const { idIndicador, anio, mes, numerador, denominador, observaciones, idUsuario } = req.body;

//         if (!idIndicador || !anio || !mes || numerador === undefined || denominador === undefined) {
//             return res.status(400).json({ error: 'Faltan campos obligatorios para procesar el indicador.' });
//         }

//         await IndicatorModel.saveMonthlyLoad({
//             idIndicador,
//             anio,
//             mes,
//             numerador,
//             denominador,
//             observaciones,
//             idUsuario
//         });

//         res.status(201).json({ mensaje: 'Indicador procesado y guardado exitosamente.' });
//     } catch (err) {
//         console.error('Error al guardar el indicador:', err);
//         res.status(500).json({ error: 'Error interno al guardar la carga mensual del indicador.' });
//     }
// };

// const getIndicatorRecords = async (req, res) => {
//     try {
//         const { idDepartamento, anio, mes } = req.query;
//         if (!idDepartamento || !anio) {
//             return res.status(400).json({ error: 'El departamento y el año son obligatorios.' });
//         }

//         const records = await IndicatorModel.getRecordsByFilter(idDepartamento, anio, mes);
//         res.json(records);
//     } catch (err) {
//         console.error('Error al consultar registros de indicadores:', err);
//         res.status(500).json({ error: 'Error interno al consultar los registros.' });
//     }
// };

// module.exports = {
//     getIndicatorsByDepartment,
//     createIndicatorConfig,
//     saveIndicatorLoad,
//     getIndicatorRecords
// };


const IndicatorModel = require('./indicators.model');

const getIndicatorsByDepartment = async (req, res) => {
    try {
        const { idDepartamento } = req.params;
        const { anio } = req.query; // Capturamos el año enviado por query params desde React

        if (!anio) {
            return res.status(400).json({ error: 'El año es obligatorio para consultar los indicadores.' });
        }

        const indicadores = await IndicatorModel.getByDepartmentAndYear(idDepartamento, anio);
        res.json(indicadores);
    } catch (err) {
        console.error('Error al obtener indicadores:', err);
        res.status(500).json({ error: 'Error interno al consultar los indicadores.' });
    }
};

const createIndicatorConfig = async (req, res) => {
    try {
        const { nombre, idDepartamento, formulaDescripcion, anio, meta } = req.body;

        if (!nombre || !idDepartamento || !anio) {
            return res.status(400).json({ error: 'El nombre, el ID del departamento y el año son obligatorios.' });
        }

        const nuevoIndicador = await IndicatorModel.createConfig({
            nombre,
            idDepartamento,
            formulaDescripcion,
            anio,
            meta
        });

        res.status(201).json({ 
            mensaje: 'Indicador configurado exitosamente.', 
            data: nuevoIndicador 
        });
    } catch (err) {
        console.error('Error al crear la configuración del indicador:', err);
        res.status(500).json({ error: 'Error interno al guardar la configuración del indicador.' });
    }
};

const saveIndicatorLoad = async (req, res) => {
    try {
        const { idIndicador, anio, mes, numerador, denominador, observaciones, idUsuario } = req.body;

        if (!idIndicador || !anio || !mes || numerador === undefined || denominador === undefined) {
            return res.status(400).json({ error: 'Faltan campos obligatorios para procesar el indicador.' });
        }

        await IndicatorModel.saveMonthlyLoad({
            idIndicador,
            anio,
            mes,
            numerador,
            denominador,
            observaciones,
            idUsuario
        });

        res.status(201).json({ mensaje: 'Indicador procesado y guardado exitosamente.' });
    } catch (err) {
        console.error('Error al guardar el indicador:', err);
        res.status(500).json({ error: 'Error interno al guardar la carga mensual del indicador.' });
    }
};

const getIndicatorRecords = async (req, res) => {
    try {
        const { idDepartamento, anio, mes } = req.query;
        if (!idDepartamento || !anio) {
            return res.status(400).json({ error: 'El departamento y el año son obligatorios.' });
        }

        const records = await IndicatorModel.getRecordsByFilter(idDepartamento, anio, mes);
        res.json(records);
    } catch (err) {
        console.error('Error al consultar registros de indicadores:', err);
        res.status(500).json({ error: 'Error interno al consultar los registros.' });
    }
};

const updateIndicatorMeta = async (req, res) => {
    try {
        const { id } = req.params;
        const { meta } = req.body;
        if (meta !== null && meta !== '' && (isNaN(meta) || Number(meta) < 0 || Number(meta) > 999)) {
            return res.status(400).json({ error: 'La meta debe ser un porcentaje válido.' });
        }
        const filas = await IndicatorModel.updateMeta(id, meta);
        if (filas === 0) return res.status(404).json({ error: 'Indicador no encontrado.' });
        res.json({ mensaje: 'Meta actualizada.' });
    } catch (err) {
        console.error('Error al actualizar la meta:', err);
        res.status(500).json({ error: 'Error interno al actualizar la meta.' });
    }
};

// GET /api/indicators/dashboard?desde=2024&hasta=2026&idDepartamento=13 (idDepartamento opcional)
const getDashboardData = async (req, res) => {
    try {
        const hasta = parseInt(req.query.hasta) || new Date().getFullYear();
        const desde = parseInt(req.query.desde) || hasta - 2;
        const { idDepartamento } = req.query;
        const datos = await IndicatorModel.getDashboardData(
            desde, hasta,
            idDepartamento && idDepartamento !== 'TODOS' ? idDepartamento : null
        );
        res.json(datos);
    } catch (err) {
        console.error('Error al obtener datos de gráficas:', err);
        res.status(500).json({ error: 'Error interno al consultar los datos de las gráficas.' });
    }
};

// DELETE /api/indicators/records/:idCarga
const deleteIndicatorLoad = async (req, res) => {
    try {
        const { idCarga } = req.params;
        if (!idCarga || isNaN(idCarga)) {
            return res.status(400).json({ error: 'ID de carga inválido.' });
        }
        const filas = await IndicatorModel.deleteLoad(idCarga);
        if (filas === 0) return res.status(404).json({ error: 'La carga no existe.' });
        res.json({ mensaje: 'Carga eliminada.' });
    } catch (err) {
        console.error('Error al eliminar la carga del indicador:', err);
        res.status(500).json({ error: 'Error interno al eliminar la carga.' });
    }
};

module.exports = {
    deleteIndicatorLoad,
    updateIndicatorMeta,
    getDashboardData,
    getIndicatorsByDepartment,
    createIndicatorConfig,
    saveIndicatorLoad,
    getIndicatorRecords
};