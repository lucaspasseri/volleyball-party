begin;

alter table pesca.sticker_placements
  drop constraint sticker_placements_sticker_id_check,
  add constraint sticker_placements_sticker_id_check check (sticker_id in (
    'levantadora', 'foguete', 'paredao', 'salva-vidas', 'surfista', 'capivara',
    'siri', 'coco', 'gaivota', 'capita', 'soneca', 'mergulho',
    'saque', 'cortada', 'manchete', 'largadinha', 'bloqueio', 'ponto',
    'brinde', 'protetor', 'milho', 'cadeirinha', 'selfie', 'passinho',
    'tchibum', 'crawl', 'embaixadinha', 'calcadao', 'cooler', 'leque'
  )),
  drop constraint sticker_placements_zone_id_check,
  add constraint sticker_placements_zone_id_check check (zone_id in (
    'quadras', 'gazebo', 'coolers', 'cadeiras', 'torcida', 'beira-mar', 'mar', 'calcadao'
  ));

commit;
