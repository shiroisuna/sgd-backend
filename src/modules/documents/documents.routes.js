const express = require('express');
const router = express.Router();
const uploadPdf = require('../../middlewares/upload.middleware');
const { uploadDocument, 
    getDocumentsByDepartment, 
    getCategories, 
    getDocumentByTitleOrCategory, 
    getDocumentsByDeptAndCategory,
    getMenuStructure,
    deleteDocument,
    
    getDocumentsQuery // <-- Nuevo controlador unificado
 } = require('./documents.controller');


router.get('/', getDocumentsQuery);

// Endpoint para subir un PDF (Usa el middleware 'uploadPdf.single("archivoPdf")')
// Si el archivo no es válido, responde el motivo en JSON (para mostrarlo en el formulario)
router.post('/upload', (req, res, next) => {
    uploadPdf.single('archivoPdf')(req, res, (err) => {
        if (err) {
            const mensaje = err.code === 'LIMIT_FILE_SIZE'
                ? 'El archivo supera el tamaño máximo de 20 MB.'
                : err.message;
            return res.status(400).json({ error: mensaje });
        }
        next();
    });
}, uploadDocument);

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

// Eliminar un documento (registro en BD + archivo PDF)
// Va al final para que no choque con rutas como /categories o /menu-structure
router.delete('/:id', deleteDocument);

// // (Otras rutas existentes de documentos...)
// router.get('/view/:titulo', getDocumentByTitle);

module.exports = router;