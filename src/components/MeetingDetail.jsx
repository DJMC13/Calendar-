import { useMemo, useState } from 'react';
import { Badge, Modal, statusTone } from './ui.jsx';
import { AREAS, cmpMeeting, fmt12, fmtLong, fmtShort, isDone, meetingColor, meetingResult, processById, projectById } from '../data.js';

// Tres estados por requerimiento. «Pendiente» = no se pudo atender (p. ej. una emergencia).
const STATES = [
  { id: 'completado', label: '✓ Completado', on: 'border-green-600 bg-green-600 text-white' },
  { id: 'no_completado', label: '✕ No completado', on: 'border-red-600 bg-red-600 text-white' },
  { id: 'pendiente', label: '⏳ Pendiente', on: 'border-amber-500 bg-amber-500 text-white' },
];
const STATE_LABEL = { completado: 'Completado', no_completado: 'No completado', pendiente: 'Pendiente' };
const STATE_TONE = { completado: 'green', no_completado: 'red', pendiente: 'amber' };

export default function MeetingDetail({ meeting: m, meetings, people, onClose, onEdit, onSetState, onObs, onFinish, onReprogram, onCarry }) {
  const [errors, setErrors] = useState({});
  const project = projectById(m.projectId);
  const process = processById(m.projectId, m.processId);
  const finished = m.status !== 'Programada';
  const pending = m.reqs.filter((r) => !isDone(r) && !r.carried);
  const done = m.reqs.filter(isDone).length;
  const result = meetingResult(m);
  const names = m.collabIds.map((id) => people.find((p) => p.id === id)?.name).filter(Boolean);

  // siguiente reunión programada del mismo proyecto Y proceso (para pasarle los pendientes)
  const next = useMemo(
    () =>
      meetings
        .filter((x) => x.projectId === m.projectId && x.processId === m.processId && x.id !== m.id && x.status === 'Programada' && x.date >= m.date)
        .sort(cmpMeeting)[0],
    [meetings, m]
  );

  // al corregir un requerimiento se borra su mensaje de error
  const clearErr = (rid) => setErrors(({ [rid]: _, ...rest }) => rest);

  const finish = () => {
    const errs = {};
    // Todo requerimiento debe marcarse. «No completado» exige motivo; «Pendiente» lo deja opcional
    m.reqs.forEach((r) => {
      if (!r.state) errs[r.id] = 'Marca un estado para este requerimiento.';
      else if (r.state === 'no_completado' && !(r.obs || '').trim()) errs[r.id] = 'Indica el motivo para poder finalizar la reunión.';
    });
    setErrors(errs);
    if (Object.keys(errs).length === 0) onFinish(m.id);
  };

  return (
    <Modal onClose={onClose} width="max-w-xl">
      <div className="h-2 rounded-t-2xl" style={{ background: meetingColor(m) }} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{m.title}</h2>
            <p className="mt-1 text-sm text-gray-600 first-letter:uppercase">{fmtLong(m.date)} · {fmt12(m.start)} – {fmt12(m.end)}</p>
          </div>
          <button onClick={onClose} className="rounded-full px-2 text-xl text-gray-500 hover:bg-gray-100">×</button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="gray">Proyecto: {project.name}</Badge>
          {process && <Badge tone="gray"><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: process.color }} />Proceso: {process.name}</Badge>}
          <Badge tone={statusTone(m.status)}>Reunión: {m.status}</Badge>
          {finished && result && <Badge tone={statusTone(result)}>Requerimientos (global): {result}</Badge>}
          {m.deadline && <Badge tone="amber">Fecha límite: {fmtShort(m.deadline)}</Badge>}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-gray-500">Áreas ({m.areaIds.length})</span>
            <div className="text-gray-800">{m.areaIds.map((a) => AREAS.find((x) => x.id === a).name).join(', ') || '—'}</div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">Colaboradores ({names.length})</span>
            <div className="text-gray-800">{names.join(', ') || '—'}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Requerimientos</h3>
            <span className="text-xs text-gray-500">{done} de {m.reqs.length} completados</span>
          </div>

          {m.reqs.length === 0 && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Esta reunión no tiene requerimientos.</p>}

          {m.reqs.map((r) => (
            <div key={r.id} className={`mb-2 rounded-lg border p-3 ${errors[r.id] ? 'border-red-400 bg-red-50' : r.carried ? 'bg-gray-50' : ''}`}>
              <div className="flex items-start gap-3 text-sm">
                <div className="flex-1">
                  <div className={isDone(r) ? 'text-gray-500 line-through' : 'font-medium'}>{r.text}</div>
                  {r.carriedFrom && (
                    <div className="mt-0.5 text-xs text-amber-700">
                      ↻ Arrastrado de «{r.carriedFromTitle}» · {fmtShort(r.carriedFromDate)}
                      {r.carriedMotive && <> — Motivo anterior: {r.carriedMotive}</>}
                    </div>
                  )}
                </div>
                {finished && <Badge tone={r.carried ? 'gray' : STATE_TONE[r.state]}>{r.carried ? 'Reprogramado' : STATE_LABEL[r.state]}</Badge>}
              </div>

              {/* Elegir el estado mientras la reunión está en curso */}
              {!finished && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onSetState(m.id, r.id, r.state === s.id ? null : s.id);
                        clearErr(r.id);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition ${r.state === s.id ? s.on : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Observación: aparece solo al marcar «No completado» (obligatoria) o «Pendiente» (opcional) */}
              {!finished && (r.state === 'no_completado' || r.state === 'pendiente') && (
                <div className="mt-2">
                  <textarea
                    rows={2}
                    value={r.obs}
                    onChange={(e) => {
                      onObs(m.id, r.id, e.target.value);
                      clearErr(r.id);
                    }}
                    placeholder={
                      r.state === 'no_completado'
                        ? 'Observación: motivo por el que no se terminó (obligatorio)'
                        : 'Observación (opcional). Ej. emergencia, se atenderá en la siguiente reunión'
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${errors[r.id] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'}`}
                  />
                </div>
              )}
              {errors[r.id] && <span className="mt-1 block text-xs text-red-600">{errors[r.id]}</span>}
              {finished && !isDone(r) && r.obs && <div className="mt-2 text-xs text-gray-600">Observación: {r.obs}</div>}
            </div>
          ))}

          {!finished && m.reqs.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              «No completado» pide motivo. «Pendiente» sirve para imprevistos o emergencias: el requerimiento queda para la siguiente reunión.
            </p>
          )}
        </div>

        {/* Reprogramación */}
        {finished && pending.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-900">Quedan {pending.length} requerimiento(s) sin terminar</div>
            <p className="mt-1 text-xs text-amber-800">Puedes reprogramar esta reunión (solo jalará sus propios pendientes) o pasarlos a la siguiente reunión del mismo proceso.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => onReprogram(m.id)} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Reprogramar reunión
              </button>
              <button
                disabled={!next}
                onClick={() => onCarry(m.id)}
                title={next ? '' : 'No hay otra reunión programada para este proceso'}
                className="rounded-full border border-amber-400 bg-white px-4 py-2 text-sm hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {next ? `Pasar a «${next.title}» (${fmtShort(next.date)})` : 'Sin próxima reunión del proceso'}
              </button>
            </div>
          </div>
        )}
        {finished && pending.length === 0 && m.reqs.length > 0 && (
          <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">Todos los requerimientos quedaron resueltos o reprogramados.</div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => onEdit(m.id)} className="rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</button>
          {!finished && (
            <button onClick={finish} className="rounded-full bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700">
              Finalizar reunión
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
