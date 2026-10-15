import { useMemo, useState } from 'react';
import { Chip, Field, Modal, inputCls } from './ui.jsx';
import TimeSelect from './TimeSelect.jsx';
import PeoplePicker from './PeoplePicker.jsx';
import {
  AREAS, PROJECTS, RECURRENCES,
  carryCopy, expandRecurrence, fmtShort, fromMin, pendingFor, projectById, timeRange, toMin, uid,
} from '../data.js';

const LAST = 24 * 60 - 15; // 23:45

export default function MeetingForm({ draft, editing, meetings, people, onAddPerson, onRemovePerson, onSave, onDelete, onClose }) {
  const isEdit = Boolean(editing);

  const [f, setF] = useState(() =>
    isEdit
      ? { ...editing }
      : {
          title: '',
          projectId: PROJECTS[0].id,
          areaIds: [],
          collabIds: [],
          date: '',
          start: '09:00',
          end: '10:00',
          recurrence: 'none',
          deadline: PROJECTS[0].deadline,
          ...draft,
        }
  );
  const [manual, setManual] = useState(isEdit ? editing.reqs : []); // requerimientos propios
  const [removed, setRemoved] = useState([]); // arrastrados que el usuario quitó
  const [newReq, setNewReq] = useState('');
  const [errors, setErrors] = useState({});

  // solo cuentan los colaboradores que todavía existen en la lista
  const selected = f.collabIds.filter((id) => people.some((p) => p.id === id));

  // Requerimientos pendientes de reuniones anteriores del mismo proyecto
  const pulled = useMemo(
    () => (isEdit || !f.date ? [] : pendingFor(meetings, f.projectId, f.date).filter((r) => !removed.includes(r.id))),
    [meetings, f.projectId, f.date, removed, isEdit]
  );

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const changeProject = (projectId) => setF((p) => ({ ...p, projectId, deadline: projectById(projectId).deadline }));

  /* ---- horas: al cambiar el inicio se conserva la duración (como Google) ---- */
  const startOptions = useMemo(() => timeRange(0, LAST - 15), []);
  const endOptions = useMemo(() => timeRange(Math.min(toMin(f.start) + 15, LAST), LAST), [f.start]);
  const changeStart = (start) =>
    setF((p) => {
      const dur = Math.max(15, toMin(p.end) - toMin(p.start));
      return { ...p, start, end: fromMin(Math.min(toMin(start) + dur, LAST)) };
    });

  /* ---- áreas y colaboradores (N áreas / N colaboradores) ---- */
  const toggleArea = (id) =>
    setF((p) => {
      const on = p.areaIds.includes(id);
      const members = people.filter((x) => x.areaId === id).map((x) => x.id);
      return {
        ...p,
        areaIds: on ? p.areaIds.filter((a) => a !== id) : [...p.areaIds, id],
        collabIds: on ? p.collabIds.filter((c) => !members.includes(c)) : [...new Set([...p.collabIds, ...members])],
      };
    });
  const toggleCollab = (id) =>
    setF((p) => ({ ...p, collabIds: p.collabIds.includes(id) ? p.collabIds.filter((c) => c !== id) : [...p.collabIds, id] }));
  const allAreas = () => setF((p) => ({ ...p, areaIds: AREAS.map((a) => a.id), collabIds: people.map((x) => x.id) }));
  const clearAreas = () => setF((p) => ({ ...p, areaIds: [] }));

  const addPerson = (name, areaId) => {
    const id = onAddPerson(name, areaId);
    if (id) setF((p) => ({ ...p, collabIds: [...new Set([...p.collabIds, id])] }));
  };
  const removePerson = (id) => {
    onRemovePerson(id);
    setF((p) => ({ ...p, collabIds: p.collabIds.filter((c) => c !== id) }));
  };

  /* ---- requerimientos ---- */
  const addReq = () => {
    const text = newReq.trim();
    if (!text) return;
    setManual((r) => [...r, { id: uid(), text, state: 'pendiente', obs: '' }]);
    setNewReq('');
  };

  const submit = () => {
    const errs = {};
    if (!f.date) errs.date = 'Elige una fecha';
    if (toMin(f.end) <= toMin(f.start)) errs.time = 'La hora fin debe ser mayor a la hora inicio';
    if (f.areaIds.length === 0 && selected.length === 0) errs.collabs = 'Elige al menos un área o un colaborador';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const reqs = [...manual, ...pulled.map((p) => carryCopy(p, p))];
    const base = {
      ...f,
      collabIds: selected,
      id: isEdit ? editing.id : uid(),
      title: f.title.trim() || `Reunión · ${projectById(f.projectId).name}`,
      status: isEdit ? editing.status : 'Programada',
      reqs,
    };
    onSave({
      items: isEdit ? [base] : expandRecurrence(base),
      pulled: pulled.map((p) => ({ meetingId: p.meetingId, reqId: p.id })),
      editingId: isEdit ? editing.id : null,
    });
  };

  const deadlineLate = f.deadline && f.date && f.deadline < f.date;

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <input
          autoFocus
          value={f.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Añade un título a la reunión"
          className="w-full border-b-2 border-gray-200 pb-2 text-2xl outline-none focus:border-blue-600"
        />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Proyecto">
            <select className={inputCls} value={f.projectId} onChange={(e) => changeProject(e.target.value)}>
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Recurrencia">
            <select className={inputCls} value={f.recurrence} onChange={(e) => set('recurrence', e.target.value)} disabled={isEdit}>
              {RECURRENCES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Fecha" error={errors.date}>
            <input type="date" className={inputCls} value={f.date} onChange={(e) => set('date', e.target.value)} />
          </Field>

          {/* Horario estilo Google Calendar: [inicio] a [fin (duración)] */}
          <div>
            <span className="mb-1 block text-xs font-medium text-gray-600">Horario</span>
            <div className="flex items-center gap-2">
              <TimeSelect value={f.start} onChange={changeStart} options={startOptions} />
              <span className="text-sm text-gray-500">a</span>
              <TimeSelect value={f.end} onChange={(v) => set('end', v)} options={endOptions} anchor={f.start} />
            </div>
            {errors.time && <span className="mt-1 block text-xs text-red-600">{errors.time}</span>}
          </div>

          <Field label="Fecha límite">
            <input type="date" className={inputCls} value={f.deadline} onChange={(e) => set('deadline', e.target.value)} />
            {deadlineLate && <span className="mt-1 block text-xs text-amber-700">La reunión queda después de la fecha límite.</span>}
          </Field>
        </div>

        {/* Áreas */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Área</span>
            <div className="flex gap-3 text-xs">
              <button type="button" className="text-blue-600 hover:underline" onClick={allAreas}>Todo</button>
              <button type="button" className="text-gray-500 hover:underline" onClick={clearAreas}>Limpiar</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <Chip key={a.id} active={f.areaIds.includes(a.id)} onClick={() => toggleArea(a.id)}>{a.name}</Chip>
            ))}
          </div>
        </div>

        {/* Colaboradores (desplegable + agregar nombre) */}
        <div className="mt-5">
          <span className="mb-2 block text-xs font-medium text-gray-600">Colaboradores</span>
          <PeoplePicker
            people={people}
            selected={selected}
            onToggle={toggleCollab}
            onSelectAll={() => setF((p) => ({ ...p, collabIds: people.map((x) => x.id) }))}
            onClear={() => setF((p) => ({ ...p, collabIds: [] }))}
            onAdd={addPerson}
            onRemove={removePerson}
          />
          <div className="mt-2 text-xs text-gray-500">
            Convocatoria: <b>{f.areaIds.length}</b> área(s) · <b>{selected.length}</b> colaborador(es)
          </div>
          {errors.collabs && <div className="mt-1 text-xs text-red-600">{errors.collabs}</div>}
        </div>

        {/* Requerimientos */}
        <div className="mt-6">
          <div className="mb-2 text-xs font-medium text-gray-600">Requerimientos (checklist)</div>

          {pulled.map((p) => (
            <div key={p.id} className="mb-2 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <span className="mt-0.5 text-amber-600">↻</span>
              <div className="flex-1 text-sm">
                <div className="font-medium">{p.text}</div>
                <div className="text-xs text-amber-800">
                  Pendiente de «{p.meetingTitle}» · {fmtShort(p.meetingDate)}
                  {p.obs && <> — Motivo: {p.obs}</>}
                </div>
              </div>
              <button type="button" className="text-xs text-gray-500 hover:text-red-600" onClick={() => setRemoved((r) => [...r, p.id])}>
                Quitar
              </button>
            </div>
          ))}

          {manual.map((r) => (
            <div key={r.id} className="mb-2 flex items-center gap-3 rounded-lg border p-3 text-sm">
              <span className="text-gray-400">☐</span>
              <span className="flex-1">{r.text}</span>
              <button type="button" className="text-xs text-gray-500 hover:text-red-600" onClick={() => setManual((m) => m.filter((x) => x.id !== r.id))}>
                Eliminar
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              className={inputCls}
              value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReq())}
              placeholder="Ej. Cambiar de color el botón enviar"
            />
            <button type="button" onClick={addReq} className="rounded-lg border px-4 text-sm font-medium text-blue-600 hover:bg-blue-50">
              Añadir
            </button>
          </div>
          {!isEdit && f.recurrence !== 'none' && (
            <p className="mt-2 text-xs text-gray-500">En una serie recurrente, los requerimientos se asignan a la primera reunión; las siguientes jalan los pendientes al finalizar la anterior.</p>
          )}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <div>
            {isEdit && (
              <button type="button" onClick={() => onDelete(editing.id)} className="text-sm text-red-600 hover:underline">
                Eliminar reunión
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2 text-sm hover:bg-gray-100">Cancelar</button>
            <button type="button" onClick={submit} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}