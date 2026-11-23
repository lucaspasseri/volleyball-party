"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Check, MapPin, Sticker, UsersRound } from "lucide-react";
import { saveBeachSticker } from "@/app/actions/beach";
import {
  feet,
  placementAt,
  stickerNames,
  stickerSrc,
  suggestSpot,
  zones,
  type Placement,
  type GroundPosition,
  type SceneRow,
  type StickerId,
  type ZoneId,
} from "@/lib/beach";
import { SceneViewport, type CameraTarget } from "./scene-viewport";

const Gallery = dynamic(() => import("./sticker-gallery"));
type Props = {
  rows: SceneRow[];
  canEdit: boolean;
  shared: boolean;
  unavailable: boolean;
};
export function BeachExperience({ rows, canEdit, shared, unavailable }: Props) {
  const own = rows.find((r) => r.mine);
  const [album, setAlbum] = useState(false);
  const [draft, setDraft] = useState<Placement | null>(null);
  const [active, setActive] = useState<ZoneId | null>(null);
  const [focus, setFocus] = useState<CameraTarget | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [settled, setSettled] = useState(false);
  const count = rows.filter((r) => r.shared).length;
  const others = rows.filter((row) => !row.mine).map(feet);
  function pick(sticker_id: StickerId) {
    const zone_id = active ?? own?.zone_id ?? "quadras";
    const previous = draft ?? own;
    const next = previous
      ? { x: previous.x, y: previous.y, zone_id: previous.zone_id, sticker_id }
      : placementAt(suggestSpot(zone_id, others), sticker_id);
    setDraft(next);
    setActive(next.zone_id);
    setFocus({ point: next });
    setAlbum(false);
    setMessage("");
    setSettled(false);
  }
  function chooseZone(zone_id: ZoneId) {
    const point = draft
      ? suggestSpot(zone_id, others)
      : { ...zones[zone_id].anchors[0], zone_id };
    setActive(zone_id);
    setFocus({ point });
    if (draft && !pending) move(point);
  }
  function move(point: GroundPosition) {
    if (!draft || pending) return;
    setDraft(placementAt(point, draft.sticker_id));
    setActive(point.zone_id);
    setMessage("");
  }
  async function save() {
    if (!draft || pending) return;
    setPending(true);
    try {
      const result = await saveBeachSticker(draft);
      setMessage(result.message);
      if (result.ok) {
        setDraft(null);
        setSettled(true);
      }
    } catch {
      setMessage(
        "A conexão caiu. Seu rascunho continua aqui para tentar de novo.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="beach-experience">
      <div className="beach-actions">
        <div className="beach-participants">
          <UsersRound size={19} />
          {unavailable
            ? "Lista indisponível"
            : count === 0
              ? "A praia espera a turma"
              : `${count} ${count === 1 ? "figurinha" : "figurinhas"} na praia`}
        </div>
        <button
          className="beach-album-button"
          disabled={pending}
          onClick={() => setAlbum(true)}
        >
          <Sticker size={18} />
          {canEdit
            ? draft
              ? "Trocar figurinha"
              : own
                ? "Editar meu lugar"
                : "Escolher figurinha"
            : "Ver figurinhas"}
        </button>
      </div>
      {draft && canEdit && (
        <div className="beach-editor">
          <img
            src={stickerSrc(draft.sticker_id)}
            width="58"
            height="58"
            alt=""
          />
          <div>
            <strong>{stickerNames[draft.sticker_id]}</strong>
            <p>Escolha uma área, toque na areia ou arraste sua figurinha.</p>
            <small>
              {shared
                ? "Seu primeiro nome e sua figurinha ficarão visíveis na praia."
                : "Só você vê sua figurinha. A visibilidade é definida na confirmação de presença."}
            </small>
          </div>
          <div className="editor-buttons">
            <button
              className="button button-small"
              disabled={pending}
              onClick={save}
            >
              <Check size={17} />
              {pending ? "Guardando…" : "Guardar lugar"}
            </button>
            <button
              disabled={pending}
              onClick={() => {
                setDraft(null);
                setMessage("");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {message && (
        <p className="beach-feedback" aria-live="polite">
          {message}
        </p>
      )}
      {unavailable && (
        <p className="beach-feedback">
          Não conseguimos carregar as figurinhas. Recarregue para tentar de
          novo.
        </p>
      )}
      <SceneViewport
        rows={rows}
        draft={canEdit ? draft : null}
        others={others}
        pending={pending}
        active={active}
        focus={focus}
        onZone={chooseZone}
        onMove={move}
        settled={settled}
      />
      {!canEdit && !unavailable && (
        <p className="beach-invite">
          <MapPin size={17} />
          <span>
            Quer aparecer por aqui?{" "}
            <a href="#presenca">Confirme sua presença.</a>
          </span>
        </p>
      )}
      {album && (
        <Gallery
          initial={draft?.sticker_id ?? own?.sticker_id ?? "levantadora"}
          canEdit={canEdit}
          onPick={pick}
          onClose={() => setAlbum(false)}
        />
      )}
    </div>
  );
}
