const NotificationsModel = require('./notifications.model');
const Reminder = require('../../services/reminder.service');

// GET /api/notifications?idUsuario=5
// Devuelve el recordatorio de carga de indicadores que el usuario debe ver en el sistema
const getNotifications = async (req, res) => {
    try {
        const { idUsuario } = req.query;
        if (!idUsuario) return res.status(400).json({ error: 'idUsuario es obligatorio.' });

        const periodo = Reminder.periodoACargar();
        const activo = Reminder.estaEnPeriodoRecordatorio();

        if (!activo) {
            return res.json({ activo: false, periodo, diasRecordatorio: Reminder.DIAS_RECORDATORIO, pendientes: [] });
        }

        const usuario = await NotificationsModel.getUsuario(idUsuario);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // El admin ve los pendientes de todos los departamentos
        const pendientes = await Reminder.obtenerPendientes(periodo, usuario.esAdmin ? null : usuario.departamentos);

        res.json({ activo: true, periodo, diasRecordatorio: Reminder.DIAS_RECORDATORIO, esAdmin: usuario.esAdmin, pendientes });
    } catch (err) {
        console.error('Error al obtener notificaciones:', err);
        res.status(500).json({ error: 'Error interno al consultar las notificaciones.' });
    }
};

// POST /api/notifications/send-reminders  (prueba manual; ?forzar=true envía aunque no sea del 1 al 5)
const sendReminders = async (req, res) => {
    try {
        const resultado = await Reminder.enviarRecordatorios({ forzar: req.query.forzar === 'true' });
        res.json(resultado);
    } catch (err) {
        console.error('Error al enviar recordatorios:', err);
        res.status(500).json({ error: 'Error interno al enviar los recordatorios.' });
    }
};

module.exports = { getNotifications, sendReminders };
