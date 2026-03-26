export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, nombre, password } = req.body

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REACT_APP_RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'SeguCore <onboarding@resend.dev>',
      to: email,
      subject: 'Bienvenido a SeguCore — Tus accesos',
      html: `
        <h2>¡Bienvenido a SeguCore, ${nombre}!</h2>
        <p>Tu cuenta ha sido creada. Aquí están tus accesos:</p>
        <p><strong>URL:</strong> https://crm-seguros.vercel.app</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Contraseña temporal:</strong> ${password}</p>
        <p>Te recomendamos cambiar tu contraseña al entrar por primera vez.</p>
        <br/>
        <p>— Memo | SeguCore</p>
      `
    })
  })

  const data = await response.json()
  if (!response.ok) return res.status(400).json(data)
  return res.status(200).json({ ok: true })
}
