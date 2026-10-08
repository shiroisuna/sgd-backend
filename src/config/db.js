const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // Cambiar a true si el servidor SQL requiere SSL
        trustServerCertificate: true
    }
};

const getConnection = async () => {
    try {
        const pool = await sql.connect(dbConfig);
        return pool;
    } catch (err) {
        console.error('Error conectando a SQL Server:', err);
        throw err;
    }
};

module.exports = { getConnection, sql };