-- ============================================
-- NOTIFICATIONS: Tabla para historial en header
-- ============================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  barbershop_id uuid not null,
  appointment_id uuid null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Relaciones
alter table public.notifications
  add constraint notifications_barbershop_id_fkey
  foreign key (barbershop_id) references public.barbershops(id) on delete cascade;

alter table public.notifications
  add constraint notifications_appointment_id_fkey
  foreign key (appointment_id) references public.appointments(id) on delete set null;

-- Índices para consultas rápidas
create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

-- Políticas RLS
create policy "Users can read own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on public.notifications
  for insert
  with check (auth.role() = 'service_role');
