-- A guest keeps one private, normalized WebP. Each replacement gets a new URL.
create table pesca.character_photos (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null unique references pesca.rsvps(guest_id) on delete cascade,
  aspect real not null check (aspect between 0.001 and 1024),
  image bytea not null check (octet_length(image) between 1 and 262144),
  unique (guest_id, id)
);
alter table pesca.sticker_placements
  add column photo_id uuid,
  add column face jsonb,
  add constraint placement_photo_owner foreign key (guest_id, photo_id)
    references pesca.character_photos(guest_id, id) on delete cascade,
  drop constraint sticker_placements_sticker_id_check,
  add constraint sticker_placements_sticker_id_check check (photo_id is not null or sticker_id in (
    'levantadora', 'foguete', 'paredao', 'siri',
    'capita', 'mergulho', 'saque', 'cortada',
    'manchete', 'largadinha', 'bloqueio', 'salva-vidas',
    'surfista', 'gaivota', 'tchibum', 'crawl',
    'embaixadinha', 'calcadao', 'soneca', 'capivara',
    'protetor', 'milho', 'cadeirinha', 'leque',
    'ponto', 'coco', 'brinde', 'selfie',
    'passinho', 'cooler', 'golpe-da-mare', 'maga-do-mormaco',
    'ronin-do-milho', 'capita-do-coco', 'mecha-bloqueio', 'axolote-surfista',
    'goleira-lunar', 'rei-da-bicicleta', 'enterrada-solar', 'saque-de-raquete',
    'rodas-na-orla', 'campea-sobre-rodas', 'nadador-torpedo', 'guitarra-de-concha',
    'diva-do-vento', 'dj-do-isopor', 'baixo-da-onda', 'sanfona-de-sol',
    'rap-do-picole', 'rainha-do-tambor', 'astronauta-de-boia', 'detetive-de-canga',
    'chef-do-arcade', 'vampira-do-sol', 'monstro-da-selfie', 'cavaleira-do-fliper',
    'hinata', 'kageyama', 'nishinoya', 'tsukishima', 'tanaka',
    'daichi', 'goku', 'vegeta', 'piccolo', 'krillin',
    'roshi', 'gohan', 'giba', 'marcelinho', 'serginho',
    'emanuel', 'ricardo', 'alison', 'sonic', 'tails',
    'ryu', 'chunli'
  )),
  add constraint character_composition check (
    (photo_id is null and face is null) or
    (photo_id is not null and face is not null
      and sticker_id in ('meu-capita','meu-cortada','meu-cadeirinha','meu-brinde','meu-crawl','meu-saque','meu-bloqueio','meu-manchete',
        'meu-ponto','meu-paredao','meu-mergulho','meu-embaixadinha','meu-protetor','meu-calcadao','meu-selfie','meu-coco','meu-milho','meu-leque','meu-cooler','meu-passinho')
      and jsonb_typeof(face) = 'object' and face ?& array['zoom','x','y','rotation']
      and face - array['zoom','x','y','rotation'] = '{}'::jsonb
      and jsonb_typeof(face->'zoom') = 'number' and (face->>'zoom')::numeric between 1 and 4
      and jsonb_typeof(face->'x') = 'number' and abs((face->>'x')::numeric) <= 1
      and jsonb_typeof(face->'y') = 'number' and abs((face->>'y')::numeric) <= 1
      and jsonb_typeof(face->'rotation') = 'number' and abs((face->>'rotation')::numeric) <= 45)
  );

