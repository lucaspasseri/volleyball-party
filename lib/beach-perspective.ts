import type { Point } from "./beach";
import { isCharacter, template, type SceneStickerId } from "./characters";
import type { StickerId } from "./stickers";

// Each row describes a transverse line on the published 1536 × 1024 painting.
// Interpolate its height at x before interpolating between rows at y.
const depthLines = [
  { left: 100, right: 100, adultWidth: 0.021 }, // horizon
  { left: 305, right: 195, adultWidth: 0.065 }, // distant beachgoers
  { left: 515, right: 442, adultWidth: 0.094 }, // net posts
  { left: 646, right: 561, adultWidth: 0.121 }, // near court edges
  { left: 905, right: 1011, adultWidth: 0.201 }, // mosaic
  { left: 1080, right: 1186, adultWidth: 0.23 },
];
export const perspectiveLimits = { min: 0.03, max: 0.212 };
export function beachDepth({ x, y }: Point) {
  const height = (row: (typeof depthLines)[number]) =>
    (row.left + (row.right - row.left) * x) / 1024;
  for (let i = 1; i < depthLines.length; i++) {
    const far = height(depthLines[i - 1]);
    const near = height(depthLines[i]);
    if (y <= near) return i - 1 + Math.max(0, (y - far) / (near - far));
  }
  return depthLines.length - 1;
}
export function depthOrder(point: Point) {
  return 1 + Math.round(beachDepth(point) * 1000);
}
export function adultWidth(depth: number, limits = perspectiveLimits) {
  const bounded = Math.max(0, Math.min(depthLines.length - 1, depth));
  const i = Math.min(Math.floor(bounded), depthLines.length - 2);
  const far = depthLines[i].adultWidth;
  const near = depthLines[i + 1].adultWidth;
  return Math.max(
    limits.min,
    Math.min(limits.max, far + (near - far) * (bounded - i)),
  );
}

