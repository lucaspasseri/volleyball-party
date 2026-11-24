create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema pesca;
revoke all on schema pesca from public;

create table pesca.organizers (
  user_id text primary key
);
create table pesca.invitation_settings (
  id boolean primary key default true check (id),
  code_hash text -- NULL disables the optional shared invitation code.
);
insert into pesca.invitation_settings(id) values (true);
create table pesca.mutation_limits (
  user_id text not null,
  action text not null,
  window_started_at timestamptz not null,
  attempts integer not null,
  primary key (user_id, action)
);


create table pesca.guest_profiles (
  id text primary key,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 100),
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text check (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~ '^https://lh[0-9]+[.]googleusercontent[.]com/')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table pesca.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null unique references pesca.guest_profiles(id) on delete cascade,
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
create index rsvps_public_going on pesca.rsvps(created_at) where attendance_status = 'going' and not hidden;
-- The runtime role can call the granted functions only. The verified Neon
-- subject is passed by the Next.js server as a parameter on each call.
create function pesca.is_organizer(p_actor text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from pesca.organizers where user_id = p_actor);
$$;

create function pesca.guest_response(p_actor text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'rsvp', to_jsonb(r),
    'profile', jsonb_build_object('full_name', p.full_name, 'display_name', p.display_name, 'avatar_url', p.avatar_url)
  )
  from pesca.rsvps r join pesca.guest_profiles p on p.id = r.guest_id
  where r.guest_id = p_actor;
$$;

