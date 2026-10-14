const DocumentModel = require('./documents.model');
const { getConnection, sql } = require('../../config/db');
const path = require('path');
const fs = require('fs');

// Carpeta raíz del backend (donde está la carpeta uploads)
const BACKEND_ROOT = path.join(__dirname, '../../..');
const UPLOADS_ROOT = path.join(BACKEND_ROOT, 'uploads');

const uploadDocument = async (req, res) => {
    try {
        const { 
            titulo, 
            codigoDocumento, 
            idDepartamento, 
            idCategoria, 
            idUsuario, 
            tipoDestino, 
            menuSeccion, 
            nombreMenuOpci,
            seccionLateral,
            rev // <-- 1. Capturar el campo de revisión / versión
        } = req.body;
        const archivo = req.file;

        if (!archivo) {
            return res.status(400).json({ error: 'No se ha adjuntado ningún archivo PDF o el formato no es válido.' });
        }

        const pool = await getConnection();

        const userCheck = await pool.request()
            .input('IdUsuario', sql.Int, parseInt(idUsuario || 1))
            .query(`
                SELECT U.Username, U.IdDepartamento, D.Codigo AS CodigoDepartamento 
                FROM Usuarios U 
                INNER JOIN Departamentos D ON U.IdDepartamento = D.IdDepartamento 
                WHERE U.IdUsuario = @IdUsuario
            `);
        
        const userData = userCheck.recordset[0];
        const username = userData?.Username;

        if (tipoDestino === 'menuSuperior' && username !== 'admin') {
            return res.status(403).json({ 
                error: 'Acceso denegado: Su usuario no tiene permisos para publicar o modificar documentos en el menú superior.' 
            });
        }

        const departamentoFinal = (username === 'admin' && idDepartamento) 
            ? parseInt(idDepartamento) 
            : userData?.IdDepartamento;

        let rutaFinalArchivo = archivo.path;
        if (tipoDestino === 'menuSuperior') {
            const normalizedFileName = archivo.filename || archivo.originalname;
            rutaFinalArchivo = `uploads/${normalizedFileName}`;
        }

        // Categoría del documento:
        // - Listas Maestras y Documentos Externos usan su propia categoría (LM / EX)
        // - El resto se deduce del prefijo del código (CP, FO, PR, IT, ...)
        let categoriaFinal = null;
        if (tipoDestino === 'categoria') {
            let codigoCategoria = null;
            if (seccionLateral === 'listas-maestras') {
                codigoCategoria = 'LM';
            } else if (seccionLateral === 'externos') {
                codigoCategoria = 'EX';
            } else if (codigoDocumento) {
                codigoCategoria = codigoDocumento.toUpperCase().trim().substring(0, 2);
            }

            if (codigoCategoria) {
                const catResult = await pool.request()
                    .input('Codigo', sql.VarChar, codigoCategoria)
                    .query('SELECT IdCategoria FROM CategoriasDocumento WHERE Codigo = @Codigo');
                categoriaFinal = catResult.recordset[0]?.IdCategoria ?? null;
            }
        }

        await DocumentModel.create({
            titulo,
            codigoDocumento: codigoDocumento || null,
            idDepartamento: departamentoFinal,
            idCategoria: categoriaFinal,
            rutaArchivo: rutaFinalArchivo,
            nombreOriginal: archivo.originalname,
            idUsuario: idUsuario ? parseInt(idUsuario) : 1,
            menuSeccion: tipoDestino === 'menuSuperior' ? menuSeccion : null,
            nombreMenuOpci: tipoDestino === 'menuSuperior' ? (nombreMenuOpci || titulo) : null,
            version: rev || '0' // <-- 2. Asignarlo al modelo o sentencia SQL de inserción
        });

        res.status(201).json({ 
            mensaje: 'Documento PDF subido y registrado exitosamente.',
            archivo: archivo.filename,
            path: rutaFinalArchivo
        });
    } catch (err) {
        console.error('Error al subir documento:', err);
        res.status(500).json({ error: err.message || 'Error interno en el servidor al registrar el documento.' });
    }
};

