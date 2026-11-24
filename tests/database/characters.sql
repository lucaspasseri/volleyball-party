begin;
insert into pesca.guest_profiles(id,full_name,display_name) values ('a','A','A'),('b','B','B');
insert into pesca.rsvps(guest_id,attendance_status,public_visibility_consent) values ('a','going',true),('b','going',true);
set local role pesca_runtime;
do $$
declare
  photo uuid := pesca.store_character_photo('a','test'::bytea,1,null);
  crop jsonb := '{"zoom":1.4,"x":0.2,"y":0,"rotation":-8}';
  replacement uuid;
begin
  if photo is null or pesca.read_character_photo(null,photo) is not null or pesca.read_character_photo('b',photo) is not null
    then raise exception 'Private acquisition leaked'; end if;
  if pesca.write_beach_placement('a','meu-capita','quadras',.3,.5,photo,crop,false)->>'ok' <> 'false'
    or pesca.write_beach_placement('b','meu-capita','quadras',.3,.5,photo,crop,true)->>'ok' <> 'false'
    or pesca.write_beach_placement('a','meu-inventado','quadras',.3,.5,photo,crop,true)->>'ok' <> 'false'
    or pesca.write_beach_placement('a','meu-capita','quadras',.3,.5,photo,crop || '{"zoom":15}',true)->>'ok' <> 'false'
    then raise exception 'Invalid publication accepted'; end if;
  if pesca.save_beach_sticker('a','meu-capita','quadras',.3,.5)->>'ok' <> 'false' then raise exception 'Missing photo accepted'; end if;
  perform pesca.write_beach_placement('a','meu-capita','quadras',.3,.5,photo,crop,true);
  if pesca.character_beach_scene(null)->0->'character' is distinct from jsonb_build_object('photoId',photo,'aspect',1,'face',crop)
    or pesca.read_character_photo(null,photo) is distinct from 'test'::bytea then raise exception 'Publication failed'; end if;
  if pesca.beach_scene(null) <> '[]'::jsonb then raise exception 'Legacy projection leaked character'; end if;
  if pesca.remove_character_photo('b',photo) then raise exception 'Cross-owner removal'; end if;
  perform pesca.save_beach_sticker('a','coco','quadras',.4,.4);
  if pesca.read_character_photo(null,photo) is not null or pesca.character_beach_scene(null)->0 ? 'character' then raise exception 'Conventional replacement failed'; end if;
  if pesca.store_character_photo('a','stale',1,null) is not null then raise exception 'Stale replacement accepted'; end if;
  replacement := pesca.store_character_photo('a','new',1,photo);
  if replacement is null or pesca.read_character_photo('a',photo) is not null or jsonb_array_length(pesca.character_beach_scene(null)) <> 1
    then raise exception 'Replacement removed conventional sticker or retained old asset'; end if;
  perform pesca.write_beach_placement('a','meu-crawl','mar',.3,.18,replacement,crop,true);
  if not pesca.remove_character_photo('a',replacement) then raise exception 'Owner removal rejected'; end if;
  if pesca.character_beach_scene(null) <> '[]'::jsonb
    or pesca.read_character_photo('a',replacement) is not null then raise exception 'Withdrawal failed'; end if;
end $$;
rollback;
