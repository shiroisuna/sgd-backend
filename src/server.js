require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Importar rutas (serán creadas en los módulos)
const authRoutes = require('./modules/auth/auth.routes');
const documentRoutes = require('./modules/documents/documents.routes');
const indicatorRoutes = require('./modules/indicators/indicators.routes');
const departmentRoutes = require('./modules/departaments/departments.routes');
const userRoutes = require('./modules/users/users.routes');




// Ruta de red compartida que definiste en multer
const STORAGE_PATH = process.env.STORAGE_PATH || '\\\\192.168.10.112\\SGC_Documentos\\';
const localUploadsPath = path.join(__dirname, '../uploads'); // Ajusta segun la ubicación de tu server.js respecto a uploads


// Rutas base
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/departments', departmentRoutes);


// CORRECCIÓN AQUÍ: Haz que /uploads apunte a la ruta correcta fuera de src/
app.use('/uploads', express.static(localUploadsPath));

// Opcional: si también quieres mantener /documentos-storage apuntando al mismo sitio
app.use('/documentos-storage', express.static(localUploadsPath));

app.use('/api/indicators', indicatorRoutes);

app.use('/api/users', userRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend SGDPola corriendo en puerto ${PORT}`);
});