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

// Proyecto → Procesos → Tareas.
//   Proyecto = el sistema completo (ej. Intranet)
//   Proceso  = cada módulo o vista que se trabaja (ej. Dashboard)
//   Tareas   = lo que se revisa en la checklist de la reunión
// Por ahora se definen aquí (sin pantalla de mantenimiento). Cada proceso
// tiene su color (para el calendario) y su fecha límite.
const T = todayKey();
export const PROJECTS = [
  {
    id: 'p1', name: 'Intranet', color: '#1a73e8', deadline: addDays(T, 9),
    processes: [
      {
        id: 'pr-dash', name: 'Dashboard', color: '#8e24aa', deadline: addDays(T, 5),
        tasks: [
          { id: 't-d1', text: 'Ajustar filtros del dashboard' },
          { id: 't-d2', text: 'Agregar gráfico de avance' },
          { id: 't-d3', text: 'Corregir exportación a Excel' },
          { id: 't-d4', text: 'Exportar reporte a PDF' },
        ],
      },
      {
        id: 'pr-recl', name: 'Módulo de Reclutamiento', color: '#1a73e8', deadline: addDays(T, 9),
        tasks: [
          { id: 't-r1', text: 'Cambiar de color el botón enviar' },
          { id: 't-r2', text: 'Solucionar el error al guardar datos de postulante' },
          { id: 't-r3', text: 'Validar campos obligatorios del registro' },
          { id: 't-r4', text: 'Agregar filtro por puesto' },
          { id: 't-r5', text: 'Registrar resultado de entrevista' },
        ],
      },
      {
        id: 'pr-post', name: 'Portal de Postulantes', color: '#0b8043', deadline: addDays(T, 6),
        tasks: [
          { id: 't-p1', text: 'Validar campos obligatorios' },
          { id: 't-p2', text: 'Mensaje de confirmación al enviar' },
          { id: 't-p3', text: 'Definir textos de la pantalla de postulación' },
          { id: 't-p4', text: 'Aprobar diseño del botón enviar' },
          { id: 't-p5', text: 'Revisar flujo de carga de CV' },
          { id: 't-p6', text: 'Revisar permisos del rol reclutador' },
        ],
      },
    ],
  },
];

export const projectById = (id) => PROJECTS.find((p) => p.id === id);
export const processById = (projectId, processId) => projectById(projectId)?.processes.find((p) => p.id === processId);
// Color de una reunión en el calendario: el de su proceso
export const meetingColor = (m) => processById(m.projectId, m.processId)?.color ?? projectById(m.projectId)?.color ?? '#5f6368';
export const areaById = (id) => AREAS.find((a) => a.id === id);

export const RECURRENCES = [
  { id: 'none', label: 'No se repite' },
  { id: 'daily', label: 'Todos los días laborables' },
  { id: 'weekly', label: 'Cada semana' },
  { id: 'biweekly', label: 'Cada 2 semanas' },
  { id: 'monthly', label: 'Cada mes' },
];

/* ------------------------------ Estados -------------------------------- */
// Estado de cada requerimiento: null (sin marcar) | 'completado' | 'no_completado' | 'pendiente'
//   - null          = todavía no se revisa (estado inicial)
//   - pendiente     = no se pudo atender (p. ej. una emergencia); motivo opcional
//   - no_completado = se intentó y no se terminó; motivo OBLIGATORIO
// Estado de la reunión: 'Programada' | 'Completado' | 'No completado' | 'Pendiente'
export const REQ_STATES = ['completado', 'no_completado', 'pendiente'];
export const isDone = (r) => r.state === 'completado';

// Nuevo requerimiento (sin marcar). taskId = null cuando es «Otra tarea».
export const newReq = (text, processId, taskId = null) => ({ id: uid(), text, processId, taskId, state: null, obs: '' });

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
// del MISMO proyecto y del MISMO proceso, que todavía no se arrastraron.
// Si se pasa fromMeetingId (reprogramación) solo se toman los de esa reunión.
export function pendingFor(meetings, { projectId, processId, date, fromMeetingId }) {
  return meetings
    .filter((m) =>
      fromMeetingId
        ? m.id === fromMeetingId
        : m.projectId === projectId && m.processId === processId && m.status !== 'Programada' && m.date <= date
    )
    .flatMap((m) =>
      m.reqs
        .filter((r) => !isDone(r) && !r.carried)
        .map((r) => ({ ...r, meetingId: m.id, meetingTitle: m.title, meetingDate: m.date }))
    );
}

// Tareas del catálogo que ya se completaron en alguna reunión del proceso
export const doneTaskIds = (meetings, processId) =>
  new Set(meetings.filter((m) => m.processId === processId).flatMap((m) => m.reqs.filter((r) => isDone(r) && r.taskId).map((r) => r.taskId)));

