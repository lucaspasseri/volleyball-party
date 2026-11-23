\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222'),('33333333-3333-4333-8333-333333333333');
insert into private.organizers values ('33333333-3333-4333-8333-333333333333');
update private.invitation_settings set code_hash = extensions.crypt('sol-secreto', extensions.gen_salt('bf'));

set local role anon;
do $$ begin
  if public.public_attendance()->>'going' <> '0' then raise exception 'Bad initial count'; end if;
  if not public.invitation_required() then raise exception 'Invite should be required'; end if;
  begin perform * from public.rsvps; raise exception 'Anon read allowed'; exception when insufficient_privilege then null; end;
  begin perform public.save_rsvp('{}', ''); raise exception 'Anon write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ declare result jsonb; data jsonb := '{"full_name":"Maria Silva","attendance_status":"going","message":"Mensagem privada","contribution":"Gelo","companions_count":2,"public_visibility_consent":true,"avatar_visibility_consent":false,"avatar_url":"https://lh3.googleusercontent.com/photo"}'; first_id text; begin
  result := public.save_rsvp(data, 'errado');
  if result->>'code' <> 'invite_required' then raise exception 'Wrong invite accepted'; end if;
  result := public.save_rsvp(data, 'sol-secreto');
  if result->>'ok' <> 'true' then raise exception 'Save failed: %', result; end if;
  first_id := result->'rsvp'->>'id';
  result := public.save_rsvp(data || '{"guest_id":"22222222-2222-4222-8222-222222222222"}', '');
  if result->'rsvp'->>'id' <> first_id then raise exception 'Duplicate row'; end if;
  if result->'rsvp'->>'guest_id' <> auth.uid()::text then raise exception 'Forged ownership'; end if;
  if (select count(*) from public.rsvps) <> 1 then raise exception 'Duplicate RSVP'; end if;
  if public.public_attendance()->>'going' <> '1' or public.public_attendance()->>'companions' <> '2' then raise exception 'Counts incorrect'; end if;
  if public.public_attendance()->'guests'->0 <> '{"display_name":"Maria","avatar_url":null}'::jsonb then raise exception 'Private fields leaked'; end if;
  result := public.save_rsvp(data || '{"attendance_status":"maybe"}', '');
  if public.public_attendance()->>'going' <> '0' or public.public_attendance()->>'maybe' <> '1' or jsonb_array_length(public.public_attendance()->'guests') <> 0 then raise exception 'Maybe left public'; end if;
  perform public.save_rsvp(data || '{"public_visibility_consent":false}', '');
  if public.public_attendance()->>'going' <> '1' or jsonb_array_length(public.public_attendance()->'guests') <> 0 then raise exception 'Private RSVP miscounted or exposed'; end if;
  perform public.save_rsvp(data || '{"avatar_visibility_consent":true}', '');
  if public.public_attendance()->'guests'->0->>'avatar_url' is null then raise exception 'Consented avatar missing'; end if;
  result := public.save_rsvp(data || '{"companions_count":9}', '');
  if result->>'code' <> 'invalid_input' then raise exception 'Invalid companions accepted'; end if;
  result := public.save_rsvp(data || '{"message":null}', '');
  if result->>'code' <> 'invalid_input' then raise exception 'Null message accepted'; end if;
  result := public.save_rsvp(data || '{"full_name":"   "}', '');
  if result->>'code' <> 'invalid_input' then raise exception 'Empty name accepted'; end if;
  result := public.save_rsvp(data, ''); -- tenth request succeeds
  result := public.save_rsvp(data, '');
  if result->>'code' <> 'rate_limited' then raise exception 'Rate limiting failed'; end if;
  begin update public.rsvps set hidden = false; raise exception 'Direct write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ declare result jsonb; begin
  if (select count(*) from public.rsvps) <> 0 or (select count(*) from public.guest_profiles) <> 0 then raise exception 'Other user private data exposed'; end if;
  if public.is_organizer() then raise exception 'Organizer spoofed'; end if;
  result := public.moderate_rsvp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
  if result->>'code' <> 'forbidden' then raise exception 'Non-organizer moderated'; end if;
  for i in 1..10 loop
    result := public.save_rsvp('{}','wrong');
    if result->>'code' <> 'invite_required' then raise exception 'Wrong invite not recorded'; end if;
  end loop;
  if public.save_rsvp('{}','sol-secreto')->>'code' <> 'rate_limited' then raise exception 'Failed invite attempts bypass rate limit'; end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ declare target uuid; begin
  if not public.is_organizer() or (select count(*) from public.rsvps) <> 1 then raise exception 'Organizer cannot read'; end if;
  select id into target from public.rsvps limit 1;
  if public.moderate_rsvp(target, true)->>'ok' <> 'true' then raise exception 'Moderation failed'; end if;
  if public.public_attendance()->>'going' <> '0' or jsonb_array_length(public.public_attendance()->'guests') <> 0 then raise exception 'Hidden RSVP counted'; end if;
end $$;
reset role;
update private.mutation_limits set window_started_at = now() - interval '2 minutes';
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ declare result jsonb; begin
  result := public.save_rsvp('{"full_name":"Maria","attendance_status":"going","message":"","contribution":"","companions_count":0,"public_visibility_consent":true,"avatar_visibility_consent":false}', '');
  if result->>'ok' <> 'true' or result->'rsvp'->>'hidden' <> 'true' then raise exception 'Guest edit cleared moderation'; end if;
  if public.public_attendance()->>'going' <> '0' then raise exception 'Hidden guest reappeared'; end if;
  perform public.save_rsvp('{"full_name":"Maria","attendance_status":"not_going","message":"","contribution":"","companions_count":0,"public_visibility_consent":true,"avatar_visibility_consent":false}', '');
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ declare target uuid; begin
  select id into target from public.rsvps limit 1;
  perform public.moderate_rsvp(target, false);
  if public.public_attendance()->>'going' <> '0' or public.public_attendance()->>'maybe' <> '0' or jsonb_array_length(public.public_attendance()->'guests') <> 0 then raise exception 'Not-going guest exposed'; end if;
end $$;
reset role;
rollback;
\echo 'RSVP database assertions passed (rolled back test data).'
