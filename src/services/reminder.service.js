const NotificationsModel = require('../modules/notifications/notifications.model');
const EmailService = require('./email.service');

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
               'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Días del mes en los que se recuerda la carga (por defecto del 1 al 5)
const DIAS_RECORDATORIO = Number(process.env.REMINDER_DIAS || 5);

// En los primeros días de un mes se cargan los indicadores del mes ANTERIOR
const periodoACargar = (fecha = new Date()) => {
    const mes = fecha.getMonth(); // 0-11 → el mes anterior en 1-12
    const anio = mes === 0 ? fecha.getFullYear() - 1 : fecha.getFullYear();
    const mesCarga = mes === 0 ? 12 : mes;
    return { anio, mes: mesCarga, nombreMes: MESES[mesCarga - 1] };
};

const estaEnPeriodoRecordatorio = (fecha = new Date()) => fecha.getDate() <= DIAS_RECORDATORIO;

/*
 * Pendientes agrupados por departamento:
 * [{ idDepartamento, codigo, nombre, sinIndicadores, indicadores: ['...'] }]
 * - indicadores: objetivos configurados del año sin carga del mes
 * - sinIndicadores: el departamento no tiene objetivos configurados para el año
 */
const obtenerPendientes = async (periodo, idsDepartamentos = null) => {
    const [pendientes, conIndicadores, departamentos] = await Promise.all([
        NotificationsModel.getIndicadoresPendientes(periodo.anio, periodo.mes),
        NotificationsModel.getDepartamentosConIndicadores(periodo.anio),
        NotificationsModel.getDepartamentos()
    ]);

    const filtrar = (id) => !idsDepartamentos || idsDepartamentos.includes(id);
    const porDepto = new Map();

    for (const p of pendientes) {
        if (!filtrar(p.IdDepartamento)) continue;
        if (!porDepto.has(p.IdDepartamento)) {
            porDepto.set(p.IdDepartamento, {
                idDepartamento: p.IdDepartamento,
                codigo: p.CodigoDepartamento,
                nombre: p.NombreDepartamento,
                sinIndicadores: false,
                indicadores: []
            });
        }
        porDepto.get(p.IdDepartamento).indicadores.push(p.NombreIndicador);
    }

    // Departamentos del usuario sin objetivos configurados en el año
    if (idsDepartamentos) {
        for (const id of idsDepartamentos) {
            if (conIndicadores.includes(id) || porDepto.has(id)) continue;
            const d = departamentos.find(x => x.IdDepartamento === id);
            if (d) {
                porDepto.set(id, { idDepartamento: id, codigo: d.Codigo, nombre: d.Nombre, sinIndicadores: true, indicadores: [] });
            }
        }
    }

    return [...porDepto.values()];
};

// Envía el correo de recordatorio a cada usuario que tenga pendientes
const enviarRecordatorios = async ({ forzar = false } = {}) => {
    if (!forzar && !estaEnPeriodoRecordatorio()) {
        return { enviados: 0, omitido: 'Fuera de los días de recordatorio.' };
    }

    const periodo = periodoACargar();
    const usuarios = await NotificationsModel.getUsuariosActivos();
    let enviados = 0;
    const errores = [];

    for (const u of usuarios) {
        if (!u.email) continue;
        const pendientes = await obtenerPendientes(periodo, u.departamentos);
        if (pendientes.length === 0) continue;

        try {
            await EmailService.sendIndicatorReminder(u.email, u.NombreCompleto || u.Username, periodo, pendientes);
            enviados++;
        } catch (err) {
            errores.push(`${u.email}: ${err.message}`);
        }
    }

    if (errores.length) console.error('[recordatorios] fallaron:', errores);
    console.log(`[recordatorios] ${periodo.nombreMes} ${periodo.anio}: ${enviados} correo(s) enviados`);
    return { enviados, errores, periodo };
};

module.exports = { periodoACargar, estaEnPeriodoRecordatorio, obtenerPendientes, enviarRecordatorios, DIAS_RECORDATORIO };
