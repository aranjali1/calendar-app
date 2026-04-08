import { useState, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80", // Jan – winter
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", // Feb – mountain
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80", // Mar – spring
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80", // Apr – bloom
  "https://images.unsplash.com/photo-1465189684280-6a8fa9b19a7a?w=800&q=80", // May – forest
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80", // Jun – summer
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", // Jul – beach
  "https://images.unsplash.com/photo-1476611317561-60117649dd94?w=800&q=80", // Aug – ocean
  "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&q=80", // Sep – harvest
  "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80", // Oct – lake
  "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800&q=80", // Nov – fog
  "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=800&q=80", // Dec – snow
];

// Key: "month-day" (1-indexed month)
const HOLIDAYS = {
  "1-1":  "New Year's Day",
  "1-26": "Republic Day",
  "3-8":  "International Women's Day",
  "4-14": "Ambedkar Jayanti",
  "4-18": "Good Friday",
  "5-1":  "Labour Day",
  "8-15": "Independence Day",
  "10-2": "Gandhi Jayanti",
  "12-25":"Christmas Day",
};

const THEMES = {
  blue:   { accent: "#2563EB", light: "#DBEAFE", ring: "#93C5FD" },
  teal:   { accent: "#0D9488", light: "#CCFBF1", ring: "#5EEAD4" },
  coral:  { accent: "#E05A3A", light: "#FFE4DC", ring: "#FCA98A" },
  purple: { accent: "#7C3AED", light: "#EDE9FE", ring: "#C4B5FD" },
};

const STORAGE_KEY = "wall-calendar-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function noteKey(start, end) {
  if (!start) return null;
  const sk = dateKey(start.y, start.m, start.d);
  if (!end) return `single:${sk}`;
  return `range:${sk}:${dateKey(end.y, end.m, end.d)}`;
}

function toDate(o) { return new Date(o.y, o.m, o.d); }

function formatDay(o) {
  return `${o.d} ${MONTHS[o.m].slice(0, 3)} ${o.y}`;
}

function buildCells(year, month) {
  const first = new Date(year, month, 1).getDay();
  const offset = first === 0 ? 6 : first - 1;
  const total  = new Date(year, month + 1, 0).getDate();
  const prevTotal = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = 0; i < offset; i++) {
    const d = prevTotal - offset + 1 + i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ d, m, y, other: true });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ d, m: month, y: year, other: false });
  }
  while (cells.length % 7 !== 0) {
    const d = cells.length - offset - total + 1;
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ d, m, y, other: true });
  }
  return cells;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spiral() {
  return (
    <div style={styles.spiral}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={styles.ring} />
      ))}
    </div>
  );
}

