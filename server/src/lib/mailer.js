// Sends transactional email via Resend (https://resend.com). Kept in this one file so
// swapping providers later (SMTP, SendGrid, ...) means editing only `sendPasswordResetEmail`
// below, not the route that calls it.
//
// Without RESEND_API_KEY set, nothing is actually sent — the reset link is logged to the
// server console instead, so local dev and a fresh deploy don't need a real email account to
// exercise the flow. Same fallback shape as ANTHROPIC_API_KEY (see chat.js): the rest of the
// app, including this route, still works without it.
let resendClient
let resendInitAttempted = false

async function getResendClient() {
  if (resendInitAttempted) return resendClient
  resendInitAttempted = true
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return undefined
  const { Resend } = await import('resend')
  resendClient = new Resend(apiKey)
  return resendClient
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const client = await getResendClient()
  if (!client) {
    console.log(
      `[mailer] RESEND_API_KEY no está definida — no se envió ningún email. ` +
        `Enlace de recuperación para ${to}: ${resetUrl}`,
    )
    return
  }

  const from = process.env.RESEND_FROM || 'Cogitador Consulta <onboarding@resend.dev>'
  const { error } = await client.emails.send({
    from,
    to,
    subject: 'Recuperar contraseña — Cogitador de Consulta',
    html: `
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p><a href="${resetUrl}">Hacé clic acá para elegir una nueva contraseña</a>.</p>
      <p>Si no pediste esto, podés ignorar este correo — tu contraseña no cambia sola.</p>
      <p>Este enlace expira en 1 hora.</p>
    `,
  })
  if (error) {
    // Logged, not thrown: the route responds the same generic "revisá tu email" message
    // whether or not sending actually succeeded, so a delivery failure here shouldn't 500
    // the request or leak provider details to the client.
    console.error('[mailer] Error enviando email de recuperación vía Resend:', error)
  }
}
