// يجيب القناة الناقلة واسم المعلق من FilGoal ويكتبهم في tv.json
// بيقرا جدول مباريات FilGoal وصفحة كل ماتش، وبياخد القناة الناقلة واسم المعلق لو موجودين.
// الطريقة: صفحة جدول المباريات (قناة + معاد) ثم صفحة كل ماتش قريب (قناة + معلق).
// ما بيكتبش أي حاجة مش موجودة: لو المصدر مش ناشر قناة أو معلق، السطر ما بيتكتبش.
import fs from 'node:fs';

const UA = 'KorastineApp/1.0 (+https://gn-2eg.github.io/korastine-app/)';
const SITE = 'https://www.filgoal.com';
const OUT = 'tv.json';
const MAX_DETAIL = Number(process.env.MAX_DETAIL || 20); // أقصى عدد صفحات ماتشات في الدورة الواحدة
const HOUR = 3600000;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function pad(n) { return (n < 10 ? '0' : '') + n; }
function cairoDate(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

// "27-11-2026 - 22:00" بتوقيت القاهرة -> ms UTC
function cairoStamp(dt) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})\s*-\s*(\d{1,2}):(\d{2})$/.exec(String(dt || '').trim());
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3], hh = +m[4], mi = +m[5];
  const want = y + '-' + pad(mo) + '-' + pad(d) + ' ' + pad(hh) + ':' + pad(mi);
  for (const off of [2, 3]) {
    const t = Date.UTC(y, mo - 1, d, hh - off, mi);
    const back = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(new Date(t)).replace(',', '');
    if (back === want) return t;
  }
  return Date.UTC(y, mo - 1, d, hh - 2, mi);
}

function unesc(x) {
  return String(x).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}
function stripTags(x) { return String(x).replace(/<[^>]+>/g, ''); }

function parseListing(html) {
  const out = [];
  const pos = [...html.matchAll(/class="cin_cntnr"/g)].map((m) => m.index);
  for (let i = 0; i < pos.length; i++) {
    const p = pos[i];
    const chunk = html.slice(p, i + 1 < pos.length ? pos[i + 1] : html.length);
    const before = html.slice(Math.max(0, p - 20000), p);
    const lgs = [...before.matchAll(/<h6[^>]*>\s*<span>([^<]+)<\/span>/g)];
    const lg = lgs.length ? unesc(lgs[lgs.length - 1][1]).trim() : null;
    const mm = chunk.match(/href="(\/matches\/(\d+)\/[^"]*)"/);
    const teams = [...chunk.matchAll(/<a href="\/teams\/(\d+)\/[^"]*">\s*(?:<img[^>]*>)?\s*<strong>([^<]+)<\/strong>/g)];
    if (!mm || teams.length < 2) continue;
    let venue = null, ch = null, dt = null;
    const aux = chunk.match(/<div class="match-aux">([\s\S]*?)<\/div>\s*<\/a>/);
    if (aux) {
      for (const sp of aux[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)) {
        const t = unesc(stripTags(sp[1])).trim();
        if (sp[1].includes('fb_screen')) ch = t;
        else if (sp[1].includes('fb_calendar')) dt = t;
        else if (sp[1].includes('fb_field')) venue = t;
      }
    }
    out.push({
      id: mm[2], lg, home: unesc(teams[0][2]).trim(), away: unesc(teams[1][2]).trim(),
      venue, ch, dt, kick: cairoStamp(dt), url: SITE + mm[1]
    });
  }
  const seen = new Set();
  return out.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}

