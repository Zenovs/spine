import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@weinbotschaft.ch',
    to: email,
    subject: 'Dein Verifizierungscode für die Weinbotschaft',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Georgia, serif; background: #F2EBDC; margin: 0; padding: 40px 20px; }
          .card { max-width: 480px; margin: 0 auto; background: #FBF7EE; border: 1px solid #D9CDB1; padding: 48px 40px; }
          .logo { font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #857556; margin-bottom: 32px; }
          h1 { font-size: 28px; font-weight: 500; color: #1F1A12; margin: 0 0 16px; }
          p { font-size: 16px; color: #4A4032; line-height: 1.6; margin: 0 0 24px; }
          .code { font-family: monospace; font-size: 36px; letter-spacing: 0.22em; color: #6E2230; background: #E8DFC9; padding: 18px 24px; text-align: center; border: 1px solid #D9CDB1; }
          .note { font-size: 13px; color: #857556; margin-top: 24px; }
          .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #D9CDB1; font-size: 12px; color: #857556; letter-spacing: 0.08em; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">— Weinbotschaft —</div>
          <h1>Dein Code</h1>
          <p>Gib diesen Code ein, um deine E-Mail-Adresse zu bestätigen und deine persönliche Botschaft zu hinterlassen.</p>
          <div class="code">${code}</div>
          <p class="note">Der Code ist 15 Minuten gültig. Falls du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.</p>
          <div class="footer">Weinbotschaft · QR-Erlebnisse für besondere Flaschen</div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) throw new Error(error.message);
}