create function pesca.organizer_rows(p_actor text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when pesca.is_organizer(p_actor) then coalesce(
    (select jsonb_agg(to_jsonb(r) || jsonb_build_object('guest_profiles', jsonb_build_object('full_name', p.full_name))
      order by r.created_at, r.id)
     from pesca.rsvps r join pesca.guest_profiles p on p.id = r.guest_id), '[]'::jsonb)
  end;
$$;

create function pesca.consume_rate(p_user text, p_action text, p_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  insert into pesca.mutation_limits as limits(user_id, action, window_started_at, attempts)
  values (p_user, p_action, clock_timestamp(), 1)
  on conflict (user_id, action) do update set
    attempts = case when limits.window_started_at < clock_timestamp() - interval '1 minute' then 1 else least(limits.attempts + 1, p_limit + 1) end,
    window_started_at = case when limits.window_started_at < clock_timestamp() - interval '1 minute' then clock_timestamp() else limits.window_started_at end
  returning attempts into used;
  return used <= p_limit;
end;
$$;

create function pesca.invitation_required() returns boolean
language sql stable security definer set search_path = '' as $$
  select code_hash is not null from pesca.invitation_settings where id;
$$;

create function pesca.save_rsvp(p_actor text, p_input jsonb, p_invite_code text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  caller text := nullif(p_actor, '');
  invite_hash text;
  guest_name text;
  avatar text;
  response pesca.rsvps;
begin
  if caller is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  -- Atomic per-account limit across instances, including failed invite-code attempts.
  -- Return failures instead of raising, so the attempt counter commits.
  if not pesca.consume_rate(caller, 'rsvp', 10) then
    return jsonb_build_object('ok', false, 'code', 'rate_limited');
  end if;
  select code_hash into invite_hash from pesca.invitation_settings where id;
  if not exists(select 1 from pesca.rsvps where guest_id = caller) and invite_hash is not null then
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
  insert into pesca.guest_profiles(id, full_name, display_name, avatar_url)
  values (caller, guest_name, left(split_part(guest_name, ' ', 1), 40), avatar)
  on conflict(id) do update set full_name = excluded.full_name, display_name = excluded.display_name,
    avatar_url = excluded.avatar_url, updated_at = now();
  insert into pesca.rsvps(guest_id, attendance_status, message, contribution, companions_count, public_visibility_consent, avatar_visibility_consent)
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

create function pesca.public_attendance() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'going', (select count(*) from pesca.rsvps where attendance_status = 'going' and not hidden),
    'maybe', (select count(*) from pesca.rsvps where attendance_status = 'maybe' and not hidden),
    'companions', (select coalesce(sum(companions_count),0) from pesca.rsvps where attendance_status = 'going' and not hidden),
    'guests', coalesce((select jsonb_agg(jsonb_build_object('display_name', names.display_name, 'avatar_url', names.avatar_url)) from (
      select p.display_name, case when r.avatar_visibility_consent then p.avatar_url else null end as avatar_url
      from pesca.rsvps r join pesca.guest_profiles p on p.id = r.guest_id
      where r.attendance_status = 'going' and r.public_visibility_consent and not r.hidden
      order by r.created_at limit 200
    ) names), '[]'::jsonb)
  );
$$;

create function pesca.moderate_rsvp(p_actor text, p_id uuid, p_hidden boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not pesca.is_organizer(p_actor) then return jsonb_build_object('ok',false,'code','forbidden'); end if;
  if not pesca.consume_rate(p_actor, 'moderation', 30) then return jsonb_build_object('ok',false,'code','rate_limited'); end if;
  if p_hidden is null then return jsonb_build_object('ok',false,'code','invalid_input'); end if;
  update pesca.rsvps set hidden = p_hidden, updated_at = now() where id = p_id;
  return jsonb_build_object('ok', found);
end;
$$;
create table pesca.sticker_placements (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null references pesca.rsvps(guest_id) on delete cascade,
  scene_id text not null default 'copacabana' check (scene_id = 'copacabana'),
  sticker_id text not null check (sticker_id in ('levantadora','foguete','paredao','salva-vidas','surfista','capivara','siri','coco','gaivota','capita','soneca','mergulho')),
  zone_id text not null check (zone_id in ('quadras','gazebo','coolers','cadeiras','torcida','beira-mar')),
  x numeric not null check (x between 0.03 and 0.97),
  y numeric not null check (y between 0.045 and 0.955),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guest_id, scene_id)
);
create function pesca.save_beach_sticker(p_actor text, p_sticker text, p_zone text, p_x numeric, p_y numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare caller text := nullif(p_actor, '');
begin
  -- Serialize against RSVP status, consent and moderation updates.
  perform 1 from pesca.rsvps where guest_id = caller and attendance_status = 'going' and not hidden for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'ineligible'); end if;
  if not pesca.consume_rate(caller, 'sticker', 20) then
    return jsonb_build_object('ok', false, 'code', 'rate_limited');
  end if;
  begin
    insert into pesca.sticker_placements(guest_id, sticker_id, zone_id, x, y)
      values(caller, p_sticker, p_zone, p_x, p_y)
      on conflict(guest_id, scene_id) do update set sticker_id = excluded.sticker_id,
        zone_id = excluded.zone_id, x = excluded.x, y = excluded.y, updated_at = now();
    return jsonb_build_object('ok', true);
  exception when check_violation or not_null_violation then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end;
end;
$$;

create function pesca.beach_scene(p_actor text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'sticker_id', s.sticker_id, 'zone_id', s.zone_id, 'x', s.x, 'y', s.y,
    'name', p.display_name, 'mine', s.guest_id is not distinct from p_actor,
    'shared', r.public_visibility_consent
  ) order by s.created_at, s.id), '[]'::jsonb)
  from pesca.sticker_placements s
  join pesca.rsvps r on r.guest_id = s.guest_id
  join pesca.guest_profiles p on p.id = s.guest_id
  where s.scene_id = 'copacabana' and r.attendance_status = 'going' and not r.hidden
    and (r.public_visibility_consent or s.guest_id = p_actor);
$$;
-- The separate login role must exist before initialization.
revoke all on all tables in schema pesca from public, pesca_runtime;
revoke all on all functions in schema pesca from public, pesca_runtime;
grant usage on schema pesca to pesca_runtime;
grant execute on function
  pesca.guest_response(text), pesca.is_organizer(text), pesca.organizer_rows(text),
  pesca.invitation_required(), pesca.public_attendance(),
  pesca.save_rsvp(text,jsonb,text), pesca.moderate_rsvp(text,uuid,boolean),
  pesca.save_beach_sticker(text,text,text,numeric,numeric), pesca.beach_scene(text)
to pesca_runtime;
