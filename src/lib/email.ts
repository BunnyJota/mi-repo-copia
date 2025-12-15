// /src/lib/email.ts
export async function sendEmail(payload: {
  to: string | string[]; subject: string; html?: string; text?: string;
}) {
  const r = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).error ?? 'Fallo al enviar');
  return r.json();
}