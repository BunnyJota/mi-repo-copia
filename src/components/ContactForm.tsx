// /src/components/ContactForm.tsx
import { useState } from 'react';
import { sendEmail } from '../lib/email';

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true); setStatus(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '');
    const message = String(fd.get('message') ?? '');

    try {
      await sendEmail({ to: 'tu-correo@ejemplo.com', subject: `Nuevo mensaje de ${email}`, text: message });
      setStatus('Enviado ✅'); e.currentTarget.reset();
    } catch (err: any) {
      setStatus(err?.message ?? 'Error al enviar');
    } finally { setSending(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="email" type="email" required className="border p-2 w-full" placeholder="Tu correo" />
      <textarea name="message" required className="border p-2 w-full" placeholder="Mensaje" />
      <button disabled={sending} className="border px-4 py-2">{sending ? 'Enviando…' : 'Enviar'}</button>
      {status && <p>{status}</p>}
    </form>
  );
}