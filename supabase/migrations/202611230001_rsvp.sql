-- Run once as postgres via Supabase SQL Editor (or supabase db reset).
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.organizers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table private.invitation_settings (
  id boolean primary key default true check (id),
  code_hash text -- NULL disables the optional shared invitation code.
);
insert into private.invitation_settings(id) values (true);
create table private.mutation_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_started_at timestamptz not null,
  attempts integer not null,
  primary key (user_id, action)
);
alter table private.organizers enable row level security;
alter table private.invitation_settings enable row level security;
alter table private.mutation_limits enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

create table public.guest_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 100),
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text check (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~ '^https://lh[0-9]+[.]googleusercontent[.]com/')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.guest_profiles(id) on delete cascade,
  attendance_status text not null check (attendance_status in ('going', 'maybe', 'not_going')),
  message text not null default '' check (char_length(message) <= 500),
  contribution text not null default '' check (contribution in ('', 'Gelo', 'Bebidas', 'Petiscos', 'Bola de vôlei', 'Cadeiras', 'Guarda-sol', 'Outro')),
  companions_count integer not null default 0 check (companions_count between 0 and 5),
  public_visibility_consent boolean not null default false,
  avatar_visibility_consent boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not avatar_visibility_consent or public_visibility_consent)
);
create index rsvps_public_going on public.rsvps(created_at) where attendance_status = 'going' and not hidden;
alter table public.guest_profiles enable row level security;
alter table public.rsvps enable row level security;

create function public.is_organizer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.organizers where user_id = (select auth.uid()));
$$;
revoke all on function public.is_organizer() from public, anon;
grant execute on function public.is_organizer() to authenticated;
create policy profiles_read_own_or_organizer on public.guest_profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_organizer()));
create policy rsvps_read_own_or_organizer on public.rsvps for select to authenticated
  using (guest_id = (select auth.uid()) or (select public.is_organizer()));
-- No client INSERT/UPDATE/DELETE policies or grants. All writes go through bounded RPCs.
revoke all on public.guest_profiles, public.rsvps from public, anon, authenticated;
grant select on public.guest_profiles, public.rsvps to authenticated;

