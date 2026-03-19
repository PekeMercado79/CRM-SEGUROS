const nodemailer = require("nodemailer");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, html, smtp } = req.body;

  if (!to || !subject || !html || !smtp) {
    return res.status(400).json({ error: "Faltan campos requeridos: to, subject, html, smtp" });
  }

  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName } = smtp;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(400).json({ error: "Configuracion SMTP incompleta. Verifica host, usuario y contrasena." });
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: parseInt(smtpPort) || 587,
      secure: parseInt(smtpPort) === 465, // true para puerto 465 (SSL), false para 587 (TLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false, // necesario para algunos hostings compartidos como Hostgator
      },
    });

    const info = await transporter.sendMail({
      from: `"${smtpFromName || smtpUser}" <${smtpUser}>`,
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error("Error SMTP:", error.message);
    return res.status(500).json({
      error: "Error al enviar correo",
      detalle: error.message,
    });
  }
}
