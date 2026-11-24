"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type RefObject,
} from "react";
import {
  destination,
  feet,
  nearbyAnchor,
  playable,
  scenePoint,
  type GroundPosition,
  type Placement,
  type Point,
} from "@/lib/beach";
import bounds from "@/lib/sticker-bounds.json";
import {
  canopyShade,
  depthOrder,
  stickerProfile,
  stickerWidth,
} from "@/lib/beach-perspective";
import {
  isCharacter,
  template,
  sceneSticker,
  type SceneStickerId as StickerId,
} from "@/lib/characters";
import { StickerArt } from "./sticker-art";

const percent = (fraction: number) => fraction * 100 + "%";
function profileStyle(id: StickerId): CSSProperties {
  const { anchor, shadowWidth, shadowHeight, shadowOpacity } =
    stickerProfile(id);
  const [left, top, right, bottom] = isCharacter(id)
    ? template(id).bounds
    : ((bounds as Partial<Record<StickerId, number[]>>)[id] ?? [
        0, 0, 256, 256,
      ]);
  return {
    "--hit-x": percent((left + right) / 512),
    "--hit-y": percent((top + bottom) / 512),
    "--hit-width": percent((right - left) / 256),
    "--hit-height": percent((bottom - top) / 256),
    transform: `translate(-${percent(anchor.x)}, -${percent(anchor.y)})`,
    "--anchor-x": percent(anchor.x),
    "--anchor-y": percent(anchor.y),
    "--shadow-width": percent(shadowWidth),
    "--shadow-height": percent(shadowHeight),
    "--shadow-opacity": shadowOpacity,
  } as CSSProperties;
}
function waterMask(point: Point, id: StickerId) {
  const { pose, anchor } = stickerProfile(id);
  if (pose !== "swimming") return "none";
  const shoreline = (305 - 175 * point.x) / 1024;
  // Let a swimmer emerge gradually over the last strip of wet sand.
  const edge = anchor.y + 0.06 + Math.max(0, point.y - shoreline) * 16;
  return `linear-gradient(black ${percent(edge - 0.025)}, transparent ${percent(edge + 0.025)})`;
}
function lighting(p: Point) {
  return `saturate(.91) brightness(${1 - 0.115 * canopyShade(p)})`;
}
export function stickerStyle(point: Point, id: StickerId): CSSProperties {
  return {
    ...profileStyle(id),
    left: percent(point.x),
    top: percent(point.y),
    width: percent(stickerWidth(point, id)),
    zIndex: depthOrder(point),
    "--sunlight": lighting(point),
    "--water-mask": waterMask(point, id),
  } as CSSProperties;
}

type Props = {
  draft: Placement;
  stage: RefObject<HTMLDivElement | null>;
  others: Point[];
  pending: boolean;
  onMove: (point: GroundPosition) => void;
};
export function DraftSticker({ draft, stage, others, pending, onMove }: Props) {
  const ground = feet(draft);
  const x = useMotionValue(ground.x);
  const y = useMotionValue(ground.y);
  const left = useTransform(x, (n) => n * 100 + "%");
  const top = useTransform(y, (n) => n * 100 + "%");
  const reduced = useReducedMotion();
  const grip = useRef<{
    id: number;
    offset: Point;
    start: Point;
    moved: boolean;
  } | null>(null);
  const id = draft.sticker_id;
  const width = useTransform(() =>
    percent(stickerWidth({ x: x.get(), y: y.get() }, id)),
  );
  const zIndex = useTransform(() => depthOrder({ x: x.get(), y: y.get() }));
  const light = useTransform(() => lighting({ x: x.get(), y: y.get() }));
  const immersion = useTransform(() =>
    waterMask({ x: x.get(), y: y.get() }, id),
  );
  const geometry = { ...profileStyle(id), left, top, width };
  const [candidate, setCandidate] = useState<Point | undefined>();
  const spring = useRef(false);

  useLayoutEffect(() => {
    if (spring.current && !reduced) {
      const transition = {
        type: "spring" as const,
        stiffness: 490,
        damping: 40,
        restDelta: 0.0001,
        restSpeed: 0.001,
      };
      animate(x, ground.x, transition);
      animate(y, ground.y, transition);
    } else {
      x.jump(ground.x);
      y.jump(ground.y);
    }
    spring.current = false;
  }, [draft, ground.x, ground.y, reduced, x, y]);
  useEffect(
    () => () => {
      x.stop();
      y.stop();
    },
    [x, y],
  );

  function pointerGround(e: PointerEvent<HTMLButtonElement>) {
    const p = scenePoint(
      { x: e.clientX, y: e.clientY },
      stage.current!.getBoundingClientRect(),
    );
    const { offset } = grip.current!;
    return playable({ x: p.x - offset.x, y: p.y - offset.y });
  }
  function finish(e: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const drag = grip.current;
    if (!drag || e.pointerId !== drag.id) return;
    if (!cancelled && drag.moved) {
      spring.current = true;
      onMove(destination(pointerGround(e), others, true, id));
    } else {
      x.jump(ground.x);
      y.jump(ground.y);
    }
    grip.current = null;
    setCandidate(undefined);
  }
  return (
    <>
      {candidate && (
        <span
          aria-hidden="true"
          className="beach-snap-target"
          style={{
            left: candidate.x * 100 + "%",
            top: candidate.y * 100 + "%",
          }}
        />
      )}
      <motion.div
        aria-hidden="true"
        className="beach-sticker-anchor draft-anchor"
        style={{ ...geometry, zIndex }}
      >
        <motion.div
          className="draft-art"
          style={{ filter: light, maskImage: immersion }}
        >
          <StickerArt id={id} {...draft.character} />
        </motion.div>
      </motion.div>
      <motion.div
        className="beach-sticker-anchor draft-control"
        style={geometry}
      >
        <button
          type="button"
          disabled={pending}
          aria-label={`Mover ${sceneSticker(id).name} com as setas`}
          className="draft-sticker"
          onPointerDown={(e) => {
            if (!e.isPrimary || e.button !== 0 || grip.current) return;
            const start = { x: e.clientX, y: e.clientY };
            const p = scenePoint(start, stage.current!.getBoundingClientRect());
            x.stop();
            y.stop();
            grip.current = {
              id: e.pointerId,
              offset: { x: p.x - x.get(), y: p.y - y.get() },
              start,
              moved: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const drag = grip.current;
            if (!drag || e.pointerId !== drag.id) return;
            if (
              !drag.moved &&
              Math.hypot(e.clientX - drag.start.x, e.clientY - drag.start.y) < 3
            )
              return;
            drag.moved = true;
            const p = pointerGround(e);
            x.jump(p.x);
            y.jump(p.y);
            setCandidate(nearbyAnchor(p, others, id));
          }}
          onPointerUp={(e) => finish(e)}
          onLostPointerCapture={(e) => finish(e, true)}
          onPointerCancel={(e) => finish(e, true)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.035 : 0.008;
            const offsets: Record<string, Point> = {
              ArrowUp: { x: 0, y: -step },
              ArrowDown: { x: 0, y: step },
              ArrowLeft: { x: -step, y: 0 },
              ArrowRight: { x: step, y: 0 },
            };
            const offset = offsets[e.key];
            if (!offset) return;
            e.preventDefault();
            onMove(
              destination(
                { x: ground.x + offset.x, y: ground.y + offset.y },
                others,
                false,
                id,
              ),
            );
          }}
        />
      </motion.div>
    </>
  );
}