const getDocumentsQuery = async (req, res) => {
    try {
        const { dept, category } = req.query;
        
        if (!dept) {
            return res.status(400).json({ error: 'El parámetro "dept" es obligatorio.' });
        }

        const deptId = dept === 'SGC' ? 1 : parseInt(dept);

        let documentos = [];
        
        if (category) {
            documentos = await DocumentModel.getByDeptAndCategoryCodeOrId(deptId, category);
        } else {
            documentos = await DocumentModel.getByDepartment(deptId);
        }

        res.json(documentos || []);
    } catch (err) {
        console.error('Error al obtener documentos:', err);
        res.status(500).json({ error: 'Error al consultar los documentos.' });
    }
};

const getDocumentsByDepartment = async (req, res) => {
    try {
        const { idDepartamento } = req.params;
        if (!idDepartamento || isNaN(idDepartamento)) {
            return res.status(400).json({ error: 'ID de departamento inválido.' });
        }
        const documentos = await DocumentModel.getByDepartment(parseInt(idDepartamento));
        res.json(documentos);
    } catch (err) {
        console.error('Error al obtener documentos:', err);
        res.status(500).json({ error: 'Error al consultar los documentos.' });
    }
};

const getCategories = async (req, res) => {
    try {
        const categorias = await DocumentModel.getAllCategories();
        res.json(categorias);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ error: 'Error al consultar las categorías.' });
    }
};

const getDocumentsByDeptAndCategory = async (req, res) => {
    try {
        const { idDepartamento, idCategoria } = req.params;
        const documentos = await DocumentModel.getByDeptAndCategory(idDepartamento, idCategoria);
        res.json(documentos);
    } catch (err) {
        console.error('Error al obtener documentos por depto y categoría:', err);
        res.status(500).json({ error: 'Error al consultar los documentos.' });
    }
};

const getDocumentByTitleOrCategory = async (req, res) => {
    try {
        const searchTerm = decodeURIComponent(req.params.searchTerm);
        const doc = await DocumentModel.getByTitleOrCategory(searchTerm);

        if (!doc) {
            return res.status(404).json({ error: 'Documento no encontrado en la base de datos.' });
        }
        
        let rutaLimpia = doc.RutaArchivo.replace(/\\/g, '/');
        if (rutaLimpia.startsWith('uploads/')) {
            rutaLimpia = rutaLimpia.replace('uploads/', '');
        }

        const fileUrl = `/uploads/${rutaLimpia}`;

        res.json({ success: true, url: fileUrl, documento: doc });
    } catch (err) {
        console.error('Error al buscar el documento:', err);
        res.status(500).json({ error: 'Error al obtener el archivo.' });
    }
};

const getMenuStructure = async (req, res) => {
    try {
        const menuStructure = await DocumentModel.getMenuStructure();
        res.json(menuStructure);
    } catch (err) {
        console.error('Error al obtener la estructura del menú:', err);
        res.status(500).json({ error: 'Error al consultar la estructura del menú.' });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'ID de documento inválido.' });
        }

        const doc = await DocumentModel.getById(id);
        if (!doc) {
            return res.status(404).json({ error: 'El documento no existe.' });
        }

        // 1. Borrar el registro de la base de datos
        await DocumentModel.deleteById(id);

        // 2. Borrar el PDF del disco (solo si está dentro de la carpeta uploads)
        if (doc.RutaArchivo) {
            const rutaNormalizada = doc.RutaArchivo.replace(/\\/g, '/');
            const rutaFisica = path.resolve(BACKEND_ROOT, rutaNormalizada);

            if (rutaFisica.startsWith(UPLOADS_ROOT + path.sep) && fs.existsSync(rutaFisica)) {
                try {
                    fs.unlinkSync(rutaFisica);
                } catch (fileErr) {
                    // El registro ya se borró; solo se deja constancia si el archivo no se pudo eliminar
                    console.error('No se pudo eliminar el archivo físico:', rutaFisica, fileErr.message);
                }
            }
        }

        res.json({ mensaje: 'Documento eliminado correctamente.' });
    } catch (err) {
        console.error('Error al eliminar documento:', err);
        // 547 = el documento está referenciado en otra tabla (llave foránea)
        if (err.number === 547) {
            return res.status(409).json({ error: 'No se puede eliminar: el documento está referenciado en otra tabla.' });
        }
        res.status(500).json({ error: 'Error al eliminar el documento.' });
    }
};

module.exports = {
    deleteDocument,
    uploadDocument,
    getDocumentsByDepartment,
    getCategories,
    getDocumentByTitleOrCategory,
    getDocumentsByDeptAndCategory,
    getDocumentsQuery,
    getMenuStructure
};