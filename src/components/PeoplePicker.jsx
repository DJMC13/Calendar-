import { useEffect, useRef, useState } from 'react';
import { AREAS, areaById } from '../data.js';
import { inputCls } from './ui.jsx';

/*
 * Desplegable de colaboradores. Por ahora los nombres se agregan a mano
 */
export default function PeoplePicker({ people, selected, onToggle, onSelectAll, onClear, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name, areaId || null);
    setName(''); // se queda abierto para agregar varios seguidos
  };

  const chosen = people.filter((p) => selected.includes(p.id));

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
      >
        <span className={selected.length ? 'text-gray-900' : 'text-gray-500'}>
          {selected.length ? `${selected.length} colaborador(es) seleccionado(s)` : 'Seleccionar colaboradores'}
        </span>
        <span className="text-gray-500">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="mt-1 w-full rounded-xl border bg-white shadow-md">
          {people.length > 0 && (
            <div className="flex justify-between border-b px-3 py-2 text-xs">
              <button type="button" className="text-blue-600 hover:underline" onClick={onSelectAll}>Seleccionar todos</button>
              <button type="button" className="text-gray-500 hover:underline" onClick={onClear}>Limpiar</button>
            </div>
          )}

          <ul className="max-h-48 overflow-y-auto py-1">
            {people.length === 0 && <li className="px-3 py-3 text-sm text-gray-500">Aún no hay nombres. Usa «Agregar nombre».</li>}
            {people.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => onToggle(p.id)} />
                  <span className="flex-1 truncate">{p.name}</span>
                  {p.areaId && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{areaById(p.areaId).name}</span>}
                  <button
                    type="button"
                    title="Quitar de la lista"
                    className="rounded px-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(p.id);
                    }}
                  >
                    ✕
                  </button>
                </label>
              </li>
            ))}
          </ul>

          <div className="border-t p-2">
            {adding ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  className={inputCls}
                  placeholder="Nombre y apellido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
                />
                <div className="flex gap-2">
                  <select className={inputCls} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                    <option value="">Sin área (opcional)</option>
                    {AREAS.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={submit} className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
                    Añadir
                  </button>
                </div>
                <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => setAdding(false)}>
                  Cerrar
                </button>
              </div>
            ) : (
              <button type="button" className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50" onClick={() => setAdding(true)}>
                ＋ Agregar nombre
              </button>
            )}
          </div>
        </div>
      )}

      {chosen.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {chosen.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-800">
              {p.name}
              <button type="button" className="text-blue-400 hover:text-blue-800" onClick={() => onToggle(p.id)}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}