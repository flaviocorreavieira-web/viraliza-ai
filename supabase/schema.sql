-- ============================================================
-- Viraliza.AI — Schema (rode no SQL Editor do seu projeto Supabase)
-- ============================================================

-- Extensão para gerar UUIDs (já habilitada na maioria dos projetos)
create extension if not exists "pgcrypto";

-- Tabela de histórico de análises
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  platform text not null,
  platform_name text,
  platform_icon text,
  score int,
  analysis jsonb not null,
  date timestamptz not null default now()
);

-- Índice para leitura rápida do histórico por usuário (mais recentes primeiro)
create index if not exists history_user_date_idx
  on public.history (user_id, date desc);

-- ============================================================
-- Row Level Security: cada usuário só acessa o PRÓPRIO histórico
-- ============================================================
alter table public.history enable row level security;

drop policy if exists "history_select_own" on public.history;
create policy "history_select_own"
  on public.history for select
  using (auth.uid() = user_id);

drop policy if exists "history_insert_own" on public.history;
create policy "history_insert_own"
  on public.history for insert
  with check (auth.uid() = user_id);

drop policy if exists "history_update_own" on public.history;
create policy "history_update_own"
  on public.history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "history_delete_own" on public.history;
create policy "history_delete_own"
  on public.history for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Opcional: desabilitar confirmação de e-mail para login imediato.
-- Execute se quiser entrar logo após criar a conta (sem validar e-mail).
-- Caminho: Authentication -> Providers -> Email -> Confirm email = OFF
-- (Ou rode abaixo para desligar a exigência por padrão. Ajuste com cautela.)
-- ============================================================
-- update auth.users set email_confirmed_at = now() where email_confirmed_at is null;

-- Confirme na UI do Supabase: Authentication > Sign In / Providers > Email
-- a opção "Confirm email" geralmente vem LIGADA. Desligue para fluxo instantâneo,
-- ou use o link de confirmação enviado ao e-mail.