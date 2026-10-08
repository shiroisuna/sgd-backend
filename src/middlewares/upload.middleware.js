const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getConnection, sql } = require('../config/db');

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            // 1. Verificación: ¿Es un archivo de menú superior?
            if (req.body.esMenuSuperior === 'true' || req.body.tipoDestino === 'menuSuperior') {
                const uploadDir = 'uploads'; // Directo a la raíz de uploads
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                return cb(null, uploadDir);
            }

            // 2. Extracción de datos del cuerpo de la petición
            const idDepartamento = req.body.idDepartamento;
            const idCategoria = req.body.idCategoria;
            const codigoDocumento = (req.body.codigoDocumento || '').toUpperCase().trim();

            let deptFolder = 'general';
            let catFolder = 'general';

            const pool = await getConnection();

            // Obtener carpeta o nombre del Departamento
            if (idDepartamento) {
                const deptResult = await pool.request()
                    .input('IdDepto', sql.Int, parseInt(idDepartamento))
                    .query('SELECT Codigo, Nombre FROM Departamentos WHERE IdDepartamento = @IdDepto');
                
                if (deptResult.recordset.length > 0) {
                    deptFolder = deptResult.recordset[0].Codigo || deptResult.recordset[0].Nombre;
                } else {
                    deptFolder = idDepartamento;
                }
            }

            const deptClean = String(deptFolder).replace(/[^a-zA-Z0-9_-]/g, '_');
            let uploadDir = path.join('uploads', deptClean);

            // 3. Regla de negocio para carpetas basada en el código del documento
            // Si el código comienza con PR, IT, PL, PG, TB (u otros generales), van a la carpeta 'documentos'
            const esDocumentoGeneral = /^(PR|IT|PL|PG|TB)/.test(codigoDocumento);

            if (esDocumentoGeneral) {
                uploadDir = path.join(uploadDir, 'documentos');
            } else if (codigoDocumento.startsWith('FO')) {
                uploadDir = path.join(uploadDir, 'formularios');
            } else if (codigoDocumento.startsWith('CP')) {
                uploadDir = path.join(uploadDir, 'caracterizacion');
            } else {
                // Si no cae en los anteriores, usamos la categoría normal o su ID como respaldo
                if (idCategoria) {
                    const catResult = await pool.request()
                        .input('IdCat', sql.Int, parseInt(idCategoria))
                        .query('SELECT Codigo, Nombre FROM CategoriasDocumento WHERE IdCategoria = @IdCat');
                    
                    if (catResult.recordset.length > 0) {
                        catFolder = catResult.recordset[0].Codigo || catResult.recordset[0].Nombre;
                    } else {
                        catFolder = idCategoria;
                    }
                }
                const catClean = String(catFolder).replace(/[^a-zA-Z0-9_-]/g, '_');
                uploadDir = path.join(uploadDir, catClean);
            }

            // Asegurar creación física de la ruta anidada
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            cb(null, uploadDir);
        } catch (error) {
            console.error('Error al resolver carpetas en Multer:', error);
            const fallbackDir = path.join('uploads', 'general');
            if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
            cb(null, fallbackDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});

const uploadPdf = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos en formato PDF.'), false);
        }
    }
});

module.exports = uploadPdf;