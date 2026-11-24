"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import {
  stickerCollections,
  stickers,
  stickerSrc,
  type StickerId,
} from "@/lib/stickers";

type Props = {
  initial: StickerId;
  canEdit: boolean;
  onPick: (id: StickerId) => void;
  onClose: () => void;
};
export default function StickerGallery({
  initial,
  canEdit,
  onPick,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const [selected, select] = useState(initial);
  const [showAll, setShowAll] = useState(false);
  const collection = stickerCollections.find(({ ids }) =>
    ids.includes(selected),
  )!;
  const filters = collection.showAll
    ? [{ name: "Todas", ids: collection.ids }, ...collection.groups]
    : collection.groups;
  const group = showAll
    ? filters[0]
    : collection.groups.find(({ ids }) => ids.includes(selected))!;
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
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
            <h3 id="album-title">Escolha sua figurinha</h3>
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
          {stickerCollections.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item === collection}
              onClick={() => {
                if (item === collection) return;
                select(item.ids[0]);
                setShowAll(item.showAll);
              }}
            >
              {item.name}
              <span aria-hidden="true">{item.ids.length}</span>
            </button>
          ))}
        </div>
        <div className="album-filters" role="group" aria-label="Categorias">
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
        <div className="album-layout">
          <div className="album-preview">
            <motion.img
              key={selected}
              initial={reduced ? false : { scale: 0.88, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 310, damping: 16 }}
              src={stickerSrc(selected)}
              alt=""
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
      </div>
    </dialog>
  );
}
