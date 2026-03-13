import { createTransport } from 'nodemailer';
import type { SendVerificationRequestParams } from 'next-auth/providers/email';
import { isDevAuthEnabled, normalizeMagicLinkEmail, saveDevMagicLink } from '@/lib/dev-magic-links';

const emailServerHost = process.env.EMAIL_SERVER_HOST;
const emailServerPort = process.env.EMAIL_SERVER_PORT;
const emailServerUser = process.env.EMAIL_SERVER_USER;
const emailServerPassword = process.env.EMAIL_SERVER_PASSWORD;

export const emailFrom = process.env.EMAIL_FROM || 'Eumigrei <no-reply@eumigrei.local>';

export const isEmailServerConfigured = Boolean(
  emailServerHost &&
    emailServerPort &&
    emailServerUser &&
    emailServerPassword &&
    process.env.EMAIL_FROM,
);

export const isEmailAuthConfigured = Boolean(
  process.env.NEXTAUTH_SECRET && (isEmailServerConfigured || isDevAuthEnabled),
);

export const emailProviderServer = {
  host: emailServerHost || 'localhost',
  port: Number(emailServerPort || 25),
  secure: Number(emailServerPort || 25) === 465,
  auth: {
    user: emailServerUser || '',
    pass: emailServerPassword || '',
  },
};

const buildMagicLinkEmailText = (url: string) =>
  [
    'Seu link de acesso para a Eumigrei',
    '',
    'Use o link abaixo para entrar na plataforma:',
    url,
    '',
    'Se voce nao solicitou esse acesso, ignore este email.',
  ].join('\n');

const buildMagicLinkEmailHtml = (url: string) => `
  <div style="background:#f6f8fc;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e5e7eb;">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#004691;font-weight:700;">
        Eumigrei
      </p>
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0f172a;">
        Seu link de acesso chegou
      </h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
        Clique no botao abaixo para entrar na plataforma com seguranca.
      </p>
      <a
        href="${url}"
        style="display:inline-block;background:#004691;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:16px;font-weight:700;"
      >
        Entrar na Eumigrei
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
        Se voce nao solicitou este acesso, pode ignorar este email com tranquilidade.
      </p>
    </div>
  </div>
`;

export const sendMagicLinkVerification = async ({
  identifier,
  url,
  expires,
}: SendVerificationRequestParams) => {
  const normalizedEmail = normalizeMagicLinkEmail(identifier);

  if (isEmailServerConfigured) {
    const transport = createTransport(emailProviderServer);
    const result = await transport.sendMail({
      to: normalizedEmail,
      from: emailFrom,
      subject: 'Seu link de acesso para a Eumigrei',
      text: buildMagicLinkEmailText(url),
      html: buildMagicLinkEmailHtml(url),
    });

    const failedRecipients = result.rejected.concat(result.pending).filter(Boolean);

    if (failedRecipients.length > 0) {
      throw new Error(`Nao foi possivel entregar o magic link para ${failedRecipients.join(', ')}`);
    }

    return;
  }

  if (isDevAuthEnabled) {
    saveDevMagicLink(normalizedEmail, url, expires);
    console.log(`[dev-auth] Magic link para ${normalizedEmail}: ${url}`);
    return;
  }

  throw new Error(
    'Autenticacao por email indisponivel. Configure SMTP ou habilite DEV_AUTH_ENABLED localmente.',
  );
};
