import type { ZoneId } from "./beach";

export const tributeCollections = {
  haikyu: "Haikyu!!",
  "dragon-ball-z": "Dragon Ball Z",
  "lendas-quadra": "Lendas do Vôlei",
  "lendas-praia": "Lendas do Vôlei de Praia",
  games: "Games",
} as const;

export type TributeCollection = keyof typeof tributeCollections;
type Tribute = {
  name: string;
  category: TributeCollection;
  zone: ZoneId;
  description: string;
};

export const tributes = {
  hinata: {
    name: "Shoyo Hinata",
    category: "haikyu",
    zone: "quadras",
    description: "Hinata salta para a cortada com a camisa 10 do Karasuno.",
  },
  kageyama: {
    name: "Tobio Kageyama",
    category: "haikyu",
    zone: "quadras",
    description: "Kageyama ergue as mãos para levantar a bola de camisa 9.",
  },
  nishinoya: {
    name: "Yu Nishinoya",
    category: "haikyu",
    zone: "quadras",
    description:
      "Nishinoya mergulha de manchete com a camisa laranja de líbero.",
  },
  tsukishima: {
    name: "Kei Tsukishima",
    category: "haikyu",
    zone: "quadras",
    description:
      "Tsukishima, de óculos, estende os braços para fechar o bloqueio.",
  },
  tanaka: {
    name: "Ryunosuke Tanaka",
    category: "haikyu",
    zone: "torcida",
    description: "Tanaka cerra o punho e solta um grito de ponto.",
  },
  daichi: {
    name: "Daichi Sawamura",
    category: "haikyu",
    zone: "quadras",
    description:
      "Daichi firma as pernas e une os antebraços para receber o saque.",
  },
  goku: {
    name: "Goku",
    category: "dragon-ball-z",
    zone: "quadras",
    description: "Goku salta para um saque com o uniforme laranja e azul.",
  },
  vegeta: {
    name: "Vegeta",
    category: "dragon-ball-z",
    zone: "quadras",
    description:
      "Vegeta cruza os braços e fecha a cara depois de perder o ponto.",
  },
  piccolo: {
    name: "Piccolo",
    category: "dragon-ball-z",
    zone: "beira-mar",
    description: "Piccolo medita de pernas cruzadas, com as antenas à mostra.",
  },
  krillin: {
    name: "Kuririn",
    category: "dragon-ball-z",
    zone: "quadras",
    description: "Kuririn flexiona os joelhos para receber a bola de manchete.",
  },
  roshi: {
    name: "Mestre Kame",
    category: "dragon-ball-z",
    zone: "cadeiras",
    description: "Mestre Kame relaxa numa cadeira de praia de camisa florida.",
  },
  gohan: {
    name: "Gohan",
    category: "dragon-ball-z",
    zone: "quadras",
    description: "Gohan, Super Saiyajin dos Jogos de Cell, sobe para bloquear.",
  },
  giba: {
    name: "Giba",
    category: "lendas-quadra",
    zone: "quadras",
    description: "Giba arma a cortada no ar com a camisa amarela 7.",
  },
  marcelinho: {
    name: "Marcelinho",
    category: "lendas-quadra",
    zone: "quadras",
    description: "Marcelinho levanta a bola acima da testa com a camisa 2.",
  },
  serginho: {
    name: "Serginho",
    category: "lendas-quadra",
    zone: "quadras",
    description:
      "Serginho se estica numa defesa de peixinho com o uniforme azul de líbero.",
  },
  emanuel: {
    name: "Emanuel Rego",
    category: "lendas-praia",
    zone: "quadras",
    description:
      "Emanuel se abaixa para receber de manchete, com os óculos sobre os cachos.",
  },
  ricardo: {
    name: "Ricardo Santos",
    category: "lendas-praia",
    zone: "quadras",
    description: "Ricardo sobe com as duas mãos abertas para bloquear na rede.",
  },
  alison: {
    name: "Alison Cerutti",
    category: "lendas-praia",
    zone: "quadras",
    description:
      "Alison, o Mamute, comemora o bloqueio com os punhos cerrados.",
  },
  sonic: {
    name: "Sonic",
    category: "games",
    zone: "beira-mar",
    description:
      "Sonic dispara atrás da bola com os tênis vermelhos levantando areia.",
  },
  tails: {
    name: "Tails",
    category: "games",
    zone: "coolers",
    description:
      "Tails leva um balde e uma toalha com as duas caudas levantadas.",
  },
  ryu: {
    name: "Ryu",
    category: "games",
    zone: "quadras",
    description: "Ryu prepara um saque potente com a faixa vermelha ao vento.",
  },
  chunli: {
    name: "Chun-Li",
    category: "games",
    zone: "quadras",
    description: "Chun-Li estende a perna em uma defesa lateral de manchete.",
  },
} as const satisfies Record<string, Tribute>;

export type TributeId = keyof typeof tributes;
export const tributeIds = Object.keys(tributes) as TributeId[];
export function isTribute(id: string): id is TributeId {
  return Object.hasOwn(tributes, id);
}
