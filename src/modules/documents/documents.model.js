const { getConnection, sql } = require('../../config/db');

class DocumentModel {
    static async create({ titulo, codigoDocumento, idDepartamento, idCategoria, rutaArchivo, nombreOriginal, idUsuario, menuSeccion, nombreMenuOpci, version, seccionLateral }) {
        const pool = await getConnection();

        let idCategoriaReal = idCategoria;

        // Si idCategoria viene con valor, intentamos resolverlo; si es null/undefined, se queda como null
        if (idCategoria !== null && idCategoria !== undefined && idCategoria !== '') {
            if (isNaN(idCategoria)) {
                const catResult = await pool.request()
                    .input('CodigoCat', sql.VarChar, idCategoria)
                    .query('SELECT IdCategoria FROM CategoriasDocumento WHERE Codigo = @CodigoCat OR Nombre = @CodigoCat');
                
                if (catResult.recordset.length > 0) {
                    idCategoriaReal = catResult.recordset[0].IdCategoria;
                } else {
                    throw new Error(`La categoría con código o nombre '${idCategoria}' no existe en la base de datos.`);
                }
            } else {
                idCategoriaReal = parseInt(idCategoria);
            }
        } else {
            idCategoriaReal = null;
        }

        const query = `
            INSERT INTO Documentos (Titulo, CodigoDocumento, IdDepartamento, IdCategoria, RutaArchivo, NombreArchivoOriginal, SubidoPor, MenuSeccion, NombreMenuOpci, Version, SeccionLateral)
            VALUES (@Titulo, @CodigoDocumento, @IdDepartamento, @IdCategoria, @RutaArchivo, @NombreOriginal, @SubidoPor, @MenuSeccion, @NombreMenuOpci, @Version, @SeccionLateral)
        `;

        await pool.request()
            .input('Titulo', sql.VarChar, titulo)
            .input('CodigoDocumento', sql.VarChar, codigoDocumento || null)
            .input('IdDepartamento', sql.Int, parseInt(idDepartamento))
            .input('IdCategoria', sql.Int, idCategoriaReal)
            .input('RutaArchivo', sql.VarChar, rutaArchivo)
            .input('NombreOriginal', sql.VarChar, nombreOriginal)
            .input('SubidoPor', sql.Int, idUsuario)
            .input('MenuSeccion', sql.VarChar, menuSeccion || null)
            .input('NombreMenuOpci', sql.VarChar, nombreMenuOpci || null)
            .input('Version', sql.VarChar, version || '0')
            .input('SeccionLateral', sql.VarChar, seccionLateral || null)
            .query(query);
    }

    static async getByDepartment(idDepartamento) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdDepartamento', sql.Int, parseInt(idDepartamento))
            .query('SELECT * FROM Documentos WHERE IdDepartamento = @IdDepartamento ORDER BY IdDocumento DESC');
        
