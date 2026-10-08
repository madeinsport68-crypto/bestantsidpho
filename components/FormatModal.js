"use client";
import { FORMATS } from "../lib/ants";

// Étape 3 : choix du format de sortie, affiché après « Valider le cadrage ».
// `unavailable` : { idFormat: message } pour griser un format. Laisse la mention légale (pied de page, 3,5 rem) visible.
export default function FormatModal({ onPick, onClose, unavailable = {} }) {
  return (
    <div className="fixed inset-x-0 bottom-14 top-0 z-50 flex justify-center">
      <div className="flex w-full max-w-[520px] items-end bg-ink/70" onClick={onClose}>
        <div className="w-full space-y-3 rounded-t-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-extrabold tracking-tight">Format de sortie</h2>
          {Object.values(FORMATS).map((f) => {
            const why = unavailable[f.id];
            return (
              <button
                key={f.id}
                type="button"
                disabled={!!why}
                onClick={() => onPick(f.id)}
                className="flex w-full items-center gap-4 rounded-xl border-2 border-slate-200 p-4 text-left active:border-action active:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <div className="grid shrink-0 gap-1" style={{ gridTemplateColumns: `repeat(${f.cols}, 1fr)`, width: f.cols === 4 ? 88 : 54 }}>
                  {Array.from({ length: f.cols * f.rows }, (_, i) => (
                    <i key={i} className="block rounded-sm border border-slate-400 bg-swatch" style={{ aspectRatio: `${f.w} / ${f.h}` }} />
                  ))}
                </div>
                <div>
                  <p className="text-lg font-extrabold">{f.label}</p>
                  <p className="text-sm text-slate-600">Planche 10 × 15 cm · {f.info}</p>
                  {why && <p className="mt-1 text-sm font-semibold text-stop">{why}</p>}
                </div>
              </button>
            );
          })}
          <button type="button" onClick={onClose} className="h-12 w-full font-semibold text-slate-600">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
