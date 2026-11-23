import { z } from "zod";

export const stickerNames = {
  levantadora: "Levantadora",
  foguete: "Foguete da areia",
  paredao: "Paredão",
  "salva-vidas": "Salva-vidas",
  surfista: "Surfista",
  capivara: "Capivara do sol",
  siri: "Siri do saque",
  coco: "Coco gelado",
  gaivota: "Gaivota da orla",
  capita: "Capitã da quadra",
  soneca: "Mestre da soneca",
  mergulho: "Peixinho",
} as const;
export const zones = {
  quadras: {
    name: "Quadras",
    line: "A próxima é nossa! Já tem dupla pro vôlei?",
    x: 0.32,
    y: 0.54,
  },
  gazebo: {
    name: "Gazebo",
    line: "Na sombra sempre cabe mais uma cadeira.",
    x: 0.82,
    y: 0.36,
  },
  coolers: {
    name: "Coolers",
    line: "Tem gelo aí? A turma da hidratação tá de plantão.",
    x: 0.82,
    y: 0.53,
  },
  cadeiras: {
    name: "Cadeiras",
    line: "Pés na areia, óculos escuros e zero pressa.",
    x: 0.79,
    y: 0.78,
  },
  torcida: {
    name: "Torcida",
    line: "Vale gritar ponto até quando a bola cai fora!",
    x: 0.25,
    y: 0.82,
  },
  "beira-mar": {
    name: "Beira-mar",
    line: "Só mais uma onda antes de voltar pra festa.",
    x: 0.46,
    y: 0.22,
  },
} as const;
export type ZoneId = keyof typeof zones;
export type StickerId = keyof typeof stickerNames;
export const zoneIds = Object.keys(zones) as ZoneId[];
export const stickerIds = Object.keys(stickerNames) as StickerId[];
export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; width: number; height: number };
// The sticker box occupies 6% of the original width and 9% of its height.
export const inset = { x: 0.03, y: 0.045 };
export function bound(point: Point): Point {
  const clamp = (n: number, margin: number) =>
    Number(Math.min(1 - margin, Math.max(margin, n)).toFixed(6));
  return { x: clamp(point.x, inset.x), y: clamp(point.y, inset.y) };
}
export function scenePoint(client: Point, rect: Rect): Point {
  return {
    x: (client.x - rect.left) / rect.width,
    y: (client.y - rect.top) / rect.height,
  };
}
export function dropPoint(client: Point, rect: Rect, grip: Point): Point {
  const p = scenePoint(client, rect);
  return bound({ x: p.x - grip.x, y: p.y - grip.y });
}
export function nearestZone(point: Point): ZoneId {
  const distance = (id: ZoneId) =>
    Math.hypot((point.x - zones[id].x) * 1.5, point.y - zones[id].y);
  return zoneIds.reduce((best, id) =>
    distance(id) < distance(best) ? id : best,
  );
}
// A zone shortcut suggests an open spot. A deliberate tap or drag always wins.
export function suggestSpot(id: ZoneId, others: readonly Point[]): Point {
  const origin = zones[id];
  for (const radius of [0, 0.063, 0.126]) {
    const count = radius === 0 ? 1 : 8;
    for (let index = 0; index < count; index++) {
      const angle = (index * 2 * Math.PI) / count;
      const p = bound({
        x: origin.x + Math.cos(angle) * radius,
        y: origin.y + Math.sin(angle) * radius * 1.5,
      });
      if (
        nearestZone(p) === id &&
        others.every(
          (other) =>
            Math.abs(p.x - other.x) >= inset.x * 2 ||
            Math.abs(p.y - other.y) >= inset.y * 2,
        )
      )
        return p;
    }
  }
  return origin;
}
export const placementSchema = z.strictObject({
  sticker_id: z.enum(stickerIds),
  zone_id: z.enum(zoneIds),
  x: z
    .number()
    .min(inset.x)
    .max(1 - inset.x),
  y: z
    .number()
    .min(inset.y)
    .max(1 - inset.y),
});
export type Placement = z.infer<typeof placementSchema>;
export const sceneRowsSchema = z.array(
  placementSchema.extend({
    id: z.uuid(),
    name: z.string().max(40),
    mine: z.boolean(),
    shared: z.boolean(),
  }),
);
export type SceneRow = z.infer<typeof sceneRowsSchema>[number];
export function stickerSrc(id: StickerId) {
  return `/beach/stickers/${id}.webp`;
}
