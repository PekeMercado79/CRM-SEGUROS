export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, subject, html, smtp } = req.body;

  if (!to || !subject || !html || !smtp) {
    return res.status(400).json({ error: "Faltan campos: to, subject, html, smtp" });
  }

  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName } = smtp;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(400).json({ error: "Configuracion SMTP incompleta" });
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort) || 465,
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
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
    console.error("Email error:", error.message);
    return res.status(500).json({ error: "Error al enviar", detalle: error.message });
  }
}
