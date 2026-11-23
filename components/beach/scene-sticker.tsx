"use client";

import { motion, useMotionValue } from "motion/react";
import { useRef, type RefObject } from "react";
import {
  bound,
  dropPoint,
  nearestZone,
  scenePoint,
  stickerNames,
  stickerSrc,
  type Placement,
  type Point,
  type ZoneId,
} from "@/lib/beach";

type Props = {
  draft: Placement;
  stage: RefObject<HTMLDivElement | null>;
  onMove: (point: Point) => void;
  onNearby: (zone: ZoneId | null) => void;
};
export function DraftSticker({ draft, stage, onMove, onNearby }: Props) {
  const grip = useRef<Point>({ x: 0, y: 0 });
  const last = useRef<ZoneId | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const fromEvent = (event: PointerEvent) =>
    dropPoint(
      { x: event.clientX, y: event.clientY },
      stage.current!.getBoundingClientRect(),
      grip.current,
    );
  return (
    <div
      className="beach-sticker-anchor draft-anchor"
      style={{ left: draft.x * 100 + "%", top: draft.y * 100 + "%" }}
    >
      <motion.button
        aria-label={`Mover ${stickerNames[draft.sticker_id]} com as setas`}
        className="draft-sticker"
        style={{ x, y, touchAction: "none" }}
        drag
        dragConstraints={stage}
        dragMomentum={false}
        dragElastic={0}
        whileDrag={{
          scale: 1.12,
          filter: "drop-shadow(0px 8px 5px #173e5266)",
        }}
        onPointerDown={(event) => {
          const p = scenePoint(
            { x: event.clientX, y: event.clientY },
            stage.current!.getBoundingClientRect(),
          );
          grip.current = { x: p.x - draft.x, y: p.y - draft.y };
        }}
        onDrag={(event) => {
          const zone = nearestZone(fromEvent(event as PointerEvent));
          if (last.current !== zone) {
            last.current = zone;
            onNearby(zone);
          }
        }}
        onDragEnd={(event) => {
          const destination = fromEvent(event as PointerEvent);
          x.jump(0);
          y.jump(0);
          last.current = null;
          onNearby(null);
          onMove(destination);
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.035 : 0.008;
          const offsets: Record<string, Point> = {
            ArrowUp: { x: 0, y: -step },
            ArrowDown: { x: 0, y: step },
            ArrowLeft: { x: -step, y: 0 },
            ArrowRight: { x: step, y: 0 },
          };
          const offset = offsets[event.key];
          if (offset) {
            event.preventDefault();
            onMove(bound({ x: draft.x + offset.x, y: draft.y + offset.y }));
          }
        }}
      >
        <img src={stickerSrc(draft.sticker_id)} alt="" draggable={false} />
      </motion.button>
    </div>
  );
}
