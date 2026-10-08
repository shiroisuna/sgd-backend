// const express = require('express');
// const router = express.Router();
// const { 
//     getIndicatorsByDepartment, 
//     createIndicatorConfig, 
//     saveIndicatorLoad, 
//     getIndicatorRecords 
// } = require('./indicators.controller');

// // Obtener indicadores configurados por departamento
// router.get('/department/:idDepartamento', getIndicatorsByDepartment);

// // Crear un nuevo indicador en la configuración
// router.post('/config', createIndicatorConfig);

// // Guardar o actualizar la carga mensual de un indicador
// router.post('/load', saveIndicatorLoad);

// // Consultar historial de registros por depto, año y mes opcional
// router.get('/records', getIndicatorRecords);

// module.exports = router;




const express = require('express');
const router = express.Router();
const { 
    getIndicatorsByDepartment, 
    createIndicatorConfig, 
    saveIndicatorLoad, 
    getIndicatorRecords 
} = require('./indicators.controller');

// Obtener indicadores configurados por departamento
router.get('/department/:idDepartamento', getIndicatorsByDepartment);

// Crear un nuevo indicador en la configuración
router.post('/config', createIndicatorConfig);

// Guardar o actualizar la carga mensual de un indicador
router.post('/load', saveIndicatorLoad);

// Consultar historial de registros por depto, año y mes opcional
router.get('/records', getIndicatorRecords);

module.exports = router;