-- Run this in Supabase Dashboard > SQL Editor.
-- This schema stores only token/code hashes. Never expose a service_role key in website files.
create extension if not exists pgcrypto;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  guest_label text not null,
  token_hash text not null unique,
  code_hash text not null,
  guest_limit integer not null default 1 check (guest_limit > 0),
  code_used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;
revoke all on public.invitations from anon, authenticated;
grant execute on function public.redeem_invitation(text,text) to anon;

create or replace function public.redeem_invitation(p_token text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if p_token is null or p_code !~ '^[0-9]{6}$' then
    return jsonb_build_object('ok', false);
  end if;

  -- Atomic update: only one request can consume this code successfully.
  update public.invitations
     set code_used = true
   where token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and code_hash = encode(digest(p_code, 'sha256'), 'hex')
     and code_used = false
   returning id into v_id;

  if v_id is null then
    return jsonb_build_object('ok', false);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- IMPORTANT: Generate random tokens and 6-digit codes on a trusted admin machine,
-- then insert their SHA-256 hashes. Do not store raw codes in the public website.
-- This starter function intentionally returns no guest PII.
