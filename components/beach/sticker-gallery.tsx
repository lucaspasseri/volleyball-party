"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import {
  stickerCollections,
  stickerIds,
  stickers,
  stickerSrc,
  type StickerId,
} from "@/lib/stickers";

import CharacterPicker from "./character-picker";
import {
  characterIds,
  isCharacter,
  type Photo,
  type Character,
  type SceneStickerId,
} from "@/lib/characters";
import { isTribute, tributes } from "@/lib/tribute-stickers";

type Props = {
  initial: SceneStickerId;
  initialCharacter?: Character;
  photo: Photo | null;
  hasProfilePhoto: boolean;
  onPhotoChange: () => void;
  canEdit: boolean;
  onPick: (id: SceneStickerId, character?: Character) => void;
  onClose: () => void;
};
export default function StickerGallery({
  initial,
  initialCharacter,
  photo,
  hasProfilePhoto,
  onPhotoChange,
  canEdit,
  onPick,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const [personal, setPersonal] = useState(isCharacter(initial));
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [selected, select] = useState<StickerId>(
    isCharacter(initial) ? "levantadora" : initial,
  );
  const [showAll, setShowAll] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);
  const collection = stickerCollections.find(({ ids }) =>
    ids.includes(selected),
  )!;
  const filters = collection.showAll
    ? [{ name: "Todas", ids: collection.ids }, ...collection.groups]
    : collection.groups;
  const group = browseAll
    ? { name: "Todos", ids: stickerIds }
    : showAll && collection.showAll
      ? filters[0]
      : (collection.groups.find(({ ids }) => ids.includes(selected)) ??
        collection);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    el.querySelector(
      '.album-collections [aria-pressed="true"]',
    )?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
    });
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="sticker-album"
      aria-labelledby="album-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="album-content">
        <header>
          <div>
            <p className="beach-kicker">Álbum da festa</p>
            <h3 id="album-title">
              {personal ? "Crie seu personagem" : "Escolha sua figurinha"}
            </h3>
          </div>
          <button
            className="beach-icon"
            aria-label="Fechar álbum"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <div className="album-collections" role="group" aria-label="Coleções">
          <button
            type="button"
            aria-pressed={!personal && browseAll}
            onClick={() => {
              setBrowseAll(true);
              setPersonal(false);
            }}
          >
            Todos
          </button>
          <button
            type="button"
            aria-pressed={personal}
            onClick={() => setPersonal(true)}
          >
            Meu personagem <span aria-hidden="true">{characterIds.length}</span>
          </button>
          {stickerCollections.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={
                !personal && !browseAll && item.id === collection.id
              }
              onClick={() => {
                setPersonal(false);
                setBrowseAll(false);
                if (item.id === collection.id && !browseAll) return;
                select(item.ids[0]);
                setShowAll(item.showAll);
              }}
            >
              {item.name}
              <span aria-hidden="true">{item.ids.length}</span>
            </button>
          ))}
        </div>
        {personal ? (
          <CharacterPicker
            initial={isCharacter(initial) ? initial : characterIds[0]}
            initialCharacter={initialCharacter}
            canEdit={canEdit}
            photo={currentPhoto}
            hasProfilePhoto={hasProfilePhoto}
            onPhotoChange={(id) => {
              setCurrentPhoto(id);
              onPhotoChange();
            }}
            onPick={onPick}
            onClose={onClose}
          />
        ) : (
          <>
            {!browseAll && filters.length > 0 && (
              <div
                className="album-filters"
                role="group"
                aria-label="Categorias"
              >
                {filters.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    aria-pressed={item === group}
                    onClick={() => {
                      setShowAll(item.ids === collection.ids);
                      if (!item.ids.includes(selected)) select(item.ids[0]);
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
            <div className="album-layout">
              <div className="album-preview">
                <motion.img
                  key={selected}
                  initial={reduced ? false : { scale: 0.88, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 310, damping: 16 }}
                  src={stickerSrc(selected)}
                  alt={
                    isTribute(selected) ? tributes[selected].description : ""
                  }
                />
                <strong>{stickers[selected].name}</strong>
              </div>
              <div
                key={group.name}
                className="album-grid"
                role="group"
                aria-label={`Figurinhas · ${group.name}`}
              >
                {group.ids.map((id) => (
                  <motion.button
                    key={id}
                    type="button"
                    aria-label={stickers[id].name}
                    aria-pressed={id === selected}
                    whileHover={reduced ? undefined : { y: -2 }}
                    whileTap={reduced ? undefined : { scale: 0.94 }}
                    onClick={() => select(id)}
                  >
                    <img
                      src={stickerSrc(id)}
                      alt=""
                      width="88"
                      height="88"
                      loading="lazy"
                      decoding="async"
                    />
                    {selected === id && (
                      <motion.span
                        layoutId={reduced ? undefined : "album-ring"}
                        className="album-ring"
                      >
                        <Check size={12} />
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            <footer>
              {canEdit ? (
                <button className="button" onClick={() => onPick(selected)}>
                  Usar esta figurinha
                </button>
              ) : (
                <a href="#presenca" className="button" onClick={onClose}>
                  Confirmar presença para participar
                </a>
              )}
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}
