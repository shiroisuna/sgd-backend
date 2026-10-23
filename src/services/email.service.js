const nodemailer = require('nodemailer');

/*
 * Envío por el conector de Office 365 (puerto 25 + STARTTLS, sin usuario ni contraseña),
 * igual que en la Intrapola. El conector autoriza por IP: el servidor donde corre esta API
 * (192.168.10.101) debe estar autorizado en Exchange Online.
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'industriasamapola-com.mail.protection.outlook.com',
  port: Number(process.env.EMAIL_PORT || 25),
  secure: false,
  requireTLS: true,
  // Nombre que se presenta en el EHLO. Office 365 rechaza nombres raros (con "_" o sin dominio).
  name: process.env.EMAIL_EHLO || 'industriasamapola.com',
  connectionTimeout: 30000,
  tls: { servername: process.env.EMAIL_HOST || 'industriasamapola-com.mail.protection.outlook.com' },
  logger: process.env.EMAIL_DEBUG === 'true',
  debug: process.env.EMAIL_DEBUG === 'true'
});

const REMITENTE = process.env.EMAIL_USER || 'sistemas.amapola@industriasamapola.com';
const URL_SISTEMA = process.env.APP_URL || 'http://192.168.10.101:8080/sgd/';

const EmailService = {
  sendCredentials: async (email, username, password) => {
    const mailOptions = {
      from: { name: 'Sistema SGD', address: REMITENTE },
      to: email,
      subject: 'Credenciales de Acceso - Sistema de Gestión Documental',
      text: `Se ha creado una cuenta para ti en el Sistema de Gestión Documental (SGD).\n\n` +
            `Usuario: ${username}\nContraseña temporal: ${password}\n\n` +
            `Ingresa en: ${URL_SISTEMA}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2C6337; margin-top: 0;">¡Bienvenido a Industrias Amapola!</h2>
          <p>Se ha creado una cuenta para ti en el Sistema de Gestión Documental (SGD).</p>
          <p>A continuación tus datos de acceso:</p>
          <div style="background: #F1F9F2; padding: 15px; border-radius: 8px; border: 1px solid #BCDBC2; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Usuario:</strong> ${username}</p>
            <p style="margin: 5px 0;"><strong>Contraseña temporal:</strong> ${password}</p>
          </div>
          <p>Te recomendamos iniciar sesión y mantener tus credenciales en un lugar seguro.</p>
          <p>Puedes acceder ingresando al siguiente enlace:
            <a href="${URL_SISTEMA}" target="_blank" style="color: #2C6337; font-weight: bold;">${URL_SISTEMA}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Este es un correo automático del sistema, por favor no respondas a este mensaje.</p>
        </div>
      `
    };

    // Si falla, lanza el error para que el controlador decida qué hacer
    await transporter.sendMail(mailOptions);
  }
  ,

  // Recordatorio de carga de indicadores (primeros días del mes)
  sendIndicatorReminder: async (email, nombre, periodo, pendientes) => {
    const escapar = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const bloques = pendientes.map(p => {
      const detalle = p.sinIndicadores
        ? `<p style="margin: 4px 0 0; color: #64748b;">No tiene objetivos configurados para ${periodo.anio}.</p>`
        : `<ul style="margin: 6px 0 0; padding-left: 18px;">${p.indicadores.map(i => `<li>${escapar(i)}</li>`).join('')}</ul>`;
      return `<div style="background: #F1F9F2; padding: 12px 15px; border-radius: 8px; border: 1px solid #BCDBC2; margin: 10px 0;">
                <strong>${escapar(p.codigo)} - ${escapar(p.nombre)}</strong>${detalle}
              </div>`;
    }).join('');

    const texto = pendientes.map(p =>
      `${p.codigo} - ${p.nombre}: ` + (p.sinIndicadores ? `sin objetivos configurados para ${periodo.anio}` : p.indicadores.join('; '))
    ).join('\n');

    await transporter.sendMail({
      from: { name: 'Sistema SGD', address: REMITENTE },
      to: email,
      subject: `Recordatorio: carga de indicadores de ${periodo.nombreMes} ${periodo.anio}`,
      text: `Hola ${nombre},\n\nRecuerda cargar los indicadores de ${periodo.nombreMes} ${periodo.anio} en el SGD.\n\n${texto}\n\nIngresa en: ${URL_SISTEMA}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2C6337; margin-top: 0;">Recordatorio de carga de indicadores</h2>
          <p>Hola <strong>${escapar(nombre)}</strong>,</p>
          <p>Recuerda cargar en el SGD los resultados de los objetivos correspondientes a <strong>${periodo.nombreMes} ${periodo.anio}</strong>. Aún están pendientes:</p>
          ${bloques}
          <p>Puedes cargarlos en <strong>Indicadores de Proceso</strong>:
            <a href="${URL_SISTEMA}" target="_blank" style="color: #2C6337; font-weight: bold;">${URL_SISTEMA}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Este es un correo automático del sistema, por favor no respondas a este mensaje.</p>
        </div>
      `
    });
  }
};

module.exports = EmailService;