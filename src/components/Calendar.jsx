import { useEffect, useRef } from 'react';
import { DAYS_SHORT, addDays, fromKey, meetingColor, monthStart, processById, startOfWeek, todayKey, toMin, cmpMeeting } from '../data.js';

const FIRST_HOUR = 7;
const HOURS = Array.from({ length: 15 }, (_, i) => FIRST_HOUR + i); // 07:00 – 21:00
const HOUR_H = 56;

const icon = (m) => (m.status === 'Completado' ? '✓ ' : m.status === 'No completado' ? '✕ ' : '');

/* Reparte reuniones que se pisan en columnas, como Google Calendar */
function layout(events) {
  const sorted = [...events].sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(b.end) - toMin(a.end));
  const res = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const ends = [];
    const placed = cluster.map((ev) => {
      let c = ends.findIndex((e) => e <= toMin(ev.start));
      if (c === -1) {
        c = ends.length;
        ends.push(0);
      }
      ends[c] = toMin(ev.end);
      return { ev, col: c };
    });
    placed.forEach((p) => res.push({ ...p, cols: ends.length }));
    cluster = [];
  };
  sorted.forEach((ev) => {
    if (cluster.length && toMin(ev.start) >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, toMin(ev.end));
  });
  if (cluster.length) flush();
  return res;
}

/* ------------------------------- Mes ---------------------------------- */
function MonthView({ cursor, meetings, onCreate, onOpen, onPickDay }) {
  const first = startOfWeek(monthStart(cursor));
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const today = todayKey();

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b text-center text-xs font-medium uppercase text-gray-500">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((d) => {
          const list = meetings.filter((m) => m.date === d).sort(cmpMeeting);
          const inMonth = d.slice(0, 7) === cursor.slice(0, 7);
          return (
            <div
              key={d}
              onClick={() => onCreate(d, '09:00')}
              className={`min-h-0 cursor-pointer overflow-hidden border-b border-l p-1 hover:bg-gray-50 ${inMonth ? '' : 'bg-gray-50/70 text-gray-400'}`}
            >
              <div className="mb-0.5 flex justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickDay(d);
                  }}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${d === today ? 'bg-blue-600 font-semibold text-white' : 'hover:bg-gray-200'}`}
                >
                  {fromKey(d).getDate()}
                </button>
              </div>
              {list.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(m.id);
                  }}
                  className="mb-0.5 flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] text-white hover:brightness-95"
                  style={{ background: meetingColor(m), opacity: m.status === 'Completado' ? 0.65 : 1 }}
                >
                  <span className="truncate">{icon(m)}{m.start} {m.title}</span>
                </button>
              ))}
              {list.length > 3 && <div className="px-1 text-[11px] text-gray-500">+{list.length - 3} más</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------- Semana / Día ----------------------------- */
function TimeGrid({ days, meetings, onCreate, onOpen }) {
  const scroller = useRef(null);
  const today = todayKey();

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = (8 - FIRST_HOUR) * HOUR_H;
  }, []);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b pl-14 pr-[15px]">
        {days.map((d) => {
          const dt = fromKey(d);
          return (
            <div key={d} className="flex-1 border-l py-2 text-center">
              <div className={`text-xs uppercase ${d === today ? 'text-blue-600' : 'text-gray-500'}`}>{DAYS_SHORT[(dt.getDay() + 6) % 7]}</div>
              <div className={`mx-auto mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-xl ${d === today ? 'bg-blue-600 text-white' : ''}`}>{dt.getDate()}</div>
            </div>
          );
        })}
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: HOURS.length * HOUR_H }}>
          <div className="relative w-14 shrink-0">
            {HOURS.map((h, i) => (
              <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-gray-500" style={{ top: i * HOUR_H }}>
                {i === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {days.map((d) => {
            const list = layout(meetings.filter((m) => m.date === d));
            return (
              <div
                key={d}
                className="relative flex-1 cursor-pointer border-l"
                style={{ backgroundImage: `repeating-linear-gradient(to bottom, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent ${HOUR_H}px)` }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mins = Math.floor((((e.clientY - rect.top) / HOUR_H) * 60) / 30) * 30 + FIRST_HOUR * 60;
                  onCreate(d, `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`);
                }}
              >
                {d === today && nowMin >= FIRST_HOUR * 60 && nowMin <= 22 * 60 && (
                  <div className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-red-500" style={{ top: ((nowMin - FIRST_HOUR * 60) / 60) * HOUR_H }}>
                    <span className="absolute -left-1.5 -top-[5px] h-2.5 w-2.5 rounded-full bg-red-500" />
                  </div>
                )}
                {list.map(({ ev: m, col, cols }) => {
                  const top = ((toMin(m.start) - FIRST_HOUR * 60) / 60) * HOUR_H;
                  const height = Math.max(22, ((toMin(m.end) - toMin(m.start)) / 60) * HOUR_H - 2);
                  return (
                    <button
                      key={m.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(m.id);
                      }}
                      className={`absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left text-xs text-white shadow-sm ring-1 hover:brightness-95 ${
                        m.status === 'No completado' ? 'ring-2 ring-red-500' : 'ring-white'
                      }`}
                      style={{
                        top,
                        height,
                        left: `calc(${(col / cols) * 100}% + 1px)`,
                        width: `calc(${100 / cols}% - 3px)`,
                        background: meetingColor(m),
                        opacity: m.status === 'Completado' ? 0.65 : 1,
                      }}
                    >
                      <div className="truncate font-medium">{icon(m)}{m.title}</div>
                      <div className="truncate opacity-90">{m.start} – {m.end}</div>
                      {height > 52 && <div className="truncate opacity-90">{processById(m.projectId, m.processId)?.name}</div>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Calendar({ view, cursor, meetings, onCreate, onOpen, onPickDay }) {
  if (view === 'month') return <MonthView cursor={cursor} meetings={meetings} onCreate={onCreate} onOpen={onOpen} onPickDay={onPickDay} />;
  const days = view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)) : [cursor];
  return <TimeGrid days={days} meetings={meetings} onCreate={onCreate} onOpen={onOpen} />;
}
