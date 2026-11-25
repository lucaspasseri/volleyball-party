import { z } from "zod";

import { artPoint, beachAspect } from "./beach-art";
import { stickerProfile, stickerWidth } from "./beach-perspective";
import {
  characterSchema,
  isCharacter,
  sceneStickerIds,
  type SceneStickerId as StickerId,
} from "./characters";

export type Point = { x: number; y: number };
type Rect = { left: number; top: number; width: number; height: number };

const path = (...points: [number, number][]) =>
  points.map(([x, y]) => artPoint(x, y));
export const zones = {
  quadras: {
    name: "Quadras",
    line: "A próxima é nossa! Já tem dupla pro vôlei?",
    legacyWidth: 0.068,
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
    legacyWidth: 0.055,
    regions: [
      path([1180, 461], [1331, 431], [1505, 473], [1500, 558], [1240, 564]),
    ],
    anchors: path([1292, 502], [1436, 548], [1220, 486], [1334, 552]),
  },
  gazebo: {
    name: "Gazebo",
    line: "Na sombra sempre cabe mais uma cadeira.",
    legacyWidth: 0.061,
    regions: [
      path([1109, 400], [1195, 349], [1474, 356], [1418, 431], [1108, 438]),
    ],
    anchors: path([1204, 432], [1251, 383], [1354, 376], [1304, 425]),
  },
  torcida: {
    name: "Bancos",
    line: "Vale gritar ponto até quando a bola cai fora!",
    legacyWidth: 0.083,
    regions: [path([228, 777], [455, 780], [613, 856], [601, 949], [229, 919])],
    anchors: path([413, 856], [504, 866], [295, 850]),
  },
  cadeiras: {
    name: "Cadeiras",
    line: "Pés na areia, óculos escuros e zero pressa.",
    legacyWidth: 0.09,
    regions: [
      path([1013, 774], [1201, 777], [1188, 886], [1006, 891]),
      path([1298, 789], [1480, 796], [1480, 909], [1275, 895]),
    ],
    anchors: path([1112, 824], [1352, 844]),
  },
  "beira-mar": {
    name: "Areia livre",
    line: "Escolha um cantinho na areia.",
    legacyWidth: 0.073,
    regions: [],
    anchors: path([740, 681], [653, 683], [360, 766], [488, 720], [277, 687]),
  },
  mar: {
    name: "Mar",
    line: "Um mergulho antes da próxima partida?",
    legacyWidth: 0.055,
    regions: [path([0, 100], [1050, 100], [1050, 186], [600, 240], [0, 294])],
    anchors: path([516, 185], [710, 151], [320, 204]),
  },
  calcadao: {
    name: "Calçadão",
    line: "Um passeio pelas ondas de pedra da orla.",
    legacyWidth: 0.09,
    regions: [path([0, 905], [1536, 1008], [1536, 1024], [0, 1024])],
    anchors: path([315, 978], [1100, 995], [120, 969], [530, 989], [1260, 998]),
  },
};
export type ZoneId = keyof typeof zones;
export const zoneIds = Object.keys(zones) as ZoneId[];
export type GroundPosition = Point & { zone_id: ZoneId };

// The historical database contract stores the center of the transparent square.
const inset = { x: 0.03, y: 0.045 };
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
export function scenePoint(client: Point, rect: Rect): Point {
  return {
    x: (client.x - rect.left) / rect.width,
    y: (client.y - rect.top) / rect.height,
  };
}
// Frozen dimensions of the original exports encode saved centers. Keep these
// values independent from display geometry, including when art is replaced.
const spriteBottom: Partial<Record<StickerId, number>> = {
  mergulho: 215,
  soneca: 243,
  capita: 250,
  manchete: 236,
  tchibum: 221,
  crawl: 187,
  "nadador-torpedo": 235,
  embaixadinha: 244,
  leque: 227,
};
function legacySole(id: StickerId) {
  return (spriteBottom[id] ?? 248) / 256;
}
function centerOffset(zone: ZoneId, sticker: StickerId) {
  return zones[zone].legacyWidth * beachAspect * (legacySole(sticker) - 0.5);
}
export function feet(p: Placement): Point {
  return { x: p.x, y: p.y + centerOffset(p.zone_id, p.sticker_id) };
}
export function placementAt(
  p: GroundPosition,
  sticker_id: StickerId,
): Placement {
  const y = clamp(
    p.y - centerOffset(p.zone_id, sticker_id),
    inset.y,
    1 - inset.y,
  );
  return { ...p, y, sticker_id };
}