function HeroPanel({ month, year }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(false); }, [month]);

  return (
    <div style={styles.hero}>
      <img
        src={HERO_IMAGES[month]}
        alt={MONTHS[month]}
        onLoad={() => setLoaded(true)}
        style={{
          ...styles.heroImg,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />
      <div style={styles.heroGrad} />
      <div style={styles.heroText}>
        <span style={styles.heroYear}>{year}</span>
        <span style={styles.heroMonth}>{MONTHS[month].toUpperCase()}</span>
      </div>
    </div>
  );
}

function DayCell({ cell, status, theme, holiday, isToday, onClick, onEnter }) {
  const th = THEMES[theme];
  const isWeekend = [5, 6].includes(new Date(cell.y, cell.m, cell.d).getDay());

  let bg = "transparent";
  let color = cell.other ? "#9CA3AF" : "#1F2937";
  let fontWeight = 400;

  if (!cell.other) {
    if (status === "start" || status === "end") {
      bg = th.accent;
      color = "#fff";
      fontWeight = 500;
    } else if (status === "in-range") {
      bg = th.light;
      color = "#1F2937";
    } else if (isToday) {
      bg = "#F3F4F6";
      fontWeight = 500;
    }
    if ((status === "start" || status === "end" || isToday) && isWeekend) {
      color = status === "start" || status === "end" ? "#fff" : "#EF4444";
    } else if (isWeekend && !cell.other && status !== "start" && status !== "end") {
      color = "#EF4444";
    }
  }

  const todayRing =
    isToday && status !== "start" && status !== "end"
      ? { outline: `2px solid ${th.accent}`, outlineOffset: -2 }
      : {};

  return (
    <div
      onClick={() => !cell.other && onClick(cell)}
      onMouseEnter={() => !cell.other && onEnter(cell)}
      title={holiday || undefined}
      style={{
        ...styles.dayCell,
        background: bg,
        color,
        fontWeight,
        cursor: cell.other ? "default" : "pointer",
        ...todayRing,
      }}
    >
      {cell.d}
      {holiday && !cell.other && (
        <div
          style={{
            ...styles.holidayDot,
            background: status === "start" || status === "end" ? "rgba(255,255,255,0.8)" : "#EF4444",
          }}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WallCalendar() {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate]     = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [theme, setTheme]         = useState("blue");
  const [notes, setNotes]         = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).notes || {} : {};
    } catch { return {}; }
  });

  // Persist notes to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes })); }
    catch { /* quota exceeded */ }
  }, [notes]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const prevMonth = () => {
    setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11; } return m - 1; });
  };
  const nextMonth = () => {
    setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0; } return m + 1; });
  };

  // ── Date selection ──────────────────────────────────────────────────────────
  const handleDayClick = useCallback((cell) => {
    if (!selecting || !startDate) {
      setStartDate(cell);
      setEndDate(null);
      setSelecting(true);
    } else {
      const clicked = toDate(cell);
      const start   = toDate(startDate);
      if (clicked.getTime() === start.getTime()) {
        // Single click on same day = deselect
        setEndDate(null);
        setSelecting(false);
      } else if (clicked < start) {
        setEndDate(startDate);
        setStartDate(cell);
        setSelecting(false);
      } else {
        setEndDate(cell);
        setSelecting(false);
      }
      setHoverDate(null);
    }
  }, [selecting, startDate]);

  const handleHover = useCallback((cell) => {
    if (selecting && startDate && !endDate) {
      setHoverDate(cell);
    }
  }, [selecting, startDate, endDate]);

  // The effective end for preview during selection
  const effectiveEnd = endDate || (selecting && hoverDate ? hoverDate : null);

  const getDayStatus = (cell) => {
    if (cell.other) return null;
    if (isStartCell(cell)) return "start";
    if (effectiveEnd && isEndCell(cell, effectiveEnd)) return "end";
    if (effectiveEnd && isInRange(cell, effectiveEnd)) return "in-range";
    return null;
  };

  const isStartCell = (cell) =>
    startDate && cell.y === startDate.y && cell.m === startDate.m && cell.d === startDate.d;

  const isEndCell = (cell, end) =>
    end && cell.y === end.y && cell.m === end.m && cell.d === end.d;

  const isInRange = (cell, end) => {
    if (!startDate || !end) return false;
    const dt = toDate(cell);
    const s  = toDate(startDate);
    const e  = toDate(end);
    const [lo, hi] = s <= e ? [s, e] : [e, s];
    return dt > lo && dt < hi;
  };

  // ── Notes ───────────────────────────────────────────────────────────────────
  const nk = noteKey(startDate, endDate);
  const currentNote = nk ? (notes[nk] || "") : "";

  const handleNoteChange = (val) => {
    if (!nk) return;
    setNotes(prev => ({ ...prev, [nk]: val }));
  };

  // ── Range label ─────────────────────────────────────────────────────────────
  const rangeLabel = () => {
    if (!startDate) return null;
    if (!endDate) return formatDay(startDate);
    const ms   = Math.abs(toDate(endDate) - toDate(startDate));
    const days = Math.round(ms / 86400000) + 1;
    return `${formatDay(startDate)} → ${formatDay(endDate)} · ${days} days`;
  };

  // ── Grid ─────────────────────────────────────────────────────────────────────
  const cells = buildCells(viewYear, viewMonth);

  // ── Render ───────────────────────────────────────────────────────────────────
  const th = THEMES[theme];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Spiral />

        {/* Top panel: hero + grid */}
        <div style={styles.topPanel}>
          <HeroPanel month={viewMonth} year={viewYear} />

          <div style={styles.rightPanel}>
            {/* Month nav */}
            <div style={styles.monthNav}>
              <button style={styles.navBtn} onClick={prevMonth}>←</button>
              <span style={styles.navLabel}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button style={styles.navBtn} onClick={nextMonth}>→</button>
            </div>

            {/* Day-of-week headers */}
            <div style={styles.dayHeaders}>
              {DAY_LABELS.map((l, i) => (
                <div
                  key={l}
                  style={{
                    ...styles.dayHeader,
                    color: i >= 5 ? "#EF4444" : "#6B7280",
                  }}
                >
                  {l}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div
              style={styles.daysGrid}
              onMouseLeave={() => setHoverDate(null)}
            >
              {cells.map((cell, idx) => {
                const hk = `${cell.m + 1}-${cell.d}`;
                const isToday =
                  cell.d === today.getDate() &&
                  cell.m === today.getMonth() &&
                  cell.y === today.getFullYear();
                return (
                  <DayCell
                    key={idx}
                    cell={cell}
                    status={getDayStatus(cell)}
                    theme={theme}
                    holiday={!cell.other ? HOLIDAYS[hk] : null}
                    isToday={isToday}
                    onClick={handleDayClick}
                    onEnter={handleHover}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div style={styles.legend}>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: "#EF4444" }} />
                Holiday
              </span>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: th.accent }} />
                Selected
              </span>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: th.light, border: `1px solid ${th.ring}` }} />
                Range
              </span>
            </div>
          </div>
        </div>

        {/* Notes panel */}
        <div style={styles.notesPanel}>
          <div style={styles.notesMeta}>
            <span style={styles.notesLabel}>Notes</span>
            {rangeLabel() && (
              <span style={{ ...styles.rangeLabel, color: th.accent }}>
                {rangeLabel()}
              </span>
            )}
          </div>
          <textarea
            style={styles.notesArea}
            value={currentNote}
            onChange={e => handleNoteChange(e.target.value)}
            placeholder={
              startDate
                ? "Add notes for this selection…"
                : "Select a date or range to add notes…"
            }
            disabled={!startDate}
          />
        </div>

        {/* Footer: themes + clear */}
        <div style={styles.footer}>
          <span style={styles.footerLabel}>Theme</span>
          <div style={styles.themeRow}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                title={key}
                style={{
                  ...styles.themeBtn,
                  background: t.accent,
                  outline: theme === key ? `3px solid ${t.ring}` : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
          <button
            style={styles.clearBtn}
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              setSelecting(false);
              setHoverDate(null);
            }}
          >
            Clear selection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F0EDE8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "'Georgia', serif",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 4,
    boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
    overflow: "hidden",
    width: "100%",
    maxWidth: 820,
  },
  spiral: {
    height: 24,
    background: "#E5E7EB",
    borderBottom: "1px solid #D1D5DB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
  },
  ring: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2.5px solid #9CA3AF",
    background: "#fff",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.15)",
  },
  topPanel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    minHeight: 340,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    background: "#E5E7EB",
  },
  heroImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  heroGrad: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65) 100%)",
  },
  heroText: {
    position: "absolute",
    bottom: 16,
    left: 16,
    display: "flex",
    flexDirection: "column",
  },
  heroYear: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: "0.12em",
    fontFamily: "'Georgia', serif",
  },
  heroMonth: {
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.06em",
    fontFamily: "'Georgia', serif",
    lineHeight: 1.1,
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #E5E7EB",
  },
  monthNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderBottom: "1px solid #F3F4F6",
  },
  navBtn: {
    background: "none",
    border: "1px solid #E5E7EB",
    borderRadius: 4,
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: 14,
    color: "#374151",
    fontFamily: "inherit",
  },
  navLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.03em",
  },
  dayHeaders: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    padding: "6px 12px 0",
  },
  dayHeader: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    padding: "4px 0",
    fontFamily: "sans-serif",
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 2,
    padding: "4px 12px 8px",
    flex: 1,
  },
  dayCell: {
    textAlign: "center",
    padding: "6px 2px 4px",
    fontSize: 12,
    borderRadius: 4,
    cursor: "pointer",
    position: "relative",
    userSelect: "none",
    fontFamily: "sans-serif",
    transition: "background 0.1s ease",
    lineHeight: 1.3,
  },
  holidayDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    margin: "2px auto 0",
  },
  legend: {
    display: "flex",
    gap: 12,
    padding: "4px 12px 10px",
    borderTop: "1px solid #F3F4F6",
    marginTop: 4,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    color: "#6B7280",
    fontFamily: "sans-serif",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  notesPanel: {
    borderTop: "1px solid #E5E7EB",
    padding: "12px 16px",
  },
  notesMeta: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9CA3AF",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
  rangeLabel: {
    fontSize: 11,
    fontFamily: "sans-serif",
    fontWeight: 500,
  },
  notesArea: {
    width: "100%",
    minHeight: 72,
    resize: "vertical",
    border: "1px solid #E5E7EB",
    borderRadius: 4,
    padding: "8px 10px",
    fontSize: 13,
    fontFamily: "'Georgia', serif",
    color: "#374151",
    background: "#FAFAFA",
    outline: "none",
    lineHeight: 1.6,
  },
  footer: {
    borderTop: "1px solid #E5E7EB",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FAFAFA",
  },
  footerLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "sans-serif",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  themeRow: {
    display: "flex",
    gap: 7,
  },
  themeBtn: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    padding: 0,
    transition: "transform 0.15s",
  },
  clearBtn: {
    marginLeft: "auto",
    fontSize: 11,
    color: "#6B7280",
    background: "none",
    border: "1px solid #E5E7EB",
    borderRadius: 4,
    padding: "4px 10px",
    cursor: "pointer",
    fontFamily: "sans-serif",
  },
};

git add .
git commit -m "Added calendar UI"
git push