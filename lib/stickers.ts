import type { ZoneId } from "./beach";

import {
  tributes,
  tributeCollections,
  tributeIds,
} from "./tribute-stickers";

const collections = {
  beach: {
    name: "Turma da praia",
    categories: ["volei", "praia-mar", "sossego", "festa"],
    showAll: false,
  },
  "pop-culture": {
    name: "Cultura pop",
    categories: ["anime", "sports", "music", "movies-games"],
    showAll: true,
  },
} as const;

type CollectionId = keyof typeof collections;
type CategoryId = (typeof collections)[CollectionId]["categories"][number];

const categoryNames: Record<CategoryId, string> = {
  volei: "Vôlei",
  "praia-mar": "Praia e mar",
  sossego: "Sossego",
  festa: "Festa",
  anime: "Anime",
  sports: "Esportes",
  music: "Música",
  "movies-games": "Cinema e games",
};

type Sticker = { name: string; category: CategoryId; zone: ZoneId };

const originals = {
  levantadora: { name: "Levantadora", category: "volei", zone: "quadras" },
  foguete: { name: "Foguete da areia", category: "volei", zone: "quadras" },
  paredao: { name: "Paredão", category: "volei", zone: "quadras" },
  siri: { name: "Siri do saque", category: "volei", zone: "quadras" },
  capita: { name: "Capitã da quadra", category: "volei", zone: "quadras" },
  mergulho: { name: "Peixinho", category: "volei", zone: "quadras" },
  saque: { name: "Saque viagem", category: "volei", zone: "quadras" },
  cortada: { name: "Cortada no alto", category: "volei", zone: "quadras" },
  manchete: { name: "Dona da manchete", category: "volei", zone: "quadras" },
  largadinha: {
    name: "Largadinha de leve",
    category: "volei",
    zone: "quadras",
  },
  bloqueio: { name: "Muralha no ar", category: "volei", zone: "quadras" },
  "salva-vidas": {
    name: "Salva-vidas",
    category: "praia-mar",
    zone: "quadras",
  },
  surfista: { name: "Surfista", category: "praia-mar", zone: "quadras" },
  gaivota: { name: "Gaivota da orla", category: "praia-mar", zone: "quadras" },
  tchibum: { name: "Tchibum!", category: "praia-mar", zone: "mar" },
  crawl: { name: "De braçada", category: "praia-mar", zone: "mar" },
  embaixadinha: {
    name: "Embaixadinha",
    category: "praia-mar",
    zone: "beira-mar",
  },
  calcadao: {
    name: "Passada no calçadão",
    category: "praia-mar",
    zone: "calcadao",
  },
  soneca: { name: "Mestre da soneca", category: "sossego", zone: "quadras" },
  capivara: { name: "Capivara do sol", category: "sossego", zone: "quadras" },
  protetor: {
    name: "Passa o protetor",
    category: "sossego",
    zone: "beira-mar",
  },
  milho: { name: "Milho da praia", category: "sossego", zone: "torcida" },
  cadeirinha: {
    name: "Só mais um capítulo",
    category: "sossego",
    zone: "beira-mar",
  },
  leque: { name: "Brisa de leque", category: "sossego", zone: "gazebo" },
  ponto: { name: "É ponto!", category: "festa", zone: "quadras" },
  coco: { name: "Coco gelado", category: "festa", zone: "quadras" },
  brinde: { name: "Um brinde!", category: "festa", zone: "coolers" },
  selfie: { name: "Selfie da orla", category: "festa", zone: "calcadao" },
  passinho: { name: "No passinho", category: "festa", zone: "gazebo" },
  cooler: { name: "Chegou o gelo", category: "festa", zone: "coolers" },
  "golpe-da-mare": {
    name: "Golpe da maré",
    category: "anime",
    zone: "quadras",
  },
  "maga-do-mormaco": {
    name: "Maga do mormaço",
    category: "anime",
    zone: "beira-mar",
  },
  "ronin-do-milho": {
    name: "Ronin do milho",
    category: "anime",
    zone: "torcida",
  },
  "capita-do-coco": {
    name: "Capitã do coco",
    category: "anime",
    zone: "coolers",
  },
  "mecha-bloqueio": {
    name: "Mecha do bloqueio",
    category: "anime",
    zone: "quadras",
  },
  "axolote-surfista": {
    name: "Axolote surfista",
    category: "anime",
    zone: "mar",
  },
  "goleira-lunar": {
    name: "Goleira lunar",
    category: "sports",
    zone: "quadras",
  },
  "rei-da-bicicleta": {
    name: "Rei da bicicleta",
    category: "sports",
    zone: "beira-mar",
  },
  "enterrada-solar": {
    name: "Enterrada solar",
    category: "sports",
    zone: "quadras",
  },
  "saque-de-raquete": {
    name: "Saque de raquete",
    category: "sports",
    zone: "beira-mar",
  },
  "rodas-na-orla": {
    name: "Rodas na orla",
    category: "sports",
    zone: "calcadao",
  },
  "campea-sobre-rodas": {
    name: "Campeã sobre rodas",
    category: "sports",
    zone: "torcida",
  },
  "nadador-torpedo": {
    name: "Nadador torpedo",
    category: "sports",
    zone: "mar",
  },
  "guitarra-de-concha": {
    name: "Guitarra de concha",
    category: "music",
    zone: "gazebo",
  },
  "diva-do-vento": { name: "Diva do vento", category: "music", zone: "gazebo" },
  "dj-do-isopor": { name: "DJ do isopor", category: "music", zone: "coolers" },
  "baixo-da-onda": {
    name: "Baixo da onda",
    category: "music",
    zone: "cadeiras",
  },
  "sanfona-de-sol": {
    name: "Sanfona de sol",
    category: "music",
    zone: "gazebo",
  },
  "rap-do-picole": {
    name: "Rap do picolé",
    category: "music",
    zone: "calcadao",
  },
  "rainha-do-tambor": {
    name: "Rainha do tambor",
    category: "music",
    zone: "torcida",
  },
  "astronauta-de-boia": {
    name: "Astronauta de boia",
    category: "movies-games",
    zone: "mar",
  },
  "detetive-de-canga": {
    name: "Detetive de canga",
    category: "movies-games",
    zone: "cadeiras",
  },
  "chef-do-arcade": {
    name: "Chef do arcade",
    category: "movies-games",
    zone: "quadras",
  },
  "vampira-do-sol": {
    name: "Vampira do sol",
    category: "movies-games",
    zone: "calcadao",
  },
  "monstro-da-selfie": {
    name: "Monstro da selfie",
    category: "movies-games",
    zone: "calcadao",
  },
  "cavaleira-do-fliper": {
    name: "Cavaleira do flíper",
    category: "movies-games",
    zone: "beira-mar",
  },
} as const satisfies Record<string, Sticker>;

export const stickers = { ...originals, ...tributes };
export type StickerId = keyof typeof stickers;
export const stickerIds = Object.keys(stickers) as StickerId[];

type StickerGroup = { name: string; ids: StickerId[] };
type StickerCollection = StickerGroup & {
  id: string;
  groups: StickerGroup[];
  showAll: boolean;
};

const originalCollections: StickerCollection[] = (
  Object.keys(collections) as CollectionId[]
).map((id) => {
  const { name, categories, showAll } = collections[id];
  const groups = categories.map((category) => ({
    name: categoryNames[category],
    ids: stickerIds.filter(
      (sticker) => stickers[sticker].category === category,
    ),
  }));
  const ids = groups.flatMap((group) => group.ids);
  return { id, name, groups, ids, showAll };
});

export const stickerCollections: StickerCollection[] = [
  ...originalCollections,
  ...Object.entries(tributeCollections).map(([id, name]) => ({
    id,
    name,
    ids: tributeIds.filter((sticker) => tributes[sticker].category === id),
    groups: [],
    showAll: false,
  })),
];

export function stickerSrc(id: StickerId) {
  return `/beach/stickers/${id}.webp`;
}
