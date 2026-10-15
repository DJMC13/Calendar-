import { Badge, projectTone } from './ui.jsx';
import { fmt12, fmtLong } from '../data.js';

const PRIORITY_TONE = { Alta: 'red', Media: 'amber', Baja: 'blue' };

export default function ProposalsPanel({ proposals, people, onSchedule, onDismiss, onClose }) {
  return (
    <aside className="flex w-[400px] shrink-0 flex-col border-l bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">Propuestas de reunión</h2>
          <p className="text-xs text-gray-500">Según reuniones, estado del proyecto, fecha límite y requerimientos</p>
        </div>
        <button onClick={onClose} className="rounded-full px-2 text-xl text-gray-500 hover:bg-gray-100">×</button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {proposals.length === 0 && (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">No hay propuestas: los proyectos están al día con sus reuniones.</div>
        )}

        {proposals.map((p) => {
          const names = p.collabIds.map((id) => people.find((x) => x.id === id)?.name).filter(Boolean);
          return (
            <div key={p.project.id} className="rounded-xl border p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.project.color }} />
                  {p.project.name}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Badge tone={PRIORITY_TONE[p.priority]}>Prioridad {p.priority}</Badge>
                  <Badge tone={projectTone(p.stats.status)}>{p.stats.status}</Badge>
                </div>
              </div>

              <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-gray-600">
                {p.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>

              <div className="mt-3 text-xs font-semibold text-gray-700">
                Se sugieren {p.items.length} reunión(es)
                {names.length > 0 ? ` con ${names.length} colaborador(es):` : ' (los colaboradores los eliges al programar)'}
              </div>
              {names.length > 0 && <div className="mt-1 text-[11px] text-gray-500">{names.join(', ')}</div>}

              <div className="mt-3 space-y-2">
                {p.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2">
                    <div className="text-sm">
                      <div className="font-medium first-letter:uppercase">{fmtLong(it.date)}</div>
                      <div className="text-xs text-gray-500">{fmt12(it.start)} – {fmt12(it.end)}</div>
                    </div>
                    <button onClick={() => onSchedule(p, it)} className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                      Programar
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => onDismiss(p.project.id)} className="mt-3 text-xs text-gray-500 hover:underline">
                Descartar propuesta
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}