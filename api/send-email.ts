// /api/send-email.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const { to, subject, html, text } = body;
    if (!to || !subject || (!html && !text)) return res.status(400).json({ error: 'Campos inválidos' });

    // Usa un remitente verificado en Resend (dominio o correo verificado)
    const from = process.env.RESEND_FROM || 'no-reply@tudominio.com';
    const { data, error } = await resend.emails.send({ from, to, subject, html, text });
    if (error) return res.status(502).json({ error: 'Resend rechazó la solicitud' });
    return res.status(200).json({ ok: true, id: data?.id ?? null });
  } catch {
    return res.status(500).json({ error: 'Error interno al enviar' });
  }
}