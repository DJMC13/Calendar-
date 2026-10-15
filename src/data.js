// =====================================================================
//  data.js  ·  Datos demo + utilidades (fechas, horas, recurrencia,
//  requerimientos pendientes, estadísticas de proyecto y motor de propuestas)
//  Todo vive en memoria: al recargar la página se reinicia la demo.
// =====================================================================

/* ------------------------- Fechas (YYYY-MM-DD) ------------------------- */
export const pad = (n) => String(n).padStart(2, '0');
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const todayKey = () => toKey(new Date());
export const addDays = (k, n) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
export const addMonths = (k, n) => {
  const d = fromKey(k);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toKey(d);
};
export const monthStart = (k) => k.slice(0, 8) + '01';
export const startOfWeek = (k) => {
  const d = fromKey(k);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lunes
  return toKey(d);
};
export const diffDays = (a, b) => Math.round((fromKey(a) - fromKey(b)) / 86400000);
export const isWeekend = (k) => [0, 6].includes(fromKey(k).getDay());
export const nextWorkday = (k) => {
  let d = k;
  while (isWeekend(d)) d = addDays(d, 1);
  return d;
};

/* ------------------------------- Horas -------------------------------- */
export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

// 15:30 -> "3:30pm" (como Google Calendar)
export const fmt12 = (t) => {
  const m = toMin(t);
  const h = Math.floor(m / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m % 60)}${h >= 12 ? 'pm' : 'am'}`;
};

// Acepta "3:30pm", "3pm", "15:30", "1530", "9 a. m." ... y devuelve "HH:MM" o null
export const parseTime = (str) => {
  const s = str.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?(a|p)?m?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (min > 59) return null;
  if (m[3]) {
    if (h < 1 || h > 12) return null;
    if (m[3] === 'p' && h < 12) h += 12;
    if (m[3] === 'a' && h === 12) h = 0;
  } else if (h > 23) return null;
  return `${pad(h)}:${pad(min)}`;
};

export const fmtDuration = (mins) =>
  mins < 60 ? `${mins} min` : mins % 60 === 0 ? `${mins / 60} h` : `${Math.floor(mins / 60)} h ${mins % 60} min`;

export const timeRange = (fromM, toM, step = 15) => {
  const out = [];
  for (let m = fromM; m <= toM; m += step) out.push(fromMin(m));
  return out;
};

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DAYS_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
export const fmtLong = (k) => fromKey(k).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShort = (k) => fromKey(k).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
export const uid = () => Math.random().toString(36).slice(2, 9);
export const cmpMeeting = (a, b) => (a.date + a.start).localeCompare(b.date + b.start);

/* ----------------------------- Catálogos ------------------------------ */
// Las personas (colaboradores) ya NO son datos fijos: se agregan a mano con
// «Agregar nombre» y viven en el estado de App (people).
export const AREAS = [
  { id: 'a-front', name: 'Frontend' },
  { id: 'a-back', name: 'Backend' },
  { id: 'a-qa', name: 'Desarrollo Web' },
  { id: 'a-rrhh', name: 'Talento Humano' },
  { id: 'a-dis', name: 'Diseño Grafico' },
];

const T = todayKey();
export const PROJECTS = [
  { id: 'p1', name: 'Módulo Reclutamiento', color: '#1a73e8', deadline: addDays(T, 9) },
  { id: 'p2', name: 'Portal Postulantes', color: '#0b8043', deadline: addDays(T, 6) },
  { id: 'p3', name: 'Dashboard Intranet', color: '#8e24aa', deadline: addDays(T, 5) },
];

export const projectById = (id) => PROJECTS.find((p) => p.id === id);
export const areaById = (id) => AREAS.find((a) => a.id === id);

export const RECURRENCES = [
  { id: 'none', label: 'No se repite' },
  { id: 'daily', label: 'Todos los días laborables' },
  { id: 'weekly', label: 'Cada semana' },
  { id: 'biweekly', label: 'Cada 2 semanas' },
  { id: 'monthly', label: 'Cada mes' },
];

/* ------------------------------ Estados -------------------------------- */
// Estado de cada requerimiento: 'completado' | 'no_completado' | 'pendiente'
//   - pendiente    = no se pudo atender (p. ej. una emergencia); motivo opcional
//   - no_completado = se intentó y no se terminó; motivo OBLIGATORIO
// Estado de la reunión: 'Programada' | 'Completado' | 'No completado' | 'Pendiente'
export const REQ_STATES = ['completado', 'no_completado', 'pendiente'];
export const isDone = (r) => r.state === 'completado';

// Resultado global (automático) a partir del checklist
export const meetingResult = (m) => {
  if (m.reqs.length === 0) return null;
  if (m.reqs.every(isDone)) return 'Completado';
  if (m.reqs.some((r) => r.state === 'no_completado')) return 'No completado';
  return 'Pendiente';
};

/* ------------------------------ Recurrencia ---------------------------- */
// Genera las ocurrencias como reuniones independientes (misma serie).
// Solo la primera lleva los requerimientos; las demás los "jalan" después.
export function expandRecurrence(base) {
  if (base.recurrence === 'none') return [base];
  const limits = { daily: 10, weekly: 8, biweekly: 6, monthly: 4 };
  const stepDays = { daily: 1, weekly: 7, biweekly: 14 };
  const seriesId = uid();
  const out = [];
  for (let k = 0; k < 400 && out.length < limits[base.recurrence]; k++) {
    const date = base.recurrence === 'monthly' ? addMonths(base.date, k) : addDays(base.date, k * stepDays[base.recurrence]);
    if (k > 0 && base.deadline && date > base.deadline) break;
    if (k > 0 && base.recurrence === 'daily' && isWeekend(date)) continue;
    out.push({ ...base, id: uid(), seriesId, date, reqs: out.length === 0 ? base.reqs : [] });
  }
  return out;
}

/* --------------------- Requerimientos pendientes ----------------------- */
// Pendientes = requerimientos NO completados, de reuniones ya finalizadas
// del mismo proyecto, que todavía no se arrastraron a otra reunión.
export function pendingFor(meetings, projectId, date, excludeId) {
  return meetings
    .filter((m) => m.projectId === projectId && m.id !== excludeId && m.status !== 'Programada' && m.date <= date)
    .flatMap((m) =>
      m.reqs
        .filter((r) => !isDone(r) && !r.carried)
        .map((r) => ({ ...r, meetingId: m.id, meetingTitle: m.title, meetingDate: m.date }))
    );
}

// Copia de un requerimiento pendiente para la nueva reunión.
export const carryCopy = (r, src) => ({
  id: uid(),
  text: r.text,
  state: 'pendiente',
  obs: '',
  carriedFrom: src.id ?? src.meetingId,
  carriedFromTitle: src.title ?? src.meetingTitle,
  carriedFromDate: src.date ?? src.meetingDate,
  carriedMotive: r.obs,
  sourceReqId: r.id,
});

/* ------------------------ Estadísticas de proyecto --------------------- */
export function projectStats(project, meetings, today = todayKey()) {
  const ms = meetings.filter((m) => m.projectId === project.id);
  const live = ms.flatMap((m) => m.reqs.filter((r) => !r.carried));
  const pending = live.filter((r) => !isDone(r)).length;
  const done = live.filter(isDone).length;
  const upcoming = ms.filter((m) => m.status === 'Programada' && m.date >= today).length;
  const recent = ms.filter((m) => m.date < today && m.date >= addDays(today, -14)).length;
  const daysLeft = diffDays(project.deadline, today);
  let status = 'En curso';
  if (live.length > 0 && pending === 0 && upcoming === 0) status = 'Finalizado';
  else if (daysLeft < 0) status = 'Atrasado';
  else if (daysLeft <= 7 && pending > 0) status = 'En riesgo';
  return { total: live.length, pending, done, upcoming, recent, daysLeft, status, count: ms.length };
}

/* --------------------------- Motor de propuestas ----------------------- */
const overlaps = (a, b) => toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

// Primer hueco libre (9:00–18:00). Las propuestas "virtuales" ocupan el
// horario para que dos propuestas nunca caigan a la misma hora.
export function findSlot(meetings, collabIds, date, durationMin) {
  for (let t = 9 * 60; t + durationMin <= 18 * 60; t += 30) {
    const cand = { start: fromMin(t), end: fromMin(t + durationMin) };
    const busy = meetings.some(
      (m) => m.date === date && overlaps(m, cand) && (m.virtual || m.collabIds.some((c) => collabIds.includes(c)))
    );
    if (!busy) return cand;
  }
  return { start: '09:00', end: fromMin(9 * 60 + durationMin) };
}

// Propone reuniones según: cantidad de reuniones, estado del proyecto,
// fecha límite y estado de los requerimientos.
export function buildProposals(meetings, people, today = todayKey()) {
  const known = new Set(people.map((p) => p.id));
  const found = [];

  PROJECTS.forEach((p) => {
    const s = projectStats(p, meetings, today);
    if (s.status === 'Finalizado') return;

    // 1) ¿Cuántas reuniones hacen falta?
    let n = Math.min(3, Math.ceil(s.pending / 2));
    if (s.daysLeft <= 3 && s.pending > 0) n = Math.max(n, 2);
    n = Math.max(0, n - s.upcoming); // descuenta las ya programadas
    if (n === 0 && s.upcoming === 0 && (s.pending > 0 || s.daysLeft <= 10)) n = 1;
    if (!n) return;

    // 2) ¿A quién convocar? A los de las últimas 3 reuniones del proyecto
    const ms = meetings.filter((m) => m.projectId === p.id).sort(cmpMeeting).slice(-3);
    const collabIds = [...new Set(ms.flatMap((m) => m.collabIds))].filter((id) => known.has(id));
    const areaIds = [...new Set(ms.flatMap((m) => m.areaIds))];

    // 3) Separación entre reuniones según los días que quedan
    const window = Math.max(1, Math.min(s.daysLeft - 1, 10));
    const step = Math.max(1, Math.floor(window / n));

    const reasons = [
      `${s.recent} reunión(es) en los últimos 14 días · ${s.upcoming} programada(s)`,
      s.daysLeft < 0 ? `Fecha límite vencida hace ${-s.daysLeft} día(s)` : `Fecha límite en ${s.daysLeft} día(s)`,
      `${s.pending} requerimiento(s) pendiente(s) de ${s.total}`,
      `Estado del proyecto: ${s.status}`,
    ];

    // 4) Prioridad
    const score = (s.daysLeft <= 3 ? 3 : s.daysLeft <= 7 ? 2 : 1) + (s.pending >= 3 ? 2 : s.pending > 0 ? 1 : 0) + (s.status === 'Atrasado' ? 3 : 0);
    found.push({ project: p, stats: s, n, step, reasons, areaIds, collabIds, score, priority: score >= 5 ? 'Alta' : score >= 3 ? 'Media' : 'Baja' });
  });

  // Los más urgentes eligen horario primero
  found.sort((a, b) => b.score - a.score);
  const virtual = [];
  found.forEach((e) => {
    e.items = [];
    let day = nextWorkday(addDays(today, 1));
    for (let i = 0; i < e.n; i++) {
      const slot = findSlot([...meetings, ...virtual], e.collabIds, day, 45);
      const item = { date: day, ...slot, title: e.stats.pending > 0 ? `Seguimiento · ${e.project.name}` : `Validación y cierre · ${e.project.name}` };
      e.items.push(item);
      virtual.push({ ...item, collabIds: e.collabIds, virtual: true });
      day = nextWorkday(addDays(day, e.step));
    }
  });
  return found.map(({ n, step, ...rest }) => rest);
}

/* ------------------------------ Datos demo ----------------------------- */
export function makeSeed() {
  const t = todayKey();
  const R = (text, state = 'pendiente', obs = '') => ({ id: uid(), text, state, obs });
  const [p1, p2, p3] = PROJECTS;

  const series = expandRecurrence({
    id: 'seed-series',
    title: 'Seguimiento semanal · Módulo Reclutamiento',
    projectId: p1.id,
    areaIds: ['a-front', 'a-back'],
    collabIds: [],
    date: addDays(t, 1),
    start: '10:00',
    end: '10:45',
    recurrence: 'weekly',
    deadline: p1.deadline,
    status: 'Programada',
    reqs: [],
  });

  return [
    {
      id: 'm1', title: 'Revisión de filtros y exportación', projectId: p3.id,
      areaIds: ['a-front', 'a-qa'], collabIds: [],
      date: addDays(t, -3), start: '10:00', end: '11:00', recurrence: 'none', deadline: p3.deadline,
      status: 'No completado',
      reqs: [R('Ajustar filtros del dashboard', 'completado'), R('Corregir exportación a Excel', 'no_completado', 'Faltan definir las columnas con RRHH')],
    },
    {
      id: 'm5', title: 'Revisión de permisos de postulantes', projectId: p2.id,
      areaIds: ['a-back', 'a-front'], collabIds: [],
      date: addDays(t, -2), start: '11:00', end: '12:00', recurrence: 'none', deadline: p2.deadline,
      status: 'Pendiente',
      reqs: [R('Revisar permisos del rol reclutador', 'pendiente', 'Emergencia: incidente en producción, la reunión no se realizó')],
    },
    {
      id: 'm2', title: 'Cierre del formulario de postulantes', projectId: p2.id,
      areaIds: ['a-front', 'a-rrhh'], collabIds: [],
      date: addDays(t, -1), start: '15:00', end: '16:00', recurrence: 'none', deadline: p2.deadline,
      status: 'Completado',
      reqs: [R('Validar campos obligatorios', 'completado'), R('Mensaje de confirmación al enviar', 'completado')],
    },
    {
      id: 'm3', title: 'Sprint review · Módulo Reclutamiento', projectId: p1.id,
      areaIds: ['a-front', 'a-back', 'a-qa'], collabIds: [],
      date: t, start: '15:00', end: '16:00', recurrence: 'none', deadline: p1.deadline,
      status: 'Programada',
      reqs: [R('Cambiar de color el botón enviar'), R('Soluciona el error al guardar datos de postulante')],
    },
    {
      id: 'm4', title: 'Coordinación con RRHH', projectId: p2.id,
      areaIds: ['a-rrhh', 'a-dis'], collabIds: [],
      date: addDays(t, 2), start: '09:00', end: '10:00', recurrence: 'none', deadline: p2.deadline,
      status: 'Programada',
      reqs: [R('Definir textos de la pantalla de postulación'), R('Aprobar diseño del botón enviar'), R('Revisar flujo de carga de CV')],
    },
    ...series,
  ];
}