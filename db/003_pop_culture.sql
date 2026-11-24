alter table pesca.sticker_placements
  drop constraint sticker_placements_sticker_id_check,
  add constraint sticker_placements_sticker_id_check check (sticker_id in (
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
    'chef-do-arcade', 'vampira-do-sol', 'monstro-da-selfie', 'cavaleira-do-fliper'
  ));
