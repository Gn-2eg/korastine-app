// Fetches league tables + top scorers that the browser cannot reach directly
// and writes tables.json. Curva sends no CORS headers, so its tables have to be
// prefetched here. Runs inside the existing fixtures workflow loop.
import fs from 'node:fs';

const UA = 'KorastineApp/1.0 (+https://gn-2eg.github.io/korastine-app/)';
const CURVA = 'https://curvaegypt.com/api/football/';
const FRESH_MS = 25 * 60 * 1000; // refresh at most every ~25 minutes

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      last = e;
      await sleep(1200 * (i + 1));
    }
  }
  throw last;
}

function slimStandings(payload) {
  const data = payload && payload.data;
  const groups = Array.isArray(data) ? data : (data && data.rows ? [data] : []);
  const out = [];
  for (const g of groups) {
    const rows = (g && g.rows) || [];
    if (!rows.length) continue;
    out.push({
      name: g.name || 'الترتيب',
      rows: rows.map((r) => ({
        rank: r.rank,
        team: (r.team && r.team.name) || '',
        logo: (r.team && r.team.logo) || null,
        points: r.points,
        played: r.all && r.all.played,
        win: r.all && r.all.win,
        draw: r.all && r.all.draw,
        lose: r.all && r.all.lose,
        gf: r.all && r.all.goalsFor,
        ga: r.all && r.all.goalsAgainst,
        gd: r.goalsDiff,
        form: r.form || null,
      })),
    });
  }
  return out;
}

function slimScorers(payload) {
  const data = payload && payload.data;
  const rows = Array.isArray(data) ? data : (data && data.rows) || [];
  return rows.slice(0, 25).map((r) => ({
    rank: r.rank,
    player: (r.player && r.player.name) || '',
    photo: (r.player && r.player.photo) || null,
    team: (r.team && r.team.name) || '',
    goals: r.goals,
    assists: r.assists,
    appearances: r.appearances,
  }));
}


// ---- كأس الكونفدرالية: FilGoal (صفحات HTML عامة، من غير مفتاح) ----
const FG = 'https://www.filgoal.com/championships/1669/';
const FG_SLUG = encodeURIComponent('كأس-الكونفدرالية');

async function getText(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) {
      last = e;
      await sleep(1200 * (i + 1));
    }
  }
  throw last;
}

const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
const fgNum = (x) => { const n = parseInt(String(x).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? 0 : n; };

function fgGroups(html) {
  const heads = [...html.matchAll(/<h3[^>]*>(ترتيب المجموعة[^<]*)<\/h3>/g)].map((m) => ({ i: m.index, title: stripTags(m[1]) }));
  const out = [];
  heads.forEach((h, idx) => {
    const end = idx + 1 < heads.length ? heads[idx + 1].i : html.length;
    const seg = html.slice(h.i, end);
    const rows = [];
    for (const ch of seg.split('<div class="fg_rw').slice(1)) {
      const cells = [...ch.matchAll(/<div class="fg_cl[^"]*">([\s\S]*?)<\/div>/g)].map((m) => stripTags(m[1]));
      if (cells.length < 10) continue;
      const rank = parseInt(cells[0], 10);
      if (isNaN(rank)) continue;
      const logo = (ch.match(/data-src="([^"]+)"/) || [])[1];
      rows.push({
        rank,
        team: cells[1],
        logo: logo ? 'https:' + logo : null,
        played: fgNum(cells[2]),
        win: fgNum(cells[5]),
        lose: fgNum(cells[6]),
        draw: fgNum(cells[7]),
        gf: fgNum(cells[8]),
        ga: fgNum(cells[9]),
        gd: fgNum(cells[8]) - fgNum(cells[9]),
        points: fgNum(cells[10]),
      });
    }
    if (rows.length) out.push({ name: h.title.replace('ترتيب ', ''), rows });
  });
  return out;
}

function fgScorers(html) {
  const out = [];
  for (const ch of html.split('<div class="fg_rw').slice(1)) {
    const cells = [...ch.matchAll(/<div class="fg_cl[^"]*">([\s\S]*?)<\/div>/g)].map((m) => stripTags(m[1]));
    if (cells.length < 3 || cells[0] === 'الإسم') continue;
    const parts = cells[0].split('\n').map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    out.push({ player: parts[0], team: parts[parts.length - 1], goals: fgNum(cells[1]), assists: null, photo: null, logo: null });
  }
  return out.slice(0, 25);
}

const prev = fs.existsSync('tables.json') ? JSON.parse(fs.readFileSync('tables.json', 'utf8')) : null;
if (prev && prev.updatedAt && Date.now() - Date.parse(prev.updatedAt) < FRESH_MS) {
  console.log('tables fresh, skipping');
  process.exit(0);
}

const out = { leagues: {} };

// الدوري المصري الممتاز: Curva (ترتيب + هدافين)
try {
  const st = await getJSON(CURVA + 'standings?league=233');
  out.leagues['egy'] = { standings: slimStandings(st), scorers: [] };
  await sleep(1000);
  const ts = await getJSON(CURVA + 'topscorers?league=233');
  out.leagues['egy'].scorers = slimScorers(ts);
  console.log('egy ok', out.leagues['egy'].standings.length, 'groups', out.leagues['egy'].scorers.length, 'scorers');
} catch (e) {
  console.log('egy failed:', String(e && e.message));
  if (prev && prev.leagues && prev.leagues['egy']) out.leagues['egy'] = prev.leagues['egy'];
}

// كأس الكونفدرالية 2026-27: FilGoal (مجموعات حقيقية + هدافين)
try {
  const stHtml = await getText(FG + 'standings/' + FG_SLUG);
  const groups = fgGroups(stHtml);
  if (!groups.length) throw new Error('no groups parsed');
  await sleep(1200);
  const scHtml = await getText(FG + 'scorers/' + FG_SLUG);
  out.leagues['caf.confed'] = { source: 'filgoal', season: '2026-27', standings: groups, scorers: fgScorers(scHtml) };
  console.log('confed ok', groups.length, 'groups', out.leagues['caf.confed'].scorers.length, 'scorers');
} catch (e) {
  console.log('confed failed:', String(e && e.message));
  if (prev && prev.leagues && prev.leagues['caf.confed']) out.leagues['caf.confed'] = prev.leagues['caf.confed'];
}

// الدوري الإماراتي: TheSportsDB بيرجّع 5 فرق بس في الباقة المجانية، فمش بنعرضه

if (!Object.keys(out.leagues).length) {
  console.log('nothing fetched, leaving tables.json untouched');
  process.exit(0);
}

// متكتبش الملف لو البيانات زي ما هي (updatedAt بيتغير كل مرة فمش بنقارن بيه)
if (prev && JSON.stringify(prev.leagues) === JSON.stringify(out.leagues)) {
  console.log('tables unchanged');
  process.exit(0);
}
out.updatedAt = new Date().toISOString();
const text = JSON.stringify(out, null, 0) + '\n';
fs.writeFileSync('tables.json', text);
console.log('tables.json written', text.length, 'bytes');
