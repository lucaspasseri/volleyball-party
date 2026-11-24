\set ON_ERROR_STOP on
begin;
insert into pesca.guest_profiles(id,full_name,display_name) values ('guest-a','Maria Silva','Maria'), ('guest-b','Elisa','Elisa');
insert into pesca.rsvps(guest_id,attendance_status,message,public_visibility_consent)
values ('guest-a','going','privado',true);

set local role pesca_runtime;
select set_config('pesca.test_subject','guest-a',true);
do $$ begin
  if pesca.save_beach_sticker(nullif(current_setting('pesca.test_subject'), ''), 'coco','quadras',.3,.4)->>'ok' <> 'true' then raise exception 'Save failed'; end if;
  if pesca.save_beach_sticker('guest-a', 'crawl','mar',.35,.15)->>'ok' <> 'true'
    or pesca.save_beach_sticker('guest-a', 'dj-do-isopor','coolers',.86,.49)->>'ok' <> 'true'
    or pesca.save_beach_sticker('guest-a', 'hinata','quadras',.31,.46)->>'ok' <> 'true'
    or pesca.save_beach_sticker('guest-a', 'sonic','beira-mar',.32,.61)->>'ok' <> 'true'
    or pesca.save_beach_sticker('guest-a', 'calcadao','calcadao',.2,.91)->>'ok' <> 'true'
    then raise exception 'New placement rejected'; end if;
  if pesca.save_beach_sticker(nullif(current_setting('pesca.test_subject'), ''), 'gaivota','cadeiras',.87,.75)->>'ok' <> 'true' then raise exception 'Reposition failed'; end if;
  if jsonb_array_length(pesca.beach_scene('guest-a')) <> 1 then raise exception 'Duplicate'; end if;
  if pesca.save_beach_sticker(nullif(current_setting('pesca.test_subject'), ''), 'gaivota','cadeiras',2,.5)->>'ok' <> 'false'
    or pesca.save_beach_sticker(nullif(current_setting('pesca.test_subject'), ''), 'https://example.org','quadras',.3,.4)->>'ok' <> 'false'
    then raise exception 'Invalid placement accepted'; end if;
end $$;

select set_config('pesca.test_subject','guest-b',true);
do $$ begin
  if pesca.save_beach_sticker(nullif(current_setting('pesca.test_subject'), ''), 'coco','quadras',.3,.4)->>'code' <> 'ineligible' then raise exception 'Missing RSVP allowed'; end if;
  begin perform * from pesca.sticker_placements; raise exception 'Direct read allowed'; exception when insufficient_privilege then null; end;
  begin update pesca.sticker_placements set x=.5; raise exception 'Direct edit allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into pesca.rsvps(guest_id,attendance_status) values ('guest-b','going');
set local role pesca_runtime;
do $$ begin
  perform pesca.save_beach_sticker(nullif(current_setting('pesca.test_subject'), ''), 'surfista','gazebo',.7,.4);
  if jsonb_array_length(pesca.beach_scene(nullif(current_setting('pesca.test_subject'), ''))) <> 2 then raise exception 'Missing private owner view'; end if;
end $$;
reset role;
select set_config('pesca.test_subject','',true);
set local role pesca_runtime;
do $$ declare record jsonb := pesca.beach_scene(nullif(current_setting('pesca.test_subject'), ''))->0; begin
  if jsonb_array_length(pesca.beach_scene(nullif(current_setting('pesca.test_subject'), ''))) <> 1 or record - 'id' <> '{"name":"Maria","x":0.87,"y":0.75,"zone_id":"cadeiras","sticker_id":"gaivota","mine":false,"shared":true}'::jsonb
    then raise exception 'Public projection/ownership failure'; end if;
  if pesca.save_beach_sticker(null, 'coco','quadras',.3,.4)->>'code' <> 'ineligible' then raise exception 'Anonymous write allowed'; end if;
end $$;
reset role;
do $$ declare status text; begin
  foreach status in array array['maybe','not_going'] loop
    update pesca.rsvps set attendance_status=status where public_visibility_consent;
    if pesca.beach_scene(nullif(current_setting('pesca.test_subject'), '')) <> '[]'::jsonb then raise exception 'RSVP visibility failure'; end if;
  end loop;
  update pesca.rsvps set attendance_status='going',hidden=true where public_visibility_consent;
  if pesca.beach_scene(nullif(current_setting('pesca.test_subject'), '')) <> '[]'::jsonb then raise exception 'Moderation failure'; end if;
  perform set_config('pesca.test_subject','guest-a',true);
  if pesca.save_beach_sticker(nullif(current_setting('pesca.test_subject'), ''), 'coco','quadras',.3,.4)->>'code' <> 'ineligible' then raise exception 'Moderated owner saved'; end if;
  update pesca.rsvps set hidden=false where public_visibility_consent;
  if pesca.beach_scene(nullif(current_setting('pesca.test_subject'), ''))->0->>'sticker_id' <> 'gaivota' then raise exception 'Restore failure'; end if;
  perform set_config('pesca.test_subject','',true);
  update pesca.rsvps set public_visibility_consent=false;
  if pesca.beach_scene(nullif(current_setting('pesca.test_subject'), '')) <> '[]'::jsonb then raise exception 'Consent withdrawal failure'; end if;
end $$;
rollback;
\echo 'Beach database assertions passed.'