create function private.consume_rate(p_user uuid, p_action text, p_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  insert into private.mutation_limits as limits(user_id, action, window_started_at, attempts)
  values (p_user, p_action, clock_timestamp(), 1)
  on conflict (user_id, action) do update set
    attempts = case when limits.window_started_at < clock_timestamp() - interval '1 minute' then 1 else least(limits.attempts + 1, p_limit + 1) end,
    window_started_at = case when limits.window_started_at < clock_timestamp() - interval '1 minute' then clock_timestamp() else limits.window_started_at end
  returning attempts into used;
  return used <= p_limit;
end;
$$;
revoke all on function private.consume_rate(uuid,text,integer) from public, anon, authenticated;

create function public.invitation_required() returns boolean
language sql stable security definer set search_path = '' as $$
  select code_hash is not null from private.invitation_settings where id;
$$;
revoke all on function public.invitation_required() from public;
grant execute on function public.invitation_required() to anon, authenticated;

create function public.save_rsvp(p_input jsonb, p_invite_code text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  invite_hash text;
  guest_name text;
  avatar text;
  response public.rsvps;
begin
  if caller is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  -- Atomic per-account limit across instances, including failed invite-code attempts.
  -- Return failures instead of raising, so the attempt counter commits.
  if not private.consume_rate(caller, 'rsvp', 10) then
    return jsonb_build_object('ok', false, 'code', 'rate_limited');
  end if;
  select code_hash into invite_hash from private.invitation_settings where id;
  if not exists(select 1 from public.rsvps where guest_id = caller) and invite_hash is not null then
    if p_invite_code is null or char_length(p_invite_code) > 128 or extensions.crypt(btrim(p_invite_code), invite_hash) is distinct from invite_hash then
      return jsonb_build_object('ok', false, 'code', 'invite_required');
    end if;
  end if;
  if coalesce(p_input is null or jsonb_typeof(p_input) <> 'object'
    or not (p_input ?& array['full_name','attendance_status','message','contribution','companions_count','public_visibility_consent','avatar_visibility_consent'])
    or jsonb_typeof(p_input->'full_name') <> 'string'
    or char_length(btrim(p_input->>'full_name')) not between 1 and 100
    or btrim(p_input->>'full_name') !~ '[^[:space:]]'
    or jsonb_typeof(p_input->'attendance_status') <> 'string'
    or p_input->>'attendance_status' not in ('going','maybe','not_going')
    or jsonb_typeof(p_input->'message') <> 'string' or char_length(p_input->>'message') > 500
    or jsonb_typeof(p_input->'contribution') <> 'string'
    or p_input->>'contribution' not in ('','Gelo','Bebidas','Petiscos','Bola de vôlei','Cadeiras','Guarda-sol','Outro')
    or jsonb_typeof(p_input->'companions_count') <> 'number' or (p_input->>'companions_count') !~ '^[0-5]$'
    or jsonb_typeof(p_input->'public_visibility_consent') <> 'boolean'
    or jsonb_typeof(p_input->'avatar_visibility_consent') <> 'boolean', true)
  then return jsonb_build_object('ok', false, 'code', 'invalid_input'); end if;
  if (p_input->>'avatar_visibility_consent')::boolean and not (p_input->>'public_visibility_consent')::boolean then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;
  guest_name := btrim(regexp_replace(p_input->>'full_name', '[[:space:]]+', ' ', 'g'));
  avatar := p_input->>'avatar_url';
  if char_length(avatar) > 2048 or avatar !~ '^https://lh[0-9]+[.]googleusercontent[.]com/' then avatar := null; end if;
  insert into public.guest_profiles(id, full_name, display_name, avatar_url)
  values (caller, guest_name, left(split_part(guest_name, ' ', 1), 40), avatar)
  on conflict(id) do update set full_name = excluded.full_name, display_name = excluded.display_name,
    avatar_url = excluded.avatar_url, updated_at = now();
  insert into public.rsvps(guest_id, attendance_status, message, contribution, companions_count, public_visibility_consent, avatar_visibility_consent)
  values(caller, p_input->>'attendance_status', btrim(p_input->>'message'), p_input->>'contribution',
    (p_input->>'companions_count')::integer, (p_input->>'public_visibility_consent')::boolean, (p_input->>'avatar_visibility_consent')::boolean)
  on conflict(guest_id) do update set attendance_status = excluded.attendance_status, message = excluded.message,
    contribution = excluded.contribution, companions_count = excluded.companions_count,
    public_visibility_consent = excluded.public_visibility_consent, avatar_visibility_consent = excluded.avatar_visibility_consent,
    updated_at = now()
  returning * into response;
  -- hidden is organizer-controlled and survives guest edits.
  return jsonb_build_object('ok', true, 'rsvp', to_jsonb(response));
end;
$$;
revoke all on function public.save_rsvp(jsonb,text) from public, anon;
grant execute on function public.save_rsvp(jsonb,text) to authenticated;

create function public.public_attendance() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'going', (select count(*) from public.rsvps where attendance_status = 'going' and not hidden),
    'maybe', (select count(*) from public.rsvps where attendance_status = 'maybe' and not hidden),
    'companions', (select coalesce(sum(companions_count),0) from public.rsvps where attendance_status = 'going' and not hidden),
    'guests', coalesce((select jsonb_agg(jsonb_build_object('display_name', names.display_name, 'avatar_url', names.avatar_url)) from (
      select p.display_name, case when r.avatar_visibility_consent then p.avatar_url else null end as avatar_url
      from public.rsvps r join public.guest_profiles p on p.id = r.guest_id
      where r.attendance_status = 'going' and r.public_visibility_consent and not r.hidden
      order by r.created_at limit 200
    ) names), '[]'::jsonb)
  );
$$;
revoke all on function public.public_attendance() from public;
grant execute on function public.public_attendance() to anon, authenticated;

create function public.moderate_rsvp(p_id uuid, p_hidden boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_organizer() then return jsonb_build_object('ok',false,'code','forbidden'); end if;
  if not private.consume_rate(auth.uid(), 'moderation', 30) then return jsonb_build_object('ok',false,'code','rate_limited'); end if;
  if p_hidden is null then return jsonb_build_object('ok',false,'code','invalid_input'); end if;
  update public.rsvps set hidden = p_hidden, updated_at = now() where id = p_id;
  return jsonb_build_object('ok', found);
end;
$$;
revoke all on function public.moderate_rsvp(uuid,boolean) from public, anon;
grant execute on function public.moderate_rsvp(uuid,boolean) to authenticated;
commit;
