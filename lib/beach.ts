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
export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; width: number; height: number };
export type StickerId = keyof typeof stickerNames;
export const stickerIds = Object.keys(stickerNames) as StickerId[];

// Trace landmarks on the 1536 × 1024 master. The rest of the app uses fractions.
const artPoint = ([x, y]: [number, number]): Point => ({
  x: x / 1536,
  y: y / 1024,
});
const path = (...points: [number, number][]) => points.map(artPoint);
export const zones = {
  quadras: {
    name: "Quadras",
    line: "A próxima é nossa! Já tem dupla pro vôlei?",
    width: 0.068,
    regions: [
      path([102, 440], [437, 414], [568, 613], [13, 645]),
      path([539, 425], [835, 413], [966, 590], [620, 615]),
    ],
    anchors: path(
      [292, 546],
      [736, 524],
      [147, 589],
      [450, 572],
      [639, 474],
      [842, 568],
    ),
  },
  coolers: {
    name: "Coolers",
    line: "Tem gelo aí? A turma da hidratação tá de plantão.",
    width: 0.055,
    regions: [path([1324, 399], [1493, 402], [1470, 447], [1310, 438])],
    anchors: path([1386, 427], [1464, 430]),
  },
  gazebo: {
    name: "Gazebo",
    line: "Na sombra sempre cabe mais uma cadeira.",
    width: 0.061,
    regions: [path([995, 372], [1492, 369], [1454, 536], [1004, 512])],
    anchors: path([1090, 453], [1256, 462], [1364, 490], [1174, 502]),
  },
  torcida: {
    name: "Bancos",
    line: "Vale gritar ponto até quando a bola cai fora!",
    width: 0.083,
    regions: [
      path([68, 780], [237, 791], [225, 873], [80, 856]),
      path([228, 832], [613, 856], [601, 949], [229, 919]),
    ],
    anchors: path([413, 856], [544, 868], [295, 850], [168, 802]),
  },
  cadeiras: {
    name: "Cadeiras",
    line: "Pés na areia, óculos escuros e zero pressa.",
    width: 0.09,
    regions: [
      path([1061, 774], [1201, 777], [1188, 886], [1033, 891]),
      path([1298, 789], [1436, 796], [1425, 909], [1275, 895]),
    ],
    anchors: path([1112, 824], [1352, 844]),
  },
  "beira-mar": {
    name: "Areia livre",
    line: "Escolha um cantinho na areia.",
    width: 0.073,
    regions: [],
    anchors: path([782, 743], [653, 683], [886, 835], [488, 720], [277, 687]),
  },
};
export type ZoneId = keyof typeof zones;
export const zoneIds = Object.keys(zones) as ZoneId[];
export type GroundPosition = Point & { zone_id: ZoneId };

// The historical database contract stores the center of the transparent square.
export const inset = { x: 0.03, y: 0.045 };
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
export function scenePoint(client: Point, rect: Rect): Point {
  return {
    x: (client.x - rect.left) / rect.width,
    y: (client.y - rect.top) / rect.height,
  };
}
// Lowest opaque edge in the 256px square sprite. Most crops share one margin.
const spriteBottom: Partial<Record<StickerId, number>> = {
  mergulho: 215,
  soneca: 243,
  capita: 250,
};
export function sole(id: StickerId) {
  return (spriteBottom[id] ?? 248) / 256;
}
function centerOffset(zone: ZoneId, sticker: StickerId) {
  return zones[zone].width * 1.5 * (sole(sticker) - 0.5);
}
export function feet(p: Placement): Point {
  return { x: p.x, y: p.y + centerOffset(p.zone_id, p.sticker_id) };
}
export function placementAt(
  p: GroundPosition,
  sticker_id: StickerId,
): Placement {
  return { ...p, y: p.y - centerOffset(p.zone_id, sticker_id), sticker_id };
}

// The shoreline and front edge of the promenade slope across the painting.
// On the right the accessible sand starts inside the open gazebo.
const beachEdge = path(
  [0, 321],
  [900, 223],
  [934, 224],
  [977, 396],
  [1536, 413],
);
const edgeMargin = Math.max(...zoneIds.map((id) => zones[id].width)) / 2;
export function playable(point: Point): Point {
  const x = clamp(point.x, edgeMargin, 1 - edgeMargin);
  const end = beachEdge.findIndex((p) => p.x >= x);
  const a = beachEdge[end - 1],
    b = beachEdge[end];
  const shore = a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  return { x, y: clamp(point.y, shore, 0.896 + x * 0.045) };
}
function contains(polygon: Point[], p: Point) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
export function zoneAt(p: Point): ZoneId {
  return (
    zoneIds.find((id) => zones[id].regions.some((poly) => contains(poly, p))) ??
    "beira-mar"
  );
}
function distance(a: Point, b: Point) {
  return Math.hypot((a.x - b.x) * 1.5, a.y - b.y);
}
function available(anchor: Point, others: readonly Point[]) {
  return others.every((p) => distance(anchor, p) > 0.063);
}
export function nearbyAnchor(
  p: Point,
  others: readonly Point[],
): Point | undefined {
  const id = zoneAt(p);
  if (id === "beira-mar") return;
  return zones[id].anchors.find(
    (a) => distance(a, p) <= 0.027 && available(a, others),
  );
}
export function suggestSpot(
  id: ZoneId,
  others: readonly Point[],
): GroundPosition {
  const { anchors } = zones[id];
  const open = anchors.find((a) => available(a, others));
  if (open) return { ...open, zone_id: id };
  // A full bench or court still has standing room nearby.
  const origin = anchors[0];
  for (const radius of [0.075, 0.15, 0.225]) {
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const p = playable({
        x: origin.x + (Math.cos(angle) * radius) / 1.5,
        y: origin.y + Math.sin(angle) * radius,
      });
      if (available(p, others)) return { ...p, zone_id: zoneAt(p) };
    }
  }
  return { ...origin, zone_id: id };
}
export function destination(
  point: Point,
  others: readonly Point[],
  snap: boolean,
): GroundPosition {
  const p = playable(point);
  const target = (snap && nearbyAnchor(p, others)) || p;
  return { ...target, zone_id: zoneAt(target) };
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
