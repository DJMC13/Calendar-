import { useMemo, useState } from 'react';
import Calendar from './components/Calendar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MeetingForm from './components/MeetingForm.jsx';
import MeetingDetail from './components/MeetingDetail.jsx';
import ProposalsPanel from './components/ProposalsPanel.jsx';
import {
  MONTHS, addDays, addMonths, buildProposals, carryCopy, cmpMeeting, fmtLong, fmtShort, fromKey, fromMin,
  isDone, makeSeed, meetingResult, nextWorkday, startOfWeek, todayKey, toMin, uid,
} from './data.js';

const VIEWS = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

export default function App() {
  const [meetings, setMeetings] = useState(makeSeed);
  const [people, setPeople] = useState([]); // colaboradores: se agregan a mano ({ id, name, areaId })
  const [view, setView] = useState('week');
  const [cursor, setCursor] = useState(todayKey());
  const [hidden, setHidden] = useState([]);
  const [modal, setModal] = useState(null); // { type:'form'|'detail', ... }
  const [showProposals, setShowProposals] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const visible = useMemo(() => meetings.filter((m) => !hidden.includes(m.projectId)), [meetings, hidden]);
  const proposals = useMemo(
    () => buildProposals(meetings, people).filter((p) => !dismissed.includes(p.project.id)),
    [meetings, people, dismissed]
  );

  /* ----------------------------- colaboradores -------------------------- */
  const addPerson = (name, areaId) => {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) return null;
    const existing = people.find((p) => p.name.toLowerCase() === clean.toLowerCase());
    if (existing) return existing.id;
    const id = uid();
    setPeople((prev) => [...prev, { id, name: clean, areaId: areaId || null }]);
    return id;
  };

  const removePerson = (id) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setMeetings((prev) => prev.map((m) => ({ ...m, collabIds: m.collabIds.filter((c) => c !== id) })));
  };

  /* ----------------------------- navegación ----------------------------- */
  const step = (dir) =>
    setCursor((c) => (view === 'month' ? addMonths(c, dir) : addDays(c, dir * (view === 'week' ? 7 : 1))));

  const title = (() => {
    const d = fromKey(cursor);
    if (view === 'month') return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
    if (view === 'day') return fmtLong(cursor);
    const a = startOfWeek(cursor);
    return `${fmtShort(a)} – ${fmtShort(addDays(a, 6))} ${fromKey(addDays(a, 6)).getFullYear()}`;
  })();

  /* ------------------------------ formularios --------------------------- */
  const openCreate = (date = cursor, start = '09:00') =>
    setModal({ type: 'form', key: uid(), draft: { date, start, end: fromMin(Math.min(toMin(start) + 60, 24 * 60 - 15)) } });

  const saveForm = ({ items, pulled, editingId }) => {
    setMeetings((prev) => {
      let next = editingId ? prev.map((m) => (m.id === editingId ? items[0] : m)) : [...prev, ...items];
      // marca como "arrastrados" los requerimientos que se copiaron a la nueva reunión
      pulled.forEach((p) => {
        next = next.map((m) =>
          m.id === p.meetingId ? { ...m, reqs: m.reqs.map((r) => (r.id === p.reqId ? { ...r, carried: true } : r)) } : m
        );
      });
      return next;
    });
    setCursor(items[0].date);
    setModal(null);
    notify(editingId ? 'Reunión actualizada' : items.length > 1 ? `Se crearon ${items.length} reuniones de la serie` : 'Reunión creada');
  };

  const deleteMeeting = (id) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    setModal(null);
    notify('Reunión eliminada');
  };

  /* ------------------------ checklist y finalización -------------------- */
  const patchReq = (mid, rid, patch) =>
    setMeetings((prev) => prev.map((m) => (m.id === mid ? { ...m, reqs: m.reqs.map((r) => (r.id === rid ? { ...r, ...patch } : r)) } : m)));

  // estado de un requerimiento: completado | no_completado | pendiente
  const setReqState = (mid, rid, state) => patchReq(mid, rid, state === 'completado' ? { state, obs: '' } : { state });

  // El estado de la reunión se calcula solo: Completado / No completado / Pendiente
  const finishMeeting = (id) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, status: meetingResult(m) ?? 'Completado' } : m)));
    notify('Reunión finalizada · resultado calculado automáticamente');
  };

  // Reprogramar: abre el formulario con los mismos datos; al guardar jala los pendientes
  const reprogram = (id) => {
    const m = meetings.find((x) => x.id === id);
    const base = [m.date, todayKey()].sort()[1];
    setModal({
      type: 'form',
      key: uid(),
      draft: {
        title: `${m.title.replace(/ \(reprogramada\)$/, '')} (reprogramada)`,
        projectId: m.projectId,
        areaIds: m.areaIds,
        collabIds: m.collabIds,
        date: nextWorkday(addDays(base, 1)),
        start: m.start,
        end: m.end,
        deadline: m.deadline,
      },
    });
  };

  // Pasar los pendientes a la siguiente reunión ya programada del mismo proyecto
  const carryToNext = (id) => {
    setMeetings((prev) => {
      const src = prev.find((m) => m.id === id);
      const pend = src.reqs.filter((r) => !isDone(r) && !r.carried);
      const nxt = prev
        .filter((m) => m.projectId === src.projectId && m.id !== id && m.status === 'Programada' && m.date >= src.date)
        .sort(cmpMeeting)[0];
      if (!nxt || !pend.length) return prev;
      return prev.map((m) => {
        if (m.id === src.id) return { ...m, reqs: m.reqs.map((r) => (pend.some((p) => p.id === r.id) ? { ...r, carried: true } : r)) };
        if (m.id === nxt.id) return { ...m, reqs: [...m.reqs, ...pend.map((r) => carryCopy(r, src))] };
        return m;
      });
    });
    notify('Pendientes pasados a la siguiente reunión');
  };

  /* ------------------------------ propuestas ---------------------------- */
  const scheduleProposal = (p, it) =>
    setModal({
      type: 'form',
      key: uid(),
      draft: {
        title: it.title,
        projectId: p.project.id,
        areaIds: p.areaIds,
        collabIds: p.collabIds,
        date: it.date,
        start: it.start,
        end: it.end,
        deadline: p.project.deadline,
      },
    });

  const detailMeeting = modal?.type === 'detail' ? meetings.find((m) => m.id === modal.id) : null;
  const editingMeeting = modal?.type === 'form' && modal.editingId ? meetings.find((m) => m.id === modal.editingId) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <div className="mr-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">{new Date().getDate()}</div>
          <span className="text-xl text-gray-700">Calendario de Reuniones</span>
        </div>
        <button onClick={() => setCursor(todayKey())} className="rounded-lg border px-4 py-1.5 text-sm font-medium hover:bg-gray-50">Hoy</button>
        <div className="flex text-gray-600">
          <button onClick={() => step(-1)} className="rounded-full px-3 py-1 text-lg hover:bg-gray-100">‹</button>
          <button onClick={() => step(1)} className="rounded-full px-3 py-1 text-lg hover:bg-gray-100">›</button>
        </div>
        <h1 className="text-xl first-letter:uppercase">{title}</h1>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowProposals((s) => !s)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${showProposals ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            ✨ Proponer reuniones
            {proposals.length > 0 && <span className="rounded-full bg-red-500 px-1.5 text-xs text-white">{proposals.length}</span>}
          </button>
          <div className="flex overflow-hidden rounded-lg border">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-4 py-1.5 text-sm ${view === v.id ? 'bg-blue-50 font-medium text-blue-700' : 'hover:bg-gray-50'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar
          cursor={cursor}
          meetings={meetings}
          hidden={hidden}
          onToggleProject={(id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))}
          onPick={setCursor}
          onCreate={() => openCreate()}
          onReset={() => {
            setMeetings(makeSeed());
            setDismissed([]);
            notify('Reuniones de ejemplo restablecidas');
          }}
        />

        <main className="min-w-0 flex-1">
          <Calendar
            view={view}
            cursor={cursor}
            meetings={visible}
            onCreate={openCreate}
            onOpen={(id) => setModal({ type: 'detail', id })}
            onPickDay={(d) => {
              setCursor(d);
              setView('day');
            }}
          />
        </main>

        {showProposals && (
          <ProposalsPanel
            proposals={proposals}
            people={people}
            onSchedule={scheduleProposal}
            onDismiss={(pid) => setDismissed((d) => [...d, pid])}
            onClose={() => setShowProposals(false)}
          />
        )}
      </div>

      {/* Modales */}
      {modal?.type === 'form' && (
        <MeetingForm
          key={modal.key}
          draft={modal.draft}
          editing={editingMeeting}
          meetings={meetings}
          people={people}
          onAddPerson={addPerson}
          onRemovePerson={removePerson}
          onSave={saveForm}
          onDelete={deleteMeeting}
          onClose={() => setModal(null)}
        />
      )}
      {detailMeeting && (
        <MeetingDetail
          meeting={detailMeeting}
          meetings={meetings}
          people={people}
          onClose={() => setModal(null)}
          onEdit={(id) => setModal({ type: 'form', key: uid(), editingId: id })}
          onSetState={setReqState}
          onObs={(mid, rid, obs) => patchReq(mid, rid, { obs })}
          onFinish={finishMeeting}
          onReprogram={reprogram}
          onCarry={carryToNext}
        />
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}