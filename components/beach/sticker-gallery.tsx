"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import {
  stickerGroups,
  stickerNames,
  stickerSrc,
  type StickerId,
} from "@/lib/beach";

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
  const [selected, select] = useState(initial);
  const group = stickerGroups.find(({ ids }) => ids.includes(selected))!;
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
        <div className="album-filters" role="group" aria-label="Atividades">
          {stickerGroups.map((item) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={item === group}
              onClick={() => {
                if (item !== group) select(item.ids[0]);
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
              initial={{ scale: 0.88, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 310, damping: 16 }}
              src={stickerSrc(selected)}
              alt=""
            />
            <strong>{stickerNames[selected]}</strong>
          </div>
          <div
            className="album-grid"
            role="group"
            aria-label={`Figurinhas · ${group.name}`}
          >
            {group.ids.map((id) => (
              <motion.button
                key={id}
                type="button"
                aria-label={stickerNames[id]}
                aria-pressed={id === selected}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => select(id)}
              >
                <img src={stickerSrc(id)} alt="" width="88" height="88" />
                {selected === id && (
                  <motion.span layoutId="album-ring" className="album-ring">
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