async function getText(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.8', Accept: 'text/html' },
    signal: AbortSignal.timeout(25000)
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

// صفحة الماتش: TvCoverage فيها القناة والمعلق
async function matchTv(id) {
  const s = await getText(SITE + '/matches/' + id + '/x');
  let tv = [];
  const m = s.match(/"TvCoverage":(\[[\s\S]*?\])\s*,\s*"/);
  if (m) { try { tv = JSON.parse(m[1]); } catch (e) { tv = []; } }
  const st = s.match(/"StartAt":"([^"]*)"/);
  const chans = tv.map((t) => (t && t.TvChannelName ? String(t.TvChannelName).trim() : '')).filter(Boolean);
  const comms = tv.map((t) => (t && t.CommenterName ? String(t.CommenterName).trim() : '')).filter(Boolean);
  return {
    ch: chans.length ? [...new Set(chans)].slice(0, 3).join(' / ') : null,
    cm: comms.length ? [...new Set(comms)].slice(0, 2).join(' / ') : null,
    startAt: st ? Date.parse(st[1].endsWith('Z') ? st[1] : st[1] + 'Z') : null
  };
}

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const prevMap = new Map((prev?.matches || []).map((m) => [String(m.id), m]));

// 1) جدول المباريات: امبارح، النهارده، بكره، وبعده
const days = [-1, 0, 1, 2].map(cairoDate);
const listing = [];
for (const d of days) {
  try {
    const html = await getText(SITE + '/matches?date=' + d);
    const rows = parseListing(html);
    for (const r of rows) listing.push(r);
    console.log('listing', d, rows.length);
  } catch (e) {
    console.log('listing skip', d, String(e.message || e));
  }
  await sleep(900);
}

const now = Date.now();
const byId = new Map();
for (const r of listing) if (r.kick) byId.set(r.id, r);

// 2) صفحات الماتشات اللي محتاجة تفاصيل
const need = [];
for (const r of byId.values()) {
  if (r.kick < now - 3 * HOUR || r.kick > now + 72 * HOUR) continue;
  const p = prevMap.get(r.id);
  if (!p) { need.push(r); continue; }
  const age = now - (p.fetchedAt || 0);
  const hasCh = !!p.ch, hasCm = !!p.cm;
  // اللي مالوش قناة بيتعاد عليه كل ٦ ساعات بس، واللي عنده قناة ومالوش معلق كل ٤ ساعات
  if (!hasCh && age > 6 * HOUR) need.push(r);
  else if (hasCh && !hasCm && r.kick < now + 36 * HOUR && age > 4 * HOUR) need.push(r);
}
need.sort((a, b) => a.kick - b.kick);

let fetched = 0;
const fresh = new Map();
for (const r of need.slice(0, MAX_DETAIL)) {
  try {
    const d = await matchTv(r.id);
    fresh.set(r.id, { ch: d.ch || r.ch || null, cm: d.cm || null, fetchedAt: Date.now(), startAt: d.startAt });
    fetched++;
  } catch (e) {
    console.log('detail skip', r.id, String(e.message || e));
  }
  await sleep(1100);
}

// 3) تجميع الملف
const out = [];
for (const r of byId.values()) {
  const p = prevMap.get(r.id);
  const f = fresh.get(r.id);
  const kick = r.kick; // وقت القاهرة من جدول المباريات هو الصح؛ StartAt في صفحة الماتش بييجي متأخر ساعتين
  if (kick < now - 3 * 86400000 || kick > now + 10 * 86400000) continue;
  const ch = (f && f.ch) || (p && p.ch) || null;
  const cm = (f && f.cm) || (p && p.cm) || null;
  if (!ch && !cm && !f && !(p && (p.ch || p.cm))) continue; // ما نكتبش سطر فاضي ولا نعيد قراءة نفس الصفحة كل رن
  out.push({
    id: r.id, lg: r.lg, kick, home: r.home, away: r.away,
    ch, cm, url: r.url,
    fetchedAt: (f && f.fetchedAt) || (p && p.fetchedAt) || null
  });
}
// احتفظ بماتشات قديمة لسه في النافذة وما ظهرتش في الجدول
for (const p of prevMap.values()) {
  if (byId.has(String(p.id))) continue;
  if (!p.kick || p.kick < now - 3 * 86400000 || p.kick > now + 10 * 86400000) continue;
  out.push(p);
}
out.sort((a, b) => a.kick - b.kick);

const payload = {
  source: { name: 'FilGoal', url: SITE + '/matches', note: 'بيانات القنوات والمعلقين من FilGoal' },
  updatedAt: new Date().toISOString(),
  matches: out
};
fs.writeFileSync(OUT, JSON.stringify(payload, null, 0) + '\n');
console.log('tv.json:', out.length, 'ماتش · فيهم قناة:', out.filter((m) => m.ch).length, '· فيهم معلق:', out.filter((m) => m.cm).length, '· صفحات اتقرت:', fetched);