// Keep placements below the horizon and out of the gazebo roof on the right.
const beachEdge = path(
  [0, 140],
  [1050, 140],
  [1108, 394],
  [1195, 350],
  [1536, 359],
);
const edgeMargin = Math.max(...zoneIds.map((id) => zones[id].legacyWidth)) / 2;
export function playable(point: Point): Point {
  const x = clamp(point.x, edgeMargin, 1 - edgeMargin);
  const end = beachEdge.findIndex((p) => p.x >= x);
  const a = beachEdge[end - 1],
    b = beachEdge[end];
  const top = a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  return { x, y: clamp(point.y, top, 0.976) };
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
  return Math.hypot((a.x - b.x) * beachAspect, a.y - b.y);
}
function spacing(point: Point, sticker?: StickerId) {
  return sticker ? Math.max(0.063, stickerWidth(point, sticker) * 0.87) : 0.063;
}
function available(
  anchor: Point,
  others: readonly Point[],
  sticker?: StickerId,
) {
  const margin = spacing(anchor, sticker);
  return others.every((p) => distance(anchor, p) > margin);
}
const besideSeats = {
  cadeiras: path([1020, 874], [1460, 858]),
  torcida: path([315, 793], [431, 801]),
};
function suggestedAnchors(zone: ZoneId, sticker?: StickerId) {
  if (
    (zone === "cadeiras" || zone === "torcida") &&
    sticker &&
    stickerProfile(sticker).pose === "chair"
  )
    return besideSeats[zone];
  return zones[zone].anchors;
}
export function nearbyAnchor(
  p: Point,
  others: readonly Point[],
  sticker?: StickerId,
): Point | undefined {
  const id = zoneAt(p);
  if (id === "beira-mar") return;
  return suggestedAnchors(id, sticker).find(
    (a) => distance(a, p) <= 0.027 && available(a, others, sticker),
  );
}
export function suggestSpot(
  id: ZoneId,
  others: readonly Point[],
  sticker?: StickerId,
): GroundPosition {
  const anchors = suggestedAnchors(id, sticker);
  const open = anchors.find((a) => available(a, others, sticker));
  if (open) return { ...open, zone_id: id };
  // Compare space around every anchor so a full court can spill over onto
  // nearby sand without stacking every later guest at the first position.
  let best: GroundPosition = { ...anchors[0], zone_id: id };
  let bestScore = -Infinity;
  for (const radius of [0.08, 0.16, 0.24, 0.32]) {
    for (const origin of anchors) {
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const point = playable({
          x: origin.x + (Math.cos(angle) * radius) / beachAspect,
          y: origin.y + Math.sin(angle) * radius,
        });
        const zone = zoneAt(point);
        const clearance = others.reduce(
          (min, other) => Math.min(min, distance(point, other)),
          Infinity,
        );
        const room = Math.min(1, clearance / spacing(point, sticker));
        const score = room - radius * 0.25 + (zone === id ? 0.12 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = { ...point, zone_id: zone };
        }
      }
    }
  }
  return best;
}
export function destination(
  point: Point,
  others: readonly Point[],
  snap: boolean,
  sticker?: StickerId,
): GroundPosition {
  const p = playable(point);
  const target = (snap && nearbyAnchor(p, others, sticker)) || p;
  return { ...target, zone_id: zoneAt(target) };
}
const placementFields = z.strictObject({
  character: characterSchema.optional(),
  sticker_id: z.enum(sceneStickerIds),
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
function validComposition(p: z.infer<typeof placementFields>) {
  return isCharacter(p.sticker_id) === Boolean(p.character);
}
export const placementSchema = placementFields.refine(validComposition);
export type Placement = z.infer<typeof placementSchema>;
export const sceneRowsSchema = z.array(
  placementFields
    .extend({
      id: z.uuid(),
      name: z.string().max(40),
      mine: z.boolean(),
      shared: z.boolean(),
    })
    .refine(validComposition),
);
export type SceneRow = z.infer<typeof sceneRowsSchema>[number];