// Copia de un requerimiento pendiente para la nueva reunión (vuelve a quedar sin marcar).
export const carryCopy = (r, src) => ({
  id: uid(),
  text: r.text,
  processId: r.processId,
  taskId: r.taskId ?? null,
  state: null,
  obs: '',
  carriedFrom: src.id ?? src.meetingId,
  carriedFromTitle: src.title ?? src.meetingTitle,
  carriedFromDate: src.date ?? src.meetingDate,
  carriedMotive: r.obs,
  sourceReqId: r.id,
});

/* ------------------- Estadísticas de proyecto / proceso ----------------- */
function statsOf(ms, deadline, today) {
  const live = ms.flatMap((m) => m.reqs.filter((r) => !r.carried));
  const pending = live.filter((r) => !isDone(r)).length;
  const done = live.filter(isDone).length;
  const upcoming = ms.filter((m) => m.status === 'Programada' && m.date >= today).length;
  const recent = ms.filter((m) => m.date < today && m.date >= addDays(today, -14)).length;
  const daysLeft = diffDays(deadline, today);
  let status = 'En curso';
  if (live.length > 0 && pending === 0 && upcoming === 0) status = 'Finalizado';
  else if (daysLeft < 0) status = 'Atrasado';
  else if (daysLeft <= 7 && pending > 0) status = 'En riesgo';
  return { total: live.length, pending, done, upcoming, recent, daysLeft, status, count: ms.length };
}

export const projectStats = (project, meetings, today = todayKey()) =>
  statsOf(meetings.filter((m) => m.projectId === project.id), project.deadline, today);

export const processStats = (process, meetings, today = todayKey()) =>
  statsOf(meetings.filter((m) => m.processId === process.id), process.deadline, today);

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
// Cada reunión pertenece a UN proyecto y a UN proceso; sus requerimientos
// son tareas de ese proceso (o «Otra tarea» escrita a mano).
export function makeSeed() {
  const t = todayKey();
  const [intranet] = PROJECTS;
  // R(proceso, índice de tarea, estado, observación)
  const R = (proc, i, state = null, obs = '') => ({ ...newReq(proc.tasks[i].text, proc.id, proc.tasks[i].id), state, obs });
  const [dash, recl, post] = intranet.processes;

  const series = expandRecurrence({
    id: 'seed-series',
    title: 'Seguimiento semanal · Reclutamiento',
    projectId: intranet.id,
    processId: recl.id,
    areaIds: ['a-front', 'a-back'],
    collabIds: [],
    date: addDays(t, 1),
    start: '10:00',
    end: '10:45',
    recurrence: 'weekly',
    deadline: recl.deadline,
    status: 'Programada',
    reqs: [R(recl, 3), R(recl, 4)],
  });

  return [
    {
      id: 'm1', title: 'Revisión de filtros y exportación', projectId: intranet.id, processId: dash.id,
      areaIds: ['a-front', 'a-qa'], collabIds: [],
      date: addDays(t, -3), start: '10:00', end: '11:00', recurrence: 'none', deadline: dash.deadline,
      status: 'No completado',
      reqs: [R(dash, 0, 'completado'), R(dash, 2, 'no_completado', 'Faltan definir las columnas con RRHH')],
    },
    {
      id: 'm5', title: 'Revisión de permisos de postulantes', projectId: intranet.id, processId: post.id,
      areaIds: ['a-back', 'a-front'], collabIds: [],
      date: addDays(t, -2), start: '11:00', end: '12:00', recurrence: 'none', deadline: post.deadline,
      status: 'Pendiente',
      reqs: [R(post, 5, 'pendiente', 'Emergencia: incidente en producción, la reunión no se realizó')],
    },
    {
      id: 'm2', title: 'Cierre del formulario de postulantes', projectId: intranet.id, processId: post.id,
      areaIds: ['a-front', 'a-rrhh'], collabIds: [],
      date: addDays(t, -1), start: '15:00', end: '16:00', recurrence: 'none', deadline: post.deadline,
      status: 'Completado',
      reqs: [R(post, 0, 'completado'), R(post, 1, 'completado')],
    },
    {
      id: 'm3', title: 'Sprint review · Reclutamiento', projectId: intranet.id, processId: recl.id,
      areaIds: ['a-front', 'a-back', 'a-qa'], collabIds: [],
      date: t, start: '15:00', end: '16:00', recurrence: 'none', deadline: recl.deadline,
      status: 'Programada',
      reqs: [R(recl, 0), R(recl, 1)],
    },
    {
      id: 'm4', title: 'Coordinación con RRHH', projectId: intranet.id, processId: post.id,
      areaIds: ['a-rrhh', 'a-dis'], collabIds: [],
      date: addDays(t, 2), start: '09:00', end: '10:00', recurrence: 'none', deadline: post.deadline,
      status: 'Programada',
      reqs: [R(post, 2), R(post, 3), R(post, 4)],
    },
    ...series,
  ];
}