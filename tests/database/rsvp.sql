\set ON_ERROR_STOP on
begin;
insert into pesca.organizers values ('organizer');
update pesca.invitation_settings set code_hash = extensions.crypt('sol-secreto', extensions.gen_salt('bf'));

set local role pesca_untrusted;
do $$ begin
  begin perform pesca.public_attendance(); raise exception 'Untrusted role called function'; exception when insufficient_privilege then null; end;
  begin perform * from pesca.rsvps; raise exception 'Anon read allowed'; exception when insufficient_privilege then null; end;
  begin perform pesca.save_rsvp(null,'{}', ''); raise exception 'Anon write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role pesca_runtime;
select set_config('pesca.test_subject','guest-a',true);
do $$ declare result jsonb; data jsonb := '{"full_name":"Maria Silva","attendance_status":"going","message":"Mensagem privada","contribution":"Gelo","companions_count":2,"public_visibility_consent":true,"avatar_visibility_consent":false,"avatar_url":"https://lh3.googleusercontent.com/photo"}'; first_id text; begin
  if not pesca.invitation_required() then raise exception 'Invite should be required'; end if;
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data, 'errado');
  if result->>'code' <> 'invite_required' then raise exception 'Wrong invite accepted'; end if;
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data, 'sol-secreto');
  if result->>'ok' <> 'true' then raise exception 'Save failed: %', result; end if;
  first_id := result->'rsvp'->>'id';
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data || '{"guest_id":"guest-b"}', '');
  if result->'rsvp'->>'id' <> first_id then raise exception 'Duplicate row'; end if;
  if result->'rsvp'->>'guest_id' <> current_setting('pesca.test_subject') then raise exception 'Forged ownership'; end if;
  if pesca.guest_response('guest-a')->'rsvp'->>'id' <> first_id then raise exception 'Duplicate RSVP'; end if;
  if pesca.public_attendance()->>'going' <> '1' or pesca.public_attendance()->>'companions' <> '2' then raise exception 'Counts incorrect'; end if;
  if pesca.public_attendance()->'guests'->0 <> '{"display_name":"Maria","avatar_url":null}'::jsonb then raise exception 'Private fields leaked'; end if;
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data || '{"attendance_status":"maybe"}', '');
  if pesca.public_attendance()->>'going' <> '0' or pesca.public_attendance()->>'maybe' <> '1' or jsonb_array_length(pesca.public_attendance()->'guests') <> 0 then raise exception 'Maybe left public'; end if;
  perform pesca.save_rsvp(current_setting('pesca.test_subject'), data || '{"public_visibility_consent":false}', '');
  if pesca.public_attendance()->>'going' <> '1' or jsonb_array_length(pesca.public_attendance()->'guests') <> 0 then raise exception 'Private RSVP miscounted or exposed'; end if;
  perform pesca.save_rsvp(current_setting('pesca.test_subject'), data || '{"avatar_visibility_consent":true}', '');
  if pesca.public_attendance()->'guests'->0->>'avatar_url' is null then raise exception 'Consented avatar missing'; end if;
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data || '{"companions_count":9}', '');
  if result->>'code' <> 'invalid_input' then raise exception 'Invalid companions accepted'; end if;
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data || '{"message":null}', '');
  if result->>'code' <> 'invalid_input' then raise exception 'Null message accepted'; end if;
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data || '{"full_name":"   "}', '');
  if result->>'code' <> 'invalid_input' then raise exception 'Empty name accepted'; end if;
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data, ''); -- tenth request succeeds
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), data, '');
  if result->>'code' <> 'rate_limited' then raise exception 'Rate limiting failed'; end if;
  begin update pesca.rsvps set hidden = false; raise exception 'Direct write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role pesca_runtime;
select set_config('pesca.test_subject','guest-b',true);
do $$ declare result jsonb; begin
  if pesca.guest_response('guest-b') is not null or pesca.organizer_rows('guest-b') is not null then raise exception 'Other user private data exposed'; end if;
  if pesca.is_organizer(current_setting('pesca.test_subject')) then raise exception 'Organizer spoofed'; end if;
  result := pesca.moderate_rsvp(current_setting('pesca.test_subject'), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
  if result->>'code' <> 'forbidden' then raise exception 'Non-organizer moderated'; end if;
  for i in 1..10 loop
    result := pesca.save_rsvp(current_setting('pesca.test_subject'), '{}','wrong');
    if result->>'code' <> 'invite_required' then raise exception 'Wrong invite not recorded'; end if;
  end loop;
  if pesca.save_rsvp(current_setting('pesca.test_subject'), '{}','sol-secreto')->>'code' <> 'rate_limited' then raise exception 'Failed invite attempts bypass rate limit'; end if;
end $$;
reset role;

set local role pesca_runtime;
select set_config('pesca.test_subject','organizer',true);
do $$ declare target uuid; begin
  if not pesca.is_organizer(current_setting('pesca.test_subject')) or jsonb_array_length(pesca.organizer_rows('organizer')) <> 1 then raise exception 'Organizer cannot read'; end if;
  target := (pesca.organizer_rows('organizer')->0->>'id')::uuid;
  if pesca.moderate_rsvp(current_setting('pesca.test_subject'), target, true)->>'ok' <> 'true' then raise exception 'Moderation failed'; end if;
  if pesca.public_attendance()->>'going' <> '0' or jsonb_array_length(pesca.public_attendance()->'guests') <> 0 then raise exception 'Hidden RSVP counted'; end if;
end $$;
reset role;
update pesca.mutation_limits set window_started_at = now() - interval '2 minutes';
set local role pesca_runtime;
select set_config('pesca.test_subject','guest-a',true);
do $$ declare result jsonb; begin
  result := pesca.save_rsvp(current_setting('pesca.test_subject'), '{"full_name":"Maria","attendance_status":"going","message":"","contribution":"","companions_count":0,"public_visibility_consent":true,"avatar_visibility_consent":false}', '');
  if result->>'ok' <> 'true' or result->'rsvp'->>'hidden' <> 'true' then raise exception 'Guest edit cleared moderation'; end if;
  if pesca.public_attendance()->>'going' <> '0' then raise exception 'Hidden guest reappeared'; end if;
  perform pesca.save_rsvp(current_setting('pesca.test_subject'), '{"full_name":"Maria","attendance_status":"not_going","message":"","contribution":"","companions_count":0,"public_visibility_consent":true,"avatar_visibility_consent":false}', '');
end $$;
reset role;
set local role pesca_runtime;
select set_config('pesca.test_subject','organizer',true);
do $$ declare target uuid; begin
  target := (pesca.organizer_rows('organizer')->0->>'id')::uuid;
  perform pesca.moderate_rsvp(current_setting('pesca.test_subject'), target, false);
  if pesca.public_attendance()->>'going' <> '0' or pesca.public_attendance()->>'maybe' <> '0' or jsonb_array_length(pesca.public_attendance()->'guests') <> 0 then raise exception 'Not-going guest exposed'; end if;
end $$;
reset role;
rollback;
\echo 'RSVP database assertions passed (rolled back test data).'
