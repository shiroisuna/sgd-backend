const express = require('express');
const router = express.Router();
const uploadPdf = require('../../middlewares/upload.middleware');
const { uploadDocument, 
    getDocumentsByDepartment, 
    getCategories, 
    getDocumentByTitleOrCategory, 
    getDocumentsByDeptAndCategory,
    getMenuStructure,
    
    getDocumentsQuery // <-- Nuevo controlador unificado
 } = require('./documents.controller');


router.get('/', getDocumentsQuery);

// Endpoint para subir un PDF (Usa el middleware 'uploadPdf.single("archivoPdf")')
router.post('/upload', uploadPdf.single('archivoPdf'), uploadDocument);

// Endpoint para listar documentos por ID de Departamento
router.get('/department/:idDepartamento', getDocumentsByDepartment);

// Endpoint para listar por Departamento y Categoría (Parámetros)
router.get('/department/:idDepartamento/category/:idCategoria', getDocumentsByDeptAndCategory);

// Ruta para obtener las categorías de la BD de forma dinámica
router.get('/categories', getCategories);

// Ruta para consultar y abrir el documento dinámicamente
router.get('/view/:searchTerm', getDocumentByTitleOrCategory);

// Ruta para obtener la estructura del menú superior agrupada por categorías
router.get('/menu-structure', getMenuStructure);

// // (Otras rutas existentes de documentos...)
// router.get('/view/:titulo', getDocumentByTitle);

module.exports = router;