const poses = {
  standing: { width: 1, elevation: 0, shadow: [0.5, 0.08, 0.33] },
  running: { width: 0.96, elevation: 0, shadow: [0.43, 0.07, 0.28] },
  jumping: { width: 0.94, elevation: 0.16, shadow: [0.35, 0.075, 0.18] },
  diving: { width: 1.03, elevation: 0.1, shadow: [0.58, 0.08, 0.18] },
  seated: { width: 0.62, elevation: 0, shadow: [0.72, 0.12, 0.27] },
  chair: { width: 0.73, elevation: 0, shadow: [0.73, 0.11, 0.27] },
  swimming: { width: 0.78, elevation: 0, shadow: [0, 0, 0] },
  gliding: { width: 0.75, elevation: 0, shadow: [0, 0, 0] },
} as const;
type Pose = keyof typeof poses;
type Profile = {
  pose: Pose;
  x: number;
  y: number;
  size?: number;
  paintedShadow?: boolean;
};
function at(
  pose: Pose,
  x: number,
  y: number,
  size?: number,
  paintedShadow?: boolean,
): Profile {
  return { pose, x, y, size, paintedShadow };
}
// Coordinates are measured within the transparent export, including props.
// Size is relative to a standing adult at the same ground point.
const profiles: Partial<Record<StickerId, Profile>> = {
  levantadora: at("standing", 0.5, 0.95, 1.16),
  foguete: at("running", 0.46, 0.94),
  paredao: at("standing", 0.51, 0.94, 1.04),
  siri: at("standing", 0.5, 0.89, 0.26),
  capita: at("standing", 0.47, 0.94),
  mergulho: at("diving", 0.49, 0.73),
  saque: at("standing", 0.48, 0.94, 1.12),
  cortada: at("jumping", 0.39, 0.94, 1.03),
  manchete: at("standing", 0.5, 0.87, 0.84),
  largadinha: at("jumping", 0.43, 0.94),
  bloqueio: at("jumping", 0.4, 0.95, 1.04),
  "salva-vidas": at("standing", 0.51, 0.94),
  surfista: at("standing", 0.45, 0.95),
  gaivota: at("standing", 0.51, 0.93, 0.32),
  tchibum: at("gliding", 0.91, 0.85, 0.96),
  crawl: at("swimming", 0.5, 0.67),
  embaixadinha: at("standing", 0.43, 0.92),
  calcadao: at("running", 0.49, 0.92),
  soneca: at("chair", 0.51, 0.88),
  capivara: at("seated", 0.5, 0.92, 0.46),
  protetor: at("standing", 0.51, 0.94),
  milho: at("seated", 0.51, 0.9),
  cadeirinha: at("chair", 0.49, 0.93),
  leque: at("seated", 0.54, 0.79, 0.73),
  ponto: at("seated", 0.51, 0.9, 0.68),
  coco: at("running", 0.38, 0.94, 0.27),
  brinde: at("standing", 0.48, 0.94),
  selfie: at("standing", 0.49, 0.94),
  passinho: at("running", 0.33, 0.94),
  cooler: at("chair", 0.5, 0.91, 0.77),
  "golpe-da-mare": at("jumping", 0.54, 0.94),
  "maga-do-mormaco": at("standing", 0.48, 0.95, 1.07),
  "ronin-do-milho": at("seated", 0.46, 0.9, 0.75),
  "capita-do-coco": at("standing", 0.48, 0.94),
  "mecha-bloqueio": at("standing", 0.51, 0.94, 0.92),
  "axolote-surfista": at("gliding", 0.51, 0.84, 0.49),
  "goleira-lunar": at("diving", 0.51, 0.89),
  "rei-da-bicicleta": at("diving", 0.5, 0.92),
  "enterrada-solar": at("jumping", 0.38, 0.94, 1.04),
  "saque-de-raquete": at("standing", 0.48, 0.94, 1.1),
  "rodas-na-orla": at("running", 0.47, 0.92),
  "campea-sobre-rodas": at("chair", 0.48, 0.93, 0.88),
  "nadador-torpedo": at("gliding", 0.4, 0.77, 1.0),
  "guitarra-de-concha": at("standing", 0.49, 0.94),
  "diva-do-vento": at("standing", 0.49, 0.94),
  "dj-do-isopor": at("chair", 0.5, 0.91, 0.77),
  "baixo-da-onda": at("chair", 0.48, 0.93),
  "sanfona-de-sol": at("standing", 0.5, 0.94),
  "rap-do-picole": at("standing", 0.5, 0.93),
  "rainha-do-tambor": at("standing", 0.5, 0.94),
  "astronauta-de-boia": at("swimming", 0.48, 0.6, 0.78),
  "detetive-de-canga": at("chair", 0.46, 0.92),
  "chef-do-arcade": at("jumping", 0.42, 0.94),
  "vampira-do-sol": at("running", 0.46, 0.93),
  "monstro-da-selfie": at("standing", 0.5, 0.94, 1.05),
  "cavaleira-do-fliper": at("seated", 0.37, 0.9, 0.73),
  hinata: at("jumping", 0.45, 0.93),
  kageyama: at("running", 0.29, 0.94),
  daichi: at("standing", 0.51, 0.93, 0.86),
  nishinoya: at("diving", 0.52, 0.82, 1.02, true),
  tanaka: at("standing", 0.49, 0.92, 0.87, true),
  tsukishima: at("jumping", 0.48, 0.91),
  goku: at("jumping", 0.52, 0.91),
  gohan: at("jumping", 0.47, 0.94),
  piccolo: at("seated", 0.49, 0.9),
  vegeta: at("standing", 0.51, 0.94, 0.91),
  krillin: at("standing", 0.5, 0.91, 0.71, true),
  roshi: at("chair", 0.51, 0.91),
  giba: at("jumping", 0.48, 0.93),
  serginho: at("diving", 0.49, 0.94),
  marcelinho: at("standing", 0.49, 0.94),
  ricardo: at("jumping", 0.5, 0.94, 1.1),
  emanuel: at("standing", 0.51, 0.94, 0.84),
  alison: at("standing", 0.5, 0.94, 1.07),
  sonic: at("running", 0.47, 0.9, 0.52, true),
  tails: at("running", 0.49, 0.91, 0.49, true),
  ryu: at("standing", 0.52, 0.94),
  chunli: at("standing", 0.5, 0.91, 0.89, true),
};

const defaultProfile = at("standing", 0.5, 0.95);
export function stickerProfile(id: SceneStickerId) {
  const body = isCharacter(id) ? template(id) : null;
  const reference = isCharacter(id) ? template(id).reference : id;
  const { pose, x, y, size, paintedShadow } =
    profiles[reference] ?? defaultProfile;
  const { width, elevation, shadow } = poses[pose];
  return {
    pose,
    anchor: { x: body?.ground.x ?? x, y: (body?.ground.y ?? y) + elevation },
    size: size ?? width,
    shadowWidth: shadow[0],
    shadowHeight: shadow[1],
    shadowOpacity: paintedShadow ? 0 : shadow[2],
  };
}

// The canopy shades a trapezoid. Feather the boundary over roughly half a step.
export function canopyShade({ x, y }: Point) {
  const px = x * 1536,
    py = y * 1024;
  const back = 345 + (px - 1100) * 0.045;
  const front = 410 + (px - 1100) * 0.085;
  const inside = Math.min(px - 1100, 1474 - px, py - back, front - py);
  return Math.max(0, Math.min(1, (inside + 8) / 16));
}
export function stickerWidth(point: Point, id: SceneStickerId) {
  return adultWidth(beachDepth(point)) * stickerProfile(id).size;
}
