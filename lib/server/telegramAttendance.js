import { istDate } from './telegramJobs';

// "/present Aditi, Ariha, Ashvi" typed in a connected Telegram chat -> students to mark present.

const norm = (s) =>
  String(s ?? '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

// Optional day at the start: "yesterday", "kal", "today", "aaj", or "20/10" / "20-10-2026"
export function parseMarkInput(text) {
  let rest = String(text || '').trim();
  let date = istDate(0);

  let m = /^(yesterday|kal|today|aaj)\b[\s:,-]*/i.exec(rest);
  if (m) {
    if (/^(yesterday|kal)/i.test(m[1])) date = istDate(-1);
    rest = rest.slice(m[0].length);
  } else if ((m = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\s*[:,-]?\s*/.exec(rest))) {
    const [d, mo] = [Number(m[1]), Number(m[2])];
    let y = m[3] ? Number(m[3]) : Number(istDate(0).slice(0, 4));
    if (y < 100) y += 2000;
    const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const parsed = new Date(`${iso}T00:00:00Z`);
    if (mo < 1 || mo > 12 || d < 1 || Number.isNaN(parsed.getTime()) || parsed.getUTCDate() !== d) return { error: 'bad_date' };
    if (iso > istDate(0)) return { error: 'future_date' };
    date = iso;
    rest = rest.slice(m[0].length);
  }

  const names = rest
    .split(/[\n,;&]+|\s+and\s+/i)
    .map((n) => n.replace(/^[\s\-•*\d.)]+/, '').trim())
    .filter(Boolean);
  return { date, names };
}

// Match typed names against the pathshala's students (name, username, first/last name)
export function matchStudents(queries, students) {
  const candidates = students.map((s) => {
    const p = s.profile || {};
    const names = [s.name, s.username, p.firstName, [p.firstName, p.lastName].filter(Boolean).join(' ')].map(norm).filter(Boolean);
    return { student: s, names: [...new Set(names)] };
  });

  const out = { matched: [], ambiguous: [], notFound: [], inactive: [] };
  const seen = new Set();

  for (const raw of queries) {
    const q = norm(raw);
    if (!q) continue;
    let hits = candidates.filter((c) => c.names.includes(q));
    if (hits.length === 0 && q.length >= 3) {
      hits = candidates.filter((c) => c.names.some((n) => n.startsWith(q) || n.split(' ').some((w) => w.startsWith(q))));
    }
    if (hits.length === 0) { out.notFound.push(raw); continue; }
    if (hits.length > 1) { out.ambiguous.push({ query: raw, options: hits.slice(0, 4).map((h) => h.student.name || h.student.username) }); continue; }

    const s = hits[0].student;
    if (seen.has(s.username)) continue;
    seen.add(s.username);
    if (s.isActive === false) out.inactive.push(s.name || s.username);
    else out.matched.push({ username: s.username, name: s.name || s.username });
  }
  return out;
}
