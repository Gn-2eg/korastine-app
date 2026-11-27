// Fetches Egyptian fixtures from Curva (curvaegypt.com) for a 15-day window (7 back, 7 ahead)
// and writes fixtures.json. Light: one request per day, 1s apart, identifying User-Agent.
import fs from 'node:fs';
const UA = 'KorastineApp/1.0 (+https://gn-2eg.github.io/korastine-app/)';
function cairoDate(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prev = fs.existsSync('fixtures.json') ? JSON.parse(fs.readFileSync('fixtures.json', 'utf8')) : null;
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((p) => [p.type, p.value]));
const hour = Number(parts.hour), minute = Number(parts.minute);
// Overnight (00:00-08:00 Cairo): only every 30 minutes.
if (hour < 8 && minute % 30 >= 5) { console.log('overnight, skipping 5-min run'); process.exit(0); }
// Near days (yesterday, today, tomorrow) every run. Far days only every 6 hours, or when there is no data yet.
const farNow = !prev || (hour % 6 === 0 && minute < 5);
const days = [];
for (let o = -7; o <= 7; o++) if (Math.abs(o) <= 1 || farNow) days.push(o);
const windowDates = new Set();
for (let o = -7; o <= 7; o++) windowDates.add(cairoDate(o));
const fetched = new Set(days.map(cairoDate));
const out = new Map();
const cairoDay = (ts) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts));
// Keep old matches for days we did not fetch this run (and still inside the window).
for (const m of (prev?.matches || [])) {
  const d = cairoDay(m.date);
  if (windowDates.has(d) && !fetched.has(d)) out.set(m.id, m);
}
let ok = 0;
for (const o of days) {
  const date = cairoDate(o);
  try {
    const r = await fetch('https://curvaegypt.com/api/football/fixtures?date=' + date, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!Array.isArray(j.data)) throw new Error('bad payload');
    ok++;
    for (const m of j.data) {
      const lg = m?.league || {};
      const keep = lg.country === 'Egypt' || /caf super cup|arab/i.test(lg.name || '');
      if (!keep || !m.home?.name || !m.away?.name || !Number.isFinite(m.timestamp)) continue;
      out.set(m.id, {
        id: m.id, leagueId: m.league.id, league: m.league.name, round: m.league.round || null,
        date: m.timestamp * 1000,
        home: m.home.name, away: m.away.name,
        country: lg.country || null,
        homeLogo: m.home.logo || null, awayLogo: m.away.logo || null, leagueLogo: m.league.logo || null,
        hs: m.goals?.home ?? null, as: m.goals?.away ?? null,
        status: m.status?.short || 'NS', group: m.status?.group || null, minute: m.status?.elapsed ?? null
      });
    }
  } catch (e) {
    // On a failed day keep what we had for it.
    for (const m of (prev?.matches || [])) if (cairoDay(m.date) === date) out.set(m.id, m);
    console.log('skip', date, String(e.message || e));
  }
  await sleep(700);
}
if (ok === 0) { console.log('nothing fetched, keeping the old file'); process.exit(0); }
const matches = [...out.values()].sort((a, b) => a.date - b.date || a.id - b.id);
if (prev && JSON.stringify(prev.matches) === JSON.stringify(matches)) { console.log('no change'); process.exit(0); }
fs.writeFileSync('fixtures.json', JSON.stringify({ source: 'curvaegypt.com', updatedAt: new Date().toISOString(), matches }));
console.log('wrote', matches.length, 'matches');
