import nodemailer from "nodemailer";

type MailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendMail({ to, subject, html, text }: MailArgs) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@twogathers.local";

  if (!transport) {
    // Fallback for local development when SMTP is not configured.
    console.log("[mail:dev-fallback]", { to, subject, text });
    return { sent: false as const };
  }

  await transport.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  return { sent: true as const };
}
