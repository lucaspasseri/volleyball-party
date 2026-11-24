"use client";

import { memo, useCallback, useId, useState } from "react";
import {
  defaultFace,
  photoFrame,
  isCharacter,
  template,
  type Face,
  type SceneStickerId,
} from "@/lib/characters";
import { stickerSrc } from "@/lib/stickers";

type Props = {
  id: SceneStickerId;
  photoId?: string | null;
  aspect?: number;
  face?: Face;
  size?: number;
};

// The photo and die-cut foreground share one intrinsic coordinate space, including during a drag.
export const StickerArt = memo(function StickerArt({
  id,
  photoId,
  aspect = 1,
  face = defaultFace,
  size,
}: Props) {
  const clip = useId();
  const [unavailable, setUnavailable] = useState<string>();
  // Start the request after hydration so an immediate 404 reaches the error handler.
  const attachPortrait = useCallback(
    (node: SVGImageElement | null) => {
      if (node && photoId)
        node.setAttribute("href", `/api/character-photo/${photoId}`);
    },
    [photoId],
  );
  if (!isCharacter(id))
    return (
      <img
        src={stickerSrc(id)}
        width={size}
        height={size}
        alt=""
        draggable={false}
      />
    );
  const art = template(id);
  const w = art.width * art.intrinsicWidth,
    h = art.height * art.intrinsicHeight;
  const x = art.x * art.intrinsicWidth,
    y = art.y * art.intrinsicHeight;
  const frame = photoFrame(w, h, aspect, art.rotation, face);
  return (
    <svg
      aria-hidden="true"
      className="character-art"
      viewBox={`0 0 ${art.intrinsicWidth} ${art.intrinsicHeight}`}
      width={size ?? "100%"}
      height={size ?? "100%"}
      focusable="false"
    >
      <defs>
        <clipPath id={clip}>
          <path d={art.maskPath} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#eeb67d" />
        <g
          transform={`translate(${x} ${y}) rotate(${art.rotation}) scale(${w / 100} ${h / 100})`}
          fill="#173e48"
        >
          <circle cx="-18" cy="-4" r="4" />
          <circle cx="18" cy="-4" r="4" />
          <path
            d="M-16 14 Q0 34 18 12"
            fill="none"
            stroke="#173e48"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        {photoId && photoId !== unavailable && (
          <g
            transform={`translate(${x} ${y}) rotate(${art.rotation + face.rotation})`}
          >
            <image
              ref={attachPortrait}
              onError={() => setUnavailable(photoId)}
              {...frame}
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        )}
      </g>
      <image
        href={art.src}
        width={art.intrinsicWidth}
        height={art.intrinsicHeight}
      />
    </svg>
  );
});
