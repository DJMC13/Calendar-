import { useEffect, useRef, useState } from 'react';
import { fmt12, fmtDuration, parseTime, toMin } from '../data.js';

/**
 * Selector de hora estilo Google Calendar:
 */
export default function TimeSelect({ value, onChange, options, anchor }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null); // texto mientras el usuario escribe
  const wrap = useRef(null);
  const list = useRef(null);
  const selected = useRef(null);

  // hora de la lista más cercana al valor actual
  const nearest = options.reduce(
    (best, t) => (best === null || Math.abs(toMin(t) - toMin(value)) < Math.abs(toMin(best) - toMin(value)) ? t : best),
    null
  );

  // cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // al abrir, centrar la hora seleccionada
  useEffect(() => {
    if (open && list.current && selected.current) {
      list.current.scrollTop = selected.current.offsetTop - list.current.clientHeight / 2 + selected.current.clientHeight / 2;
    }
  }, [open]);

  const commit = () => {
    if (draft !== null) {
      const t = parseTime(draft);
      if (t) onChange(t);
      setDraft(null);
    }
  };

  const pick = (t) => {
    onChange(t);
    setDraft(null);
    setOpen(false);
  };

  return (
    <div ref={wrap} className="relative">
      <input
        value={draft ?? fmt12(value)}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onClick={() => setOpen(true)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            setOpen(false);
          }
          if (e.key === 'Escape') {
            e.stopPropagation();
            setDraft(null);
            setOpen(false);
          }
        }}
        className="w-28 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-center text-sm outline-none hover:bg-gray-100 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
        aria-label="Hora"
      />
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-44 rounded-lg border bg-white shadow-lg">
          <ul ref={list} className="relative max-h-56 overflow-y-auto py-1">
            {options.map((t) => (
              <li
                key={t}
                ref={t === nearest ? selected : null}
                onMouseDown={(e) => {
                  e.preventDefault(); // evita que el input pierda el foco antes de elegir
                  pick(t);
                }}
                className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 ${t === value ? 'bg-blue-50 font-medium text-blue-700' : ''}`}
              >
                {fmt12(t)}
                {anchor && <span className="ml-1 text-gray-500">({fmtDuration(toMin(t) - toMin(anchor))})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}