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
  sole,
  zoneAt,
  zones,
  type GroundPosition,
  type Placement,
  type Point,
  type ZoneId,
} from "@/lib/beach";
import { stickers, stickerSrc, type StickerId } from "@/lib/stickers";

export function stickerStyle(zone: ZoneId, sticker: StickerId): CSSProperties {
  return {
    width: zones[zone].width * 100 + "%",
    transform: `translate(-50%, -${sole(sticker) * 100}%)`,
    "--sole": sole(sticker) * 100 + "%",
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
  const [previewZone, setPreviewZone] = useState<ZoneId | null>(null);
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
      onMove(destination(pointerGround(e), others, true));
    } else {
      x.jump(ground.x);
      y.jump(ground.y);
    }
    grip.current = null;
    setPreviewZone(null);
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
        className="beach-sticker-anchor draft-anchor"
        style={{
          ...stickerStyle(previewZone ?? draft.zone_id, draft.sticker_id),
          left,
          top,
        }}
      >
        <motion.button
          type="button"
          disabled={pending}
          aria-label={`Mover ${stickers[draft.sticker_id].name} com as setas`}
          className="draft-sticker"
          animate={{ scale: previewZone && !reduced ? 1.035 : 1 }}
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
            setPreviewZone(zoneAt(p));
            setCandidate(nearbyAnchor(p, others));
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
              ),
            );
          }}
        >
          <img src={stickerSrc(draft.sticker_id)} alt="" draggable={false} />
        </motion.button>
      </motion.div>
    </>
  );
}
