"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Armchair,
  Sofa,
  Crosshair,
  Footprints,
  Map,
  Minus,
  Plus,
  RotateCcw,
  Snowflake,
  Tent,
  Volleyball,
  Waves,
  Shell,
  X,
} from "lucide-react";
import {
  destination,
  feet,
  scenePoint,
  zoneIds,
  zones,
  type GroundPosition,
  type Placement,
  type Point,
  type SceneRow,
  type ZoneId,
} from "@/lib/beach";
import { stickers, stickerSrc } from "@/lib/stickers";
import foreground from "@/lib/beach-foreground.json";
import {
  depthOrder,
  stickerProfile,
  stickerWidth,
} from "@/lib/beach-perspective";
import { DraftSticker, stickerStyle } from "./scene-sticker";

const icons = {
  quadras: Volleyball,
  gazebo: Tent,
  coolers: Snowflake,
  cadeiras: Armchair,
  torcida: Sofa,
  "beira-mar": Shell,
  mar: Waves,
  calcadao: Footprints,
};
export type CameraTarget = { point: Point };
type Props = {
  rows: SceneRow[];
  draft: Placement | null;
  active: ZoneId | null;
  focus: CameraTarget | null;
  onZone: (id: ZoneId) => void;
  others: Point[];
  pending: boolean;
  onMove: (p: GroundPosition) => void;
  settled: boolean;
};
export function SceneViewport({
  rows,
  draft,
  active,
  focus,
  onZone,
  onMove,
  others,
  pending,
  settled,
}: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [artState, setArtState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const attachArt = useCallback((image: HTMLImageElement | null) => {
    // A cached picture can finish loading before React hydrates the map.
    if (image?.complete && image.currentSrc) {
      setArtState(image.naturalWidth ? "ready" : "error");
    }
  }, []);
  const reduced = useReducedMotion();
  const center = (p: Point, smooth = false) => {
    const el = viewport.current!,
      art = stage.current!;
    el.scrollTo({
      left: p.x * art.offsetWidth - el.clientWidth / 2,
      top: p.y * art.offsetHeight - el.clientHeight / 2,
      behavior: smooth && !reduced ? "smooth" : "instant",
    });
  };
  const zoomCenter = useRef<Point | null>(null);
  useLayoutEffect(() => {
    if (zoomCenter.current) {
      center(zoomCenter.current);
      zoomCenter.current = null;
    }
  }, [zoom]); // The camera targets the same artwork point after changing its physical size.
  useEffect(() => {
    if (!focus) return;
    if (viewport.current!.clientWidth < 600 && zoom === 1) {
      zoomCenter.current = focus.point;
      setZoom(2);
    } else {
      center(focus.point, true);
    }
  }, [focus]);
  const changeZoom = (next: number) => {
    const el = viewport.current!,
      art = stage.current!;
    zoomCenter.current = {
      x: (el.scrollLeft + el.clientWidth / 2) / art.offsetWidth,
      y: (el.scrollTop + el.clientHeight / 2) / art.offsetHeight,
    };
    setZoom(next);
  };
  const selectZone = (id: ZoneId) => {
    setGuestId(null);
    onZone(id);
  };
  const mine = draft ?? rows.find((r) => r.mine);
  const guest = rows.find((r) => r.id === guestId && !(draft && r.mine));
  const down = useRef<Point | null>(null);
  return (
    <div className="beach-map">
      <div className="beach-map-bar">
        <div className="map-name">
          <Map size={20} />
          <strong>Praia de Copacabana</strong>
        </div>
        <div className="map-tools">
          {mine && (
            <button
              className="beach-icon"
              title="Centralizar minha figurinha"
              aria-label="Centralizar minha figurinha"
              onClick={() => center(feet(mine), true)}
            >
              <Crosshair />
            </button>
          )}
          <button
            className="beach-icon"
            aria-label="Diminuir zoom"
            disabled={zoom === 1}
            onClick={() => changeZoom(zoom - 0.5)}
          >
            <Minus />
          </button>
          <span className="zoom-label">{zoom * 100}%</span>
          <button
            className="beach-icon"
            aria-label="Aumentar zoom"
            disabled={zoom === 2}
            onClick={() => changeZoom(zoom + 0.5)}
          >
            <Plus />
          </button>
          <button
            className="beach-icon"
            aria-label="Restaurar vista inicial"
            title="Restaurar vista inicial"
            onClick={() => {
              zoomCenter.current = { x: 0, y: 0 };
              setZoom(1);
              center({ x: 0, y: 0 });
            }}
          >
            <RotateCcw />
          </button>
        </div>
      </div>
      <div
        className="beach-camera"
        ref={viewport}
        aria-label="Mapa ilustrado da festa"
        tabIndex={0}
      >
        <div
          ref={stage}
          className={`beach-stage${draft ? " is-placing" : ""}`}
          style={{ width: zoom * 100 + "%" }}
          onPointerDown={(e) => {
            down.current = { x: e.clientX, y: e.clientY };
          }}
          onClick={(e) => {
            if ((e.target as Element).closest("button") || !down.current)
              return;
            if (
              Math.hypot(
                e.clientX - down.current.x,
                e.clientY - down.current.y,
              ) > 6
            )
              return;
            setGuestId(null);
            if (draft)
              onMove(
                destination(
                  scenePoint(
                    { x: e.clientX, y: e.clientY },
                    e.currentTarget.getBoundingClientRect(),
                  ),
                  others,
                  true,
                  draft.sticker_id,
                ),
              );
          }}
        >
          <picture>
            {zoom === 1 && (
              <source
                media="(max-width: 700px)"
                srcSet="/beach/copacabana-small.webp"
              />
            )}
            <img
              ref={attachArt}
              className="beach-art"
              src="/beach/copacabana.webp"
              srcSet="/beach/copacabana-small.webp 1000w, /beach/copacabana.webp 1536w"
              sizes={
                zoom > 1
                  ? "200vw"
                  : "(max-width: 700px) 700px, (max-width: 1300px) 92vw, 1200px"
              }
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={() => setArtState("ready")}
              onError={() => setArtState("error")}
              alt="Na praia de Copacabana, famílias passeiam à beira-mar. Amigos conversam entre as duas quadras e o gazebo branco com coolers. Há cadeiras de praia à direita, bancos à esquerda e pedestres no calçadão."
            />
          </picture>
          {artState === "error" && (
            <div className="beach-image-error">
              A ilustração não carregou. Explore pelos nomes das áreas abaixo.
            </div>
          )}
          {artState === "ready" &&
            (rows.length > 0 || draft) &&
            foreground.regions.map(({ id, x, y, w, h, top, contact }) => (
              <span
                key={id}
                aria-hidden="true"
                className="beach-foreground"
                style={{
                  left: (x / 1536) * 100 + "%",
                  top: (y / 1024) * 100 + "%",
                  width: (w / 1536) * 100 + "%",
                  height: (h / 1024) * 100 + "%",
                  backgroundSize: `${(foreground.width / w) * 100}% ${(foreground.height / h) * 100}%`,
                  backgroundPosition: `0 ${(top / (foreground.height - h)) * 100}%`,
                  zIndex: depthOrder({
                    x: contact[0] / 1536,
                    y: contact[1] / 1024,
                  }),
                }}
              />
            ))}
          {rows
            .filter((row) => !(row.mine && draft))
            .map((row) => (
              <div
                key={row.id}
                className="beach-sticker-anchor"
                style={stickerStyle(feet(row), row.sticker_id)}
              >
                <motion.button
                  className="placed-sticker"
                  aria-label={`Figurinha de ${row.name}`}
                  aria-expanded={guestId === row.id}
                  initial={
                    row.mine && settled && !reduced
                      ? { scale: 0.65, rotate: -10 }
                      : false
                  }
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10 }}
                  whileHover={reduced ? undefined : { scale: 1.04 }}
                  onClick={() => {
                    setGuestId(guestId === row.id ? null : row.id);
                    center(feet(row), true);
                  }}
                >
                  <img
                    src={stickerSrc(row.sticker_id)}
                    alt=""
                    draggable={false}
                  />
                </motion.button>
              </div>
            ))}
          {guest && (
            <span
              className="guest-tag"
              style={{
                left: guest.x * 100 + "%",
                top:
                  (feet(guest).y -
                    1.5 *
                      stickerWidth(feet(guest), guest.sticker_id) *
                      stickerProfile(guest.sticker_id).anchor.y) *
                    100 +
                  "%",
              }}
            >
              {guest.name} · {zones[guest.zone_id].name}
            </span>
          )}
          {draft && (
            <DraftSticker
              draft={draft}
              stage={stage}
              onMove={onMove}
              others={others}
              pending={pending}
            />
          )}
        </div>
      </div>
      <div className="beach-legend" aria-label="Áreas da praia">
        {zoneIds.map((id) => {
          const Icon = icons[id];
          return (
            <button
              key={id}
              disabled={pending}
              aria-pressed={active === id}
              onClick={() => selectZone(id)}
            >
              <Icon size={17} />
              {zones[id].name}
            </button>
          );
        })}
      </div>
      <div className="beach-discovery" aria-live="polite">
        {guest ? (
          <>
            <img
              src={stickerSrc(guest.sticker_id)}
              width="46"
              height="46"
              alt=""
            />
            <div>
              <strong>
                {guest.name}
                {guest.mine && " · você"}
              </strong>
              <p>
                {stickers[guest.sticker_id].name} · {zones[guest.zone_id].name}
              </p>
            </div>
            <button
              className="beach-icon"
              onClick={() => setGuestId(null)}
              aria-label="Fechar detalhes"
            >
              <X />
            </button>
          </>
        ) : (
          <>
            <Footprints size={22} />
            <div>
              {active ? (
                <>
                  <strong>{zones[active].name}</strong>
                  <p>{zones[active].line}</p>
                </>
              ) : (
                <p>
                  <span className="beach-pan-hint">
                    Amplie para ver de perto.{" "}
                  </span>
                  Escolha uma área para explorar a praia.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
