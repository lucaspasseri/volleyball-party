"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Armchair,
  Binoculars,
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
  X,
} from "lucide-react";
import {
  bound,
  scenePoint,
  stickerNames,
  stickerSrc,
  zoneIds,
  zones,
  type Placement,
  type Point,
  type SceneRow,
  type ZoneId,
} from "@/lib/beach";
import { DraftSticker } from "./scene-sticker";

const reactions = {
  quadras: { y: [0, -16, 0, -7, 0] },
  gazebo: { rotate: [0, -10, 8, 0] },
  coolers: { scale: [1, 0.85, 1.18, 1] },
  cadeiras: { rotate: [0, 10, -7, 0] },
  torcida: { y: [0, -6, 0, -6, 0] },
  "beira-mar": { rotate: [0, -12, 12, 0] },
};
const icons = {
  quadras: Volleyball,
  gazebo: Tent,
  coolers: Snowflake,
  cadeiras: Armchair,
  torcida: Binoculars,
  "beira-mar": Waves,
};
export type CameraTarget = { point: Point };
type Props = {
  rows: SceneRow[];
  draft: Placement | null;
  active: ZoneId | null;
  focus: CameraTarget | null;
  onZone: (id: ZoneId) => void;
  onMove: (p: Point) => void;
  settled: boolean;
};
export function SceneViewport({
  rows,
  draft,
  active,
  focus,
  onZone,
  onMove,
  settled,
}: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [nearby, setNearby] = useState<ZoneId | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [beat, setBeat] = useState(0);
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
    if (focus) center(focus.point, true);
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
    setBeat((n) => n + 1);
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
              onClick={() => center(mine, true)}
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
          style={{ width: `max(${zoom * 100}%, ${zoom * 700}px)` }}
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
                bound(
                  scenePoint(
                    { x: e.clientX, y: e.clientY },
                    e.currentTarget.getBoundingClientRect(),
                  ),
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
              onLoad={() => setFailed(false)}
              onError={() => setFailed(true)}
              alt="Festa ilustrada em Copacabana, com duas quadras, gazebo, cadeiras e banhistas junto ao mar."
            />
          </picture>
          {failed && (
            <div className="beach-image-error">
              A ilustração não carregou. Explore pelos nomes das áreas abaixo.
            </div>
          )}
          {zoneIds.map((id) => {
            const zone = zones[id],
              Icon = icons[id],
              chosen = (nearby ?? active) === id;
            return (
              <button
                key={id}
                className={`zone-pin${chosen ? " chosen" : ""}`}
                style={{ left: zone.x * 100 + "%", top: zone.y * 100 + "%" }}
                aria-label={`Explorar ${zone.name}`}
                aria-pressed={chosen}
                onClick={() => selectZone(id)}
              >
                <motion.span
                  key={chosen ? beat : "idle"}
                  whileHover={{ scale: 1.09 }}
                  animate={
                    chosen && beat && !reduced ? reactions[id] : { y: 0 }
                  }
                >
                  <Icon size={19} />
                </motion.span>
                {chosen && !draft && !guest && (
                  <span className="zone-tag">{zone.name}</span>
                )}
              </button>
            );
          })}
          {rows
            .filter((row) => !(row.mine && draft))
            .map((row) => (
              <div
                key={row.id}
                className="beach-sticker-anchor"
                style={{ left: row.x * 100 + "%", top: row.y * 100 + "%" }}
              >
                <motion.button
                  className="placed-sticker"
                  aria-label={`Figurinha de ${row.name}`}
                  aria-expanded={guestId === row.id}
                  initial={
                    row.mine && settled ? { scale: 0.65, rotate: -10 } : false
                  }
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => {
                    setGuestId(guestId === row.id ? null : row.id);
                    center(row, true);
                  }}
                >
                  <img
                    src={stickerSrc(row.sticker_id)}
                    alt=""
                    draggable={false}
                  />
                </motion.button>
                {guest?.id === row.id && (
                  <span className="guest-tag">
                    {row.name} · {zones[row.zone_id].name}
                  </span>
                )}
              </div>
            ))}
          {draft && (
            <DraftSticker
              draft={draft}
              stage={stage}
              onMove={onMove}
              onNearby={setNearby}
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
                {stickerNames[guest.sticker_id]} · {zones[guest.zone_id].name}
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
                    Deslize para explorar.{" "}
                  </span>
                  Toque nos símbolos para descobrir os cantinhos da festa.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
