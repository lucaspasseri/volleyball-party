// All scene geometry is measured against the same uncropped illustration.
export const beachArt = { width: 1536, height: 1024 } as const;
export const beachAspect = beachArt.width / beachArt.height;

export function artPoint(x: number, y: number) {
  return { x: x / beachArt.width, y: y / beachArt.height };
}