create function pesca.own_character_photo(p_actor text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('photoId',id,'aspect',aspect) from pesca.character_photos where guest_id = p_actor;
$$;

create function pesca.begin_character_photo(p_actor text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select from pesca.rsvps where guest_id = p_actor and attendance_status = 'going' and not hidden)
    then return false; end if;
  return pesca.consume_rate(p_actor, 'character_photo', 10);
end;
$$;

create function pesca.store_character_photo(p_actor text, p_image bytea, p_aspect real, p_previous uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  perform from pesca.rsvps where guest_id = p_actor and attendance_status = 'going' and not hidden for update;
  if not found or (pesca.own_character_photo(p_actor)->>'photoId')::uuid is distinct from p_previous then return null; end if;
  delete from pesca.character_photos where guest_id = p_actor;
  insert into pesca.character_photos(guest_id, image, aspect) values (p_actor,p_image,p_aspect) returning id into result;
  return result;
end;
$$;

create function pesca.remove_character_photo(p_actor text, p_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  perform from pesca.rsvps where guest_id = p_actor for update;
  delete from pesca.character_photos where guest_id = p_actor and id = p_id;
  return found;
end;
$$;

create function pesca.read_character_photo(p_actor text, p_id uuid) returns bytea
language sql stable security definer set search_path = '' as $$
  select p.image from pesca.character_photos p where p.id = p_id and (
    p.guest_id = p_actor or exists (
      select from pesca.sticker_placements s join pesca.rsvps r on r.guest_id = s.guest_id
      where s.photo_id = p.id and r.public_visibility_consent and r.attendance_status = 'going' and not r.hidden
    )
  );
$$;

-- Keep the five-argument entry point for conventional stickers and old clients.
create function pesca.write_beach_placement(p_actor text, p_sticker text, p_zone text, p_x numeric, p_y numeric,
  p_photo uuid, p_face jsonb, p_consent boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform from pesca.rsvps where guest_id = p_actor and attendance_status = 'going' and not hidden for update;
  if not found then return jsonb_build_object('ok',false,'code','ineligible'); end if;
  if not pesca.consume_rate(p_actor, 'sticker', 20) then return jsonb_build_object('ok',false,'code','rate_limited'); end if;
  if p_photo is not null and (p_consent is not true or p_photo is distinct from (pesca.own_character_photo(p_actor)->>'photoId')::uuid) then
    return jsonb_build_object('ok',false,'code','invalid_photo');
  end if;
  begin
    insert into pesca.sticker_placements(guest_id,sticker_id,zone_id,x,y,photo_id,face)
      values(p_actor,p_sticker,p_zone,p_x,p_y,p_photo,p_face)
      on conflict(guest_id,scene_id) do update set sticker_id=excluded.sticker_id, zone_id=excluded.zone_id,
        x=excluded.x, y=excluded.y, photo_id=excluded.photo_id, face=excluded.face, updated_at=now();
    return jsonb_build_object('ok',true);
  exception when check_violation or not_null_violation or invalid_text_representation then
    return jsonb_build_object('ok',false,'code','invalid_input');
  end;
end;
$$;
create or replace function pesca.save_beach_sticker(p_actor text, p_sticker text, p_zone text, p_x numeric, p_y numeric)
returns jsonb language sql security definer set search_path = '' as $$
  select pesca.write_beach_placement(p_actor,p_sticker,p_zone,p_x,p_y,null,null,false);
$$;

create function pesca.character_beach_scene(p_actor text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,'sticker_id',s.sticker_id,'zone_id',s.zone_id,'x',s.x,'y',s.y,
    'name',p.display_name,'mine',s.guest_id is not distinct from p_actor,'shared',r.public_visibility_consent
  ) || case when s.photo_id is null then '{}'::jsonb else
    jsonb_build_object('character',jsonb_build_object('photoId',s.photo_id,'aspect',photo.aspect,'face',s.face)) end
    order by s.created_at,s.id),'[]'::jsonb)
  from pesca.sticker_placements s join pesca.rsvps r on r.guest_id=s.guest_id
  left join pesca.character_photos photo on photo.id=s.photo_id
  join pesca.guest_profiles p on p.id=s.guest_id
  where s.scene_id='copacabana' and r.attendance_status='going' and not r.hidden
    and (r.public_visibility_consent or s.guest_id=p_actor);
$$;

-- Older releases can keep loading their original gallery during a rolling deployment.
create or replace function pesca.beach_scene(p_actor text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(row order by ordinal),'[]'::jsonb)
  from jsonb_array_elements(pesca.character_beach_scene(p_actor)) with ordinality as scene(row, ordinal)
  where not (row ? 'character');
$$;

revoke all on pesca.character_photos from public, pesca_runtime;
revoke all on function pesca.character_beach_scene(text), pesca.own_character_photo(text), pesca.begin_character_photo(text),
  pesca.store_character_photo(text,bytea,real,uuid), pesca.remove_character_photo(text,uuid),
  pesca.read_character_photo(text,uuid), pesca.write_beach_placement(text,text,text,numeric,numeric,uuid,jsonb,boolean) from public;
grant execute on function pesca.character_beach_scene(text), pesca.own_character_photo(text), pesca.begin_character_photo(text),
  pesca.store_character_photo(text,bytea,real,uuid), pesca.remove_character_photo(text,uuid),
  pesca.read_character_photo(text,uuid), pesca.write_beach_placement(text,text,text,numeric,numeric,uuid,jsonb,boolean) to pesca_runtime;
