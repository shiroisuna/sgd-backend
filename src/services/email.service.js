const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  // service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    // Permite omitir la validación del nombre alternativo del certificado (útil para servidores internos/Exchange)
    rejectUnauthorized: false
  }
});

const EmailService = {
  sendCredentials: async (email, username, password) => {
    const mailOptions = {
      from: '"Sistema SGD-Pola" <sistemas@industriasamapola.com.ve>',
      to: email,
      subject: 'Credenciales de Acceso - Sistema de Gestión Documental',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #7f1d1d; margin-top: 0;">¡Bienvenido a Industrias Amapola!</h2>
          <p>Se ha creado una cuenta para ti en el Sistema de Gestión Documental (SGD-Pola).</p>
          <p>A continuación tus datos de acceso:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Usuario:</strong> ${username}</p>
            <p style="margin: 5px 0;"><strong>Contraseña temporal:</strong> ${password}</p>
          </div>
          <p>Te recomendamos iniciar sesión y mantener tus credenciales en un lugar seguro.</p>
          
          <p>Puedes acceder ingresando al siguiente enlace: <a href="http://192.168.10.112/sgd" target="_blank" style="color: #b91c1c; font-weight: bold;">http://192.168.10.112/sgd</a></p>
          <p>A continuación tus datos de acceso provisionales:</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Este es un correo automático del sistema, por favor no respondas a este mensaje.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  }
};

module.exports = EmailService;