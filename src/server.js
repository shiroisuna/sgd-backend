require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Importar rutas
const authRoutes = require('./modules/auth/auth.routes');
const documentRoutes = require('./modules/documents/documents.routes');
const indicatorRoutes = require('./modules/indicators/indicators.routes');
const departmentRoutes = require('./modules/departaments/departments.routes');
const userRoutes = require('./modules/users/users.routes');

// Carpeta donde se guardan los PDF (fuera de src/)
const localUploadsPath = path.join(__dirname, '../uploads');

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);

// Para que el frontend verifique si el backend está activo
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Archivos estáticos (PDF)
app.use('/uploads', express.static(localUploadsPath));
app.use('/documentos-storage', express.static(localUploadsPath));

const PORT = process.env.PORT || 5100;
app.listen(PORT, (err) => {
    if (err) {
        console.error(`No se pudo iniciar en el puerto ${PORT}:`, err.message);
        process.exit(1);
    }
    console.log(`Backend SGDPola corriendo en puerto ${PORT}`);
});