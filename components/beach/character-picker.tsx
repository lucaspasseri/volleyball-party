"use client";

import { useRef, useState } from "react";
import { Camera, Check, SlidersHorizontal, Upload } from "lucide-react";
import {
  characterIds,
  maxPhotoBytes,
  defaultFace,
  template,
  type Photo,
  type Character,
  type CharacterId,
  type Face,
} from "@/lib/characters";
import { StickerArt } from "./sticker-art";

type Props = {
  initial: CharacterId;
  initialCharacter?: Character;
  photo: Photo | null;
  canEdit: boolean;
  hasProfilePhoto: boolean;
  onPhotoChange: (photo: Photo | null) => void;
  onPick: (id: CharacterId, character: Character) => void;
  onClose: () => void;
};
const adjustments = [
  { key: "zoom", name: "Zoom", min: 1, max: 4, step: 0.05 },
  { key: "x", name: "Horizontal", min: -1, max: 1, step: 0.02 },
  { key: "y", name: "Vertical", min: -1, max: 1, step: 0.02 },
  { key: "rotation", name: "Rotação", min: -45, max: 45, step: 1 },
] as const;

export default function CharacterPicker({
  initial,
  initialCharacter,
  photo,
  canEdit,
  hasProfilePhoto,
  onPhotoChange,
  onPick,
  onClose,
}: Props) {
  const photoId = photo?.photoId;
  const [pose, setPose] = useState(initial);
  const [face, setFace] = useState<Face>(
    initialCharacter && initialCharacter.photoId === photoId
      ? initialCharacter.face
      : defaultFace,
  );
  const [changing, setChanging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const file = useRef<HTMLInputElement>(null);
  async function changePhoto(
    action: "google" | "upload" | "remove",
    upload?: File,
  ) {
    if (busy) return;
    if (upload && upload.size > maxPhotoBytes) {
      setMessage("Escolha uma imagem de até 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const res =
        action === "remove"
          ? await fetch(`/api/character-photo/${photoId}`, { method: "DELETE" })
          : await fetch(`/api/character-photo?source=${action}`, {
              method: "POST",
              body: upload,
              headers: {
                ...(photoId ? { "x-previous-photo": photoId } : {}),
                ...(upload ? { "content-type": upload.type } : {}),
              },
            });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(
          data.message ?? "Não foi possível alterar a foto. Tente novamente.",
        );
        return;
      }
      onPhotoChange(action === "remove" ? null : await res.json());
      setChanging(false);
      setRemoving(false);
      setFace(defaultFace);
      setMessage(
        action === "remove"
          ? "Sua foto e seu personagem foram removidos."
          : "Foto pronta para a prévia.",
      );
    } catch {
      setMessage("A conexão caiu. Tente novamente.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <div className="character-picker">
      <div className="character-layout">
        <div className="character-preview" aria-label="Prévia">
          <span>Prévia</span>
          <StickerArt id={pose} {...photo} face={face} />
          <strong>{template(pose).name}</strong>
        </div>
        <div>
          <h4>Escolha sua pose</h4>
          <div
            className="album-grid character-grid"
            role="group"
            aria-label="Poses"
          >
            {characterIds.map((id) => (
              <button
                key={id}
                type="button"
                aria-label={template(id).name}
                aria-pressed={pose === id}
                onClick={() => setPose(id)}
              >
                <StickerArt id={id} {...photo} face={face} />
                {pose === id && (
                  <span className="album-ring">
                    <Check size={12} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      {canEdit && (!photoId || changing) && (
        <div className="photo-options">
          <p>
            {changing
              ? "Alterar a foto remove o personagem que usava a anterior. Você poderá posicioná-lo novamente."
              : "Escolha uma foto para experimentar as poses. A prévia é só sua."}
          </p>
          {hasProfilePhoto && (
            <button
              type="button"
              disabled={busy}
              onClick={() => changePhoto("google")}
            >
              <Camera size={17} /> Usar minha foto de perfil
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => file.current?.click()}
          >
            <Upload size={17} /> Enviar uma foto
          </button>
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Enviar uma foto"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void changePhoto("upload", f);
            }}
          />
          {changing && (
            <button disabled={busy} onClick={() => setChanging(false)}>
              Cancelar alteração
            </button>
          )}
          <small>JPG, PNG ou WebP · até 5 MB</small>
        </div>
      )}
      {photoId && (
        <>
          {canEdit && (
            <details className="face-settings">
              <summary>
                <SlidersHorizontal size={17} /> Ajustar foto
              </summary>
              <div>
                {adjustments.map(({ key, name, ...range }) => (
                  <label key={key}>
                    {name}
                    <input
                      type="range"
                      {...range}
                      value={face[key]}
                      onChange={(e) =>
                        setFace({ ...face, [key]: e.target.valueAsNumber })
                      }
                    />
                  </label>
                ))}
              </div>
              <button onClick={() => setFace(defaultFace)}>
                Restaurar enquadramento
              </button>
            </details>
          )}
          <div className="photo-controls">
            {canEdit && !changing && (
              <button
                disabled={busy}
                onClick={() => {
                  setChanging(true);
                  setRemoving(false);
                }}
              >
                Alterar foto
              </button>
            )}
            {!removing && (
              <button
                disabled={busy}
                onClick={() => {
                  setRemoving(true);
                  setChanging(false);
                }}
              >
                Remover minha foto
              </button>
            )}
            {removing && (
              <>
                <p>
                  Remover esta foto também remove seu personagem do cenário.
                </p>
                <button disabled={busy} onClick={() => changePhoto("remove")}>
                  Confirmar remoção
                </button>
                <button disabled={busy} onClick={() => setRemoving(false)}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </>
      )}
      <p role="status" className="photo-status">
        {busy ? "Processando…" : message}
      </p>
      <footer>
        {canEdit ? (
          <button
            className="button"
            disabled={!photoId || busy || removing || changing}
            onClick={() => photo && onPick(pose, { ...photo, face })}
          >
            Adicionar ao cenário
          </button>
        ) : (
          <a className="button" href="#presenca" onClick={onClose}>
            Confirmar presença para participar
          </a>
        )}
      </footer>
    </div>
  );
}
