const cron = require('node-cron');
const Reminder = require('./reminder.service');

/*
 * Recordatorio de carga de indicadores: todos los días a las 8:00 a.m. (hora de Venezuela)
 * del 1 al 5 de cada mes. Se puede cambiar con REMINDER_CRON en el .env
 * o desactivar con REMINDER_ACTIVO=false.
 */
const iniciarTareasProgramadas = () => {
    if (process.env.REMINDER_ACTIVO === 'false') {
        console.log('[recordatorios] desactivados (REMINDER_ACTIVO=false)');
        return;
    }

    const dias = Reminder.DIAS_RECORDATORIO;
    const expresion = process.env.REMINDER_CRON || `0 8 1-${dias} * *`;

    cron.schedule(expresion, () => {
        Reminder.enviarRecordatorios().catch(err =>
            console.error('[recordatorios] error en la tarea programada:', err)
        );
    }, { timezone: 'America/Caracas' });

    console.log(`[recordatorios] programados: "${expresion}" (America/Caracas)`);
};

module.exports = { iniciarTareasProgramadas };
