import { useState } from 'react';
import { Badge, projectTone } from './ui.jsx';
import { DAYS_SHORT, MONTHS, PROJECTS, addDays, addMonths, fromKey, monthStart, projectStats, startOfWeek, todayKey } from '../data.js';

function MiniCalendar({ cursor, meetings, onPick }) {
  const [shown, setShown] = useState(monthStart(cursor));
  const first = startOfWeek(shown);
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const today = todayKey();
  const dt = fromKey(shown);

  return (
    <div className="select-none">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-sm font-medium first-letter:uppercase">{MONTHS[dt.getMonth()]} {dt.getFullYear()}</span>
        <div className="flex gap-1 text-gray-600">
          <button className="rounded-full px-2 hover:bg-gray-100" onClick={() => setShown(addMonths(shown, -1))}>‹</button>
          <button className="rounded-full px-2 hover:bg-gray-100" onClick={() => setShown(addMonths(shown, 1))}>›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-gray-500">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="py-1">{d[0].toUpperCase()}</div>
        ))}
        {days.map((d) => {
          const has = meetings.some((m) => m.date === d);
          const inMonth = d.slice(0, 7) === shown.slice(0, 7);
          const sel = d === cursor;
          return (
            <button
              key={d}
              onClick={() => onPick(d)}
              className={`relative mx-auto my-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                d === today ? 'bg-blue-600 text-white' : sel ? 'bg-blue-100 text-blue-700' : inMonth ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              {fromKey(d).getDate()}
              {has && <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${d === today ? 'bg-white' : 'bg-blue-600'}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Barra lateral. Desde lg (≥1024px) es una columna fija.
 * En pantallas más chicas es un menú deslizable que se abre con ☰.
 */
export default function Sidebar({ open, onClose, cursor, meetings, hidden, onToggleProject, onPick, onCreate, onReset }) {
  return (
    <>
      {/* fondo oscuro (solo celular/tablet) */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-5 overflow-y-auto border-r bg-white p-3 shadow-xl transition-transform duration-200
          lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between lg:hidden">
          <span className="text-lg text-gray-700">Calendario de Reuniones</span>
          <button onClick={onClose} aria-label="Cerrar menú" className="rounded-full px-2 text-xl text-gray-500 hover:bg-gray-100">×</button>
        </div>

        <button onClick={() => onCreate()} className="flex items-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-medium shadow-md ring-1 ring-gray-200 hover:shadow-lg">
          <span className="text-xl leading-none text-blue-600">＋</span> Crear reunión
        </button>

        <MiniCalendar cursor={cursor} meetings={meetings} onPick={onPick} />

        <div>
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Proyectos</div>
          <div className="flex flex-col gap-3">
            {PROJECTS.map((p) => {
              const s = projectStats(p, meetings);
              const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <div key={p.id} className="rounded-lg border p-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={!hidden.includes(p.id)} onChange={() => onToggleProject(p.id)} style={{ accentColor: p.color }} />
                    <span className="truncate font-medium">{p.name}</span>
                  </label>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge tone={projectTone(s.status)}>{s.status}</Badge>
                    <span className="text-[11px] text-gray-500">{s.daysLeft < 0 ? `vencido ${-s.daysLeft}d` : `límite en ${s.daysLeft}d`}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    {s.done}/{s.total} requerimientos · {s.pending} pendientes
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={onReset} className="mt-auto self-start text-xs text-gray-500 underline hover:text-gray-800">
          Restablecer reuniones de ejemplo
        </button>
      </aside>
    </>
  );
}