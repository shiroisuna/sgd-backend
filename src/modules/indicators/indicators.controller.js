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
        const { nombre, idDepartamento, formulaDescripcion, anio } = req.body;

        if (!nombre || !idDepartamento || !anio) {
            return res.status(400).json({ error: 'El nombre, el ID del departamento y el año son obligatorios.' });
        }

        const nuevoIndicador = await IndicatorModel.createConfig({
            nombre,
            idDepartamento,
            formulaDescripcion,
            anio
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

module.exports = {
    getIndicatorsByDepartment,
    createIndicatorConfig,
    saveIndicatorLoad,
    getIndicatorRecords
};