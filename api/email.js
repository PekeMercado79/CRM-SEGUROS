const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://crm-seguros.vercel.app";

export default async function handler(req, res) {
  // CORS restringido al dominio propio
  const origin = req.headers.origin || "";
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Faltan campos: to, subject, html" });
  }

  // SEGURIDAD: credenciales SMTP SIEMPRE desde variables de entorno del servidor
  // Nunca aceptar smtp del cliente — evita exposición de contraseñas en tránsito
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || "465";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFromName = process.env.SMTP_FROM_NAME || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(500).json({ error: "Configuración SMTP no definida en el servidor. Agrega SMTP_HOST, SMTP_USER y SMTP_PASS en las variables de entorno de Vercel." });
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