        return result.recordset;
    }

    static async getByDeptAndCategory(idDepartamento, idCategoria) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdDepartamento', sql.Int, parseInt(idDepartamento))
            .input('IdCategoria', sql.Int, parseInt(idCategoria))
            .query(`
                SELECT * FROM Documentos 
                WHERE IdDepartamento = @IdDepartamento 
                AND IdCategoria = @IdCategoria
                ORDER BY IdDocumento DESC
            `);
        return result.recordset;
    }

    // static async getByDeptAndCategoryCodeOrId(idDepartamento, categoryFilter) {
    //     const pool = await getConnection();
        
    //     let categoryCondition = "";
    //     const request = pool.request().input('IdDepartamento', sql.Int, parseInt(idDepartamento));

    //     if (categoryFilter === 'caracterizacion') {
    //         categoryCondition = "AND (CodigoDocumento LIKE 'CP%' OR IdCategoria IN (SELECT IdCategoria FROM CategoriasDocumento WHERE Codigo = 'CP' OR Nombre LIKE '%Caracterización%'))";
    //     } else if (!isNaN(categoryFilter)) {
    //         request.input('IdCategoria', sql.Int, parseInt(categoryFilter));
    //         categoryCondition = "AND IdCategoria = @IdCategoria";
    //     }

    //     const query = `
    //         SELECT * FROM Documentos 
    //         WHERE IdDepartamento = @IdDepartamento 
    //         ${categoryCondition}
    //         ORDER BY IdDocumento DESC
    //     `;

    //     const result = await request.query(query);
    //     return result.recordset;
    // }



    static async getByDeptAndCategoryCodeOrId(idDepartamento, categoryFilter) {
        const pool = await getConnection();
        
        let categoryCondition = "";
        const request = pool.request().input('IdDepartamento', sql.Int, parseInt(idDepartamento));

        // Filtros basados en el tipo de sección o categoría solicitada
        if (categoryFilter === 'caracterizacion') {
            categoryCondition = "AND (CodigoDocumento LIKE 'CP%' OR IdCategoria IN (SELECT IdCategoria FROM CategoriasDocumento WHERE Codigo = 'CP' OR Nombre LIKE '%Caracterización%'))";
        } else if (categoryFilter === 'formularios') {
            categoryCondition = "AND (CodigoDocumento LIKE 'FO%' OR IdCategoria IN (SELECT IdCategoria FROM CategoriasDocumento WHERE Codigo = 'FO' OR Nombre LIKE '%Formulario%'))";
        } 
        // else if (categoryFilter === 'documentos-externos' || categoryFilter === 'externos') {
        //     categoryCondition = "AND (CodigoDocumento LIKE 'EXT%' OR CodigoDocumento LIKE 'DE%' OR IdCategoria IN (SELECT IdCategoria FROM CategoriasDocumento WHERE Codigo IN ('EXT', 'DE') OR Nombre LIKE '%Externo%'))";
        // } 
        else if (categoryFilter === 'documentos' || categoryFilter === 'procedimientos') {
            // Ejemplo para procedimientos o documentos generales estándar (ej: PR, INS)
            categoryCondition = "AND (CodigoDocumento LIKE 'PR%' OR CodigoDocumento LIKE 'IT%' OR CodigoDocumento LIKE 'PG%' OR CodigoDocumento LIKE 'PL%' OR CodigoDocumento LIKE 'TB%' OR IdCategoria IN (SELECT IdCategoria FROM CategoriasDocumento WHERE Codigo IN ('PR', 'IT', 'PG', 'PL', 'TB') OR Nombre LIKE '%Procedimiento%'))";
        } else if (!isNaN(categoryFilter) && categoryFilter !== null && categoryFilter !== undefined && categoryFilter !== '') {
            request.input('IdCategoria', sql.Int, parseInt(categoryFilter));
            categoryCondition = "AND IdCategoria = @IdCategoria";
        }

        const query = `
            SELECT * FROM Documentos 
            WHERE IdDepartamento = @IdDepartamento 
            ${categoryCondition}
            ORDER BY IdDocumento DESC
        `;

        const result = await request.query(query);
        return result.recordset;
    }

    static async getAllCategories() {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT IdCategoria, Codigo, Nombre FROM CategoriasDocumento');
        return result.recordset;
    }

    static async getByTitleOrCategory(searchTerm) {
        const pool = await getConnection();
        
        // Decodificamos por si viene con espacios o caracteres codificados de la URL
        const term = decodeURIComponent(searchTerm).trim();

        const result = await pool.request()
            .input('SearchExact', sql.VarChar, term)
            .input('SearchLike', sql.VarChar, `%${term}%`)
            .query(`
                SELECT TOP 1 * FROM Documentos 
                WHERE RutaArchivo LIKE @SearchLike 
                   OR Titulo = @SearchExact 
                   OR CodigoDocumento = @SearchExact 
                   OR NombreArchivoOriginal LIKE @SearchLike
                ORDER BY IdDocumento DESC
            `);
        
        return result.recordset[0] || null;
    }

    static async getMenuStructure() {
        const pool = await getConnection();
        
        // 1. Obtener categorías del sistema
        const categoriasResult = await pool.request().query(
            'SELECT IdCategoria as id, Codigo as codigo, Nombre as nombre FROM CategoriasDocumento ORDER BY IdCategoria ASC'
        );

        // 2. Obtener documentos incluyendo los campos del menú superior
        const documentosResult = await pool.request().query(
            'SELECT IdDocumento as id, Titulo as titulo, CodigoDocumento as codigoDocumento, IdCategoria as categoriaId, RutaArchivo as rutaArchivo, MenuSeccion as menuSeccion, NombreMenuOpci as nombreMenuOpci FROM Documentos ORDER BY IdDocumento DESC'
        );

        const categorias = categoriasResult.recordset;
        const documentos = documentosResult.recordset;

        // 3. Mapear categorías con sus documentos internos
        const menuStructure = categorias.map(cat => {
            return {
                id: cat.id,
                codigo: cat.codigo,
                nombre: cat.nombre,
                documentos: documentos.filter(doc => doc.categoriaId === cat.id)
            };
        });

        // Opcionalmente puedes retornar también los documentos sueltos del menú superior si tu frontend los necesita por separado
        const documentosMenuSuperior = documentos.filter(doc => doc.menuSeccion !== null);

        return {
            categoriasMenu: menuStructure,
            documentosSuperiores: documentosMenuSuperior
        };
    }
}

module.exports = DocumentModel;