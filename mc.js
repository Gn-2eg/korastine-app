/* مركز المباراة: بيتفتح من صفحة الأهداف. كل البيانات حقيقية من ESPN summary؛ اللي مش موجود بيظهر "غير متاح" ومفيش أرقام مخترعة. */
var KSMC = (function () {
  var SVG = "http://www.w3.org/2000/svg";
  var AR = "٠١٢٣٤٥٦٧٨٩";
  function ar(n) { return String(n).replace(/\d/g, function (d) { return AR[+d]; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function sv(tag, attrs, text) { var e = document.createElementNS(SVG, tag); for (var k in attrs) e.setAttribute(k, String(attrs[k])); if (text !== undefined) e.textContent = text; return e; }
  function icon(id, cls) { var s = sv("svg", { "class": "mc-icon" + (cls ? " " + cls : ""), "aria-hidden": "true" }); var u = sv("use", {}); u.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#mc-i-" + id); u.setAttribute("href", "#mc-i-" + id); s.appendChild(u); return s; }
  var SPRITE = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<symbol id="mc-i-play" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/></symbol>' +
    '<symbol id="mc-i-events" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m4 13 5-4 4 6 4-4 3 2"/></symbol>' +
    '<symbol id="mc-i-stats" viewBox="0 0 24 24"><path d="M5 19V9m7 10V4m7 15V7" stroke-width="4"/></symbol>' +
    '<symbol id="mc-i-star" viewBox="0 0 24 24"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/></symbol>' +
    '<symbol id="mc-i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></symbol>' +
    '<symbol id="mc-i-arrow" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></symbol>' +
    '</defs></svg>';

  /* ===== جلب الداتا: طلب واحد لكل ماتش، مع كاش ومنع التكرار ===== */
  var cache = {};
  function summaryUrl(m) { return "https://site.api.espn.com/apis/site/v2/sports/soccer/" + encodeURIComponent(m.comp) + "/summary?event=" + encodeURIComponent(m.eid); }
  function getSummary(m, force) {
    if (!m.eid) return Promise.resolve({ none: true });
    var k = m.comp + ":" + m.eid, c = cache[k];
    if (c && !force && (c.p || Date.now() - c.at < 300000)) return c.p || Promise.resolve(c.v);
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var tm = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);
    var p = fetch(summaryUrl(m), ctl ? { signal: ctl.signal } : {}).then(function (r) { clearTimeout(tm); if (!r.ok) throw new Error("http " + r.status); return r.json(); }).then(function (j) {
      var v = { data: j }; cache[k] = { at: Date.now(), v: v }; return v;
    }).catch(function (e) { clearTimeout(tm); delete cache[k]; throw e; });
    cache[k] = { p: p, at: Date.now() };
    return p;
  }

  /* ===== تحويل البيانات ===== */
  function num(x) { var n = parseFloat(x); return isNaN(n) ? null : n; }
  function sides(d) {
    var comp = d.header && d.header.competitions && d.header.competitions[0], out = { home: null, away: null };
    ((comp && comp.competitors) || []).forEach(function (c) { out[c.homeAway] = { id: c.team && c.team.id, score: num(c.score) }; });
    return out;
  }
  function parseEvents(d, m) {
    var ks = d.keyEvents || [], sd = sides(d), rows = [], h = 0, a = 0, ok = true, hasGoal = false;
    ks.forEach(function (e) {
      var t = ((e.type && e.type.text) || "").toLowerCase(), team = e.team && e.team.id, side = team && sd.home && team === sd.home.id ? "home" : team && sd.away && team === sd.away.id ? "away" : null;
      var pn = (e.participants || []).map(function (p) { return p.athlete && (p.athlete.displayName || p.athlete.shortName); }).filter(Boolean);
      var min = (e.clock && e.clock.displayValue) || "";
      if (t === "halftime") { rows.push({ k: "ht", h: h, a: a }); return; }
      var kind = null, label = "", sub = "";
      if (e.scoringPlay || /^goal|own goal|penalty - scored/.test(t)) {
        kind = "goal"; hasGoal = true;
        if (!side) ok = false; else if (side === "home") h++; else a++;
        label = (/own goal/.test(t) ? "⚽ (عكسي) " : /penalty/.test(t) ? "⚽ (ركلة جزاء) " : "⚽ ") + (pn[0] || "هدف");
      } else if (/yellow card/.test(t)) { kind = "card"; label = "🟨 " + (pn[0] || "بطاقة صفراء"); }
      else if (/red card/.test(t)) { kind = "card"; label = "🟥 " + (pn[0] || "بطاقة حمراء"); }
      else if (/penalty - (missed|saved)/.test(t)) { kind = "pen"; label = "❌ ركلة جزاء ضائعة" + (pn[0] ? " · " + pn[0] : ""); }
      else if (t === "substitution") { kind = "sub"; label = "🔄 " + (pn[0] || "تبديل"); sub = pn[1] ? "بدل " + pn[1] : ""; }
      if (!kind) return;
      rows.push({ k: kind, side: side, min: min, label: label, sub: sub, h: h, a: a });
    });
    var fh = sd.home && sd.home.score, fa = sd.away && sd.away.score;
    var tally = ok && fh != null && fa != null && h === fh && a === fa;
    return { rows: rows, tally: tally, hs: fh != null ? fh : m.hs, as: fa != null ? fa : m.as };
  }
  var STATS = [["totalShots", "التسديدات"], ["shotsOnTarget", "التسديدات على المرمى"], ["wonCorners", "الركنيات"], ["foulsCommitted", "الأخطاء"], ["yellowCards", "البطاقات الصفراء"], ["redCards", "البطاقات الحمراء"], ["offsides", "التسلل"], ["saves", "تصديات الحارس"], ["totalPasses", "التمريرات"], ["accuratePasses", "التمريرات الصحيحة"], ["interceptions", "الاعتراضات"], ["totalTackles", "التدخلات"]];
  function parseStats(d) {
    var ts = d.boxscore && d.boxscore.teams;
    if (!ts || ts.length < 2) return null;
    var hm = null, am = null;
    ts.forEach(function (t) { var map = {}; (t.statistics || []).forEach(function (s) { map[s.name] = s.displayValue; }); if (t.homeAway === "home") hm = map; else if (t.homeAway === "away") am = map; });
    if (!hm || !am) { hm = {}; am = {}; ts[0].statistics && ts[0].statistics.forEach(function (s) { hm[s.name] = s.displayValue; }); ts[1].statistics && ts[1].statistics.forEach(function (s) { am[s.name] = s.displayValue; }); }
    var rows = [];
    STATS.forEach(function (s) { var a = num(hm[s[0]]), b = num(am[s[0]]); if (a != null && b != null) rows.push({ n: s[1], a: a, b: b }); });
    var ph = num(hm.possessionPct), pa = num(am.possessionPct);
    var pos = ph != null && pa != null && ph + pa > 0 ? { h: Math.round(ph), a: 100 - Math.round(ph) } : null;
    return rows.length || pos ? { rows: rows, pos: pos } : null;
  }
  function vRank(ab) { ab = String(ab || "").toUpperCase(); if (/^(CD|SW|LB|RB|LCB|RCB|CB)/.test(ab)) return 1; if (/WB/.test(ab)) return 1.5; if (/^DM/.test(ab)) return 2; if (/^AM/.test(ab)) return 4; if (/^(LW|RW)/.test(ab)) return 4.5; if (/^(F|CF|SS|ST|LF|RF)/.test(ab)) return 5; return 3; }
  function lRank(ab) { ab = String(ab || "").toUpperCase(); if (/^(LB|LWB|LM|LW|LF)/.test(ab)) return -1; if (/^(RB|RWB|RM|RW|RF)/.test(ab)) return 3; if (/-L$/.test(ab)) return 0; if (/-R$/.test(ab)) return 2; return 1; }
  function parseLineup(d, side) {
    var rs = d.rosters || [], sd = sides(d), id = sd[side] && sd[side].id, r = null;
    rs.forEach(function (x) { if ((x.homeAway === side) || (id && x.team && x.team.id === id)) r = r || x; });
    if (!r) return null;
    var st = (r.roster || []).filter(function (p) { return p.starter; });
    if (st.length !== 11) return { formation: r.formation || "", players: null, count: st.length };
    var info = st.map(function (p) {
      var s = {}; (p.stats || []).forEach(function (x) { s[x.name] = num(x.displayValue) || 0; });
      var a = p.athlete || {}, ab = p.position && p.position.abbreviation;
      return { no: p.jersey || "", name: a.lastName || a.shortName || a.displayName || "", ab: ab, fp: num(p.formationPlace) || 99, g: s.totalGoals || 0, as: s.goalAssists || 0, y: s.yellowCards || 0, rd: s.redCards || 0, gk: /^G/i.test(ab || "") };
    });
    var gk = info.filter(function (p) { return p.gk; }), field = info.filter(function (p) { return !p.gk; });
    var rows = String(r.formation || "").split("-").map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x > 0; });
    var sum = rows.reduce(function (a, b) { return a + b; }, 0);
    if (gk.length !== 1 || sum !== 10 || field.length !== 10) return { formation: r.formation || "", players: null, count: 11, list: info };
    field.sort(function (a, b) { return vRank(a.ab) - vRank(b.ab) || a.fp - b.fp; });
    var out = [{ p: gk[0], x: 160, y: 270, per: 1 }], idx = 0;
    rows.forEach(function (n, ri) {
      var line = field.slice(idx, idx + n).sort(function (a, b) { return lRank(a.ab) - lRank(b.ab) || a.fp - b.fp; });
      idx += n;
      var y = rows.length === 1 ? 140 : 215 - ri * (150 / (rows.length - 1));
      line.forEach(function (p, i) { var x = n === 1 ? 160 : n === 2 ? 100 + i * 120 : n === 3 ? 60 + i * 100 : 47 + i * (226 / (n - 1)); out.push({ p: p, x: x, y: y, per: n }); });
    });
    return { formation: r.formation, players: out };
  }

  /* ===== بناء الشاشة ===== */
  var ov = null, cur = null;
  function close() { if (!ov) return; ov.hidden = true; ov.innerHTML = ""; document.body.classList.remove("mc-lock"); cur = null; try { if (cur0 && cur0.focus) cur0.focus(); } catch (e) {} }
  var cur0 = null;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov && !ov.hidden) close(); });

  function logoImg(src, cls) { var i = el("img"); i.src = src || ""; i.alt = ""; i.decoding = "async"; i.addEventListener("error", function () { if (i.parentNode) i.parentNode.removeChild(i); }); return i; }

  function state(box, kind, msg, retry) {
    box.innerHTML = "";
    var s = el("div", "mc-state");
    if (kind === "load") { s = el("div", "mc-skel"); s.setAttribute("aria-busy", "true"); for (var i = 0; i < 5; i++) s.appendChild(el("i")); s.setAttribute("aria-label", "بنحمّل…"); }
    else { s.appendChild(el("strong", null, kind === "err" ? "مقدرناش نجيب البيانات" : "غير متاح")); s.appendChild(el("span", null, msg)); if (retry) { var b = el("button", "mc-retry", "جرّب تاني"); b.type = "button"; b.addEventListener("click", retry); s.appendChild(b); } }
    box.appendChild(s);
  }

  function open(m, info) {
    info = info || {};
    cur0 = document.activeElement;
    if (!ov) { ov = el("div", "mc-ov"); ov.hidden = true; document.body.appendChild(ov); }
    ov.innerHTML = SPRITE;
    var root = el("div", "mc-root");
    var bar = el("div", "mc-bar"); var bk = el("button", "mc-back"); bk.type = "button"; bk.appendChild(icon("arrow")); bk.appendChild(document.createTextNode("رجوع")); bk.addEventListener("click", close); bar.appendChild(bk); root.appendChild(bar);
    var card = el("main", "mc-card"); card.setAttribute("aria-label", "مركز المباراة");
    var top = el("header", "mc-top"); var st = el("span", "mc-muted mc-inline"); st.appendChild(icon("check")); st.appendChild(document.createTextNode("انتهت المباراة")); top.appendChild(st); top.appendChild(el("span", "mc-league", info.compName || "")); card.appendChild(top);
    var hs = isNaN(m.hs) ? "-" : m.hs, as = isNaN(m.as) ? "-" : m.as;
    var hero = el("section", "mc-hero"); hero.setAttribute("aria-label", m.home + " " + hs + "، " + m.away + " " + as + "، انتهت المباراة");
    hero.appendChild(el("div", "mc-hero-brand", "KORASTINE HIGHLIGHTS"));
    var grid = el("div", "mc-score-grid");
    function club(name, logo) { var c = el("div", "mc-club"); var cr = el("div", "mc-crest"); cr.setAttribute("aria-hidden", "true"); if (logo) cr.appendChild(logoImg(logo)); c.appendChild(cr); c.appendChild(el("div", "mc-club-name", name)); return c; }
    grid.appendChild(club(m.home, m.homeLogo));
    var sc = el("div", "mc-score"); sc.appendChild(el("strong", null, hs + " : " + as)); sc.appendChild(el("span", "mc-ft", "FT")); grid.appendChild(sc);
    grid.appendChild(club(m.away, m.awayLogo));
    hero.appendChild(grid); hero.appendChild(el("div", "mc-hero-bottom", "MATCH CENTER")); hero.appendChild(el("div", "mc-team-stripe")); card.appendChild(hero);

    var TABS = [["video", "play", "الملخص"], ["events", "events", "الأحداث"], ["stats", "stats", "الإحصائيات"], ["ratings", "star", "تقييم اللاعبين"]];
    var tl = el("div", "mc-tabs"); tl.setAttribute("role", "tablist"); tl.setAttribute("aria-label", "تفاصيل المباراة");
    var tabs = [], panels = {}, painted = {}, data = null, pending = null;
    TABS.forEach(function (t, i) {
      var b = el("button", "mc-tab"); b.type = "button"; b.id = "mc-tab-" + t[0]; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "mc-panel-" + t[0]); b.setAttribute("aria-selected", i === 0 ? "true" : "false"); b.tabIndex = i === 0 ? 0 : -1;
      b.appendChild(icon(t[1])); b.appendChild(document.createTextNode(t[2])); tl.appendChild(b); tabs.push(b);
      var p = el("section", "mc-panel"); p.id = "mc-panel-" + t[0]; p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", b.id); p.hidden = i !== 0; panels[t[0]] = p; b._k = t[0];
    });
    card.appendChild(tl); TABS.forEach(function (t) { card.appendChild(panels[t[0]]); });
    root.appendChild(card);
    ov.appendChild(root);
    ov.hidden = false; document.body.classList.add("mc-lock"); ov.scrollTop = 0;
    cur = m;

    function activate(tab, focus) {
      tabs.forEach(function (x) { var on = x === tab; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; panels[x._k].hidden = !on; });
      if (focus) tab.focus();
      ensure(tab._k);
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { activate(tab); });
      tab.addEventListener("keydown", function (e) {
        var n; if (e.key === "ArrowLeft") n = (i + 1) % tabs.length; else if (e.key === "ArrowRight") n = (i - 1 + tabs.length) % tabs.length; else if (e.key === "Home") n = 0; else if (e.key === "End") n = tabs.length - 1; else return;
        e.preventDefault(); activate(tabs[n], true);
      });
    });

    /* الملخص: روابط حقيقية بس */
    function paintVideo() {
      var p = panels.video; p.innerHTML = "";
      var list = el("div", "mc-video-list"), n = 0;
      function row(url, title, cap) {
        var a = el("a", "mc-video"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
        var pl = el("span", "mc-play"); pl.appendChild(icon("play")); a.appendChild(pl);
        var cp = el("span", "mc-video-copy"); cp.appendChild(el("strong", null, title)); cp.appendChild(el("span", "mc-caption", cap)); a.appendChild(cp);
        a.appendChild(icon("arrow", "mc-arrow")); list.appendChild(a); n++;
      }
      var v = info.video || {};
      if (v.sum) row(v.sum.url, "ملخص المباراة", v.sum.label);
      if (v.goals) row(v.goals.url, "أهداف المباراة", v.goals.label);
      var ev = data && data.data && data.data.videos && data.data.videos[0], eu = ev && ev.links && ev.links.web && ev.links.web.href;
      if (eu && /^https:\/\/(www\.)?espn\.com\//.test(eu)) row(eu, "فيديو من ESPN", ev.headline || "ESPN");
      if (!n) {
        var off = el("div", "mc-video mc-off"); var pl = el("span", "mc-play"); pl.appendChild(icon("play")); off.appendChild(pl);
        var cp = el("span", "mc-video-copy"); cp.appendChild(el("strong", null, "الملخص لسه مش متاح")); cp.appendChild(el("span", "mc-caption", "القناة الرسمية لسه منزلتش فيديو للماتش ده")); off.appendChild(cp); list.appendChild(off);
      }
      p.appendChild(list);
      if (info.video && info.video.search) { var mo = el("p", "mc-video-more"); var a = el("a", null, "بحث يوتيوب عن الماتش"); a.href = info.video.search; a.target = "_blank"; a.rel = "noopener noreferrer"; mo.appendChild(a); p.appendChild(mo); }
    }

    function needData(k, render) {
      var box = panels[k];
      if (!m.eid) { state(box, "na", "مصدر البيانات الحالي مش بيدّي تفاصيل للدوري ده."); return; }
      if (data) { render(box, data.data); return; }
      state(box, "load");
      load().then(function () { if (cur !== m) return; render(box, data.data); }, function () { if (cur !== m) return; state(box, "err", "حصلت مشكلة في الاتصال.", function () { painted = {}; pending = null; ensure(k); }); });
    }
    function hx(s) { return /^[0-9a-f]{6}$/i.test(s || "") ? [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)] : null; }
    function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
    function pick(t) { var a = hx(t && t.color), b = hx(t && t.alternateColor), L; if (a && (L = lum(a)) > 0.07 && L < 0.85) return a; if (b && (L = lum(b)) > 0.07 && L < 0.85) return b; return null; }
    function mix(c, k) { var bg = [17, 30, 40]; return "rgb(" + c.map(function (v, i) { return Math.round(v * k + bg[i] * (1 - k)); }).join(",") + ")"; }
    function tint(d) {
      var cs = (d && d.header && d.header.competitions && d.header.competitions[0] && d.header.competitions[0].competitors) || [], t = {};
      cs.forEach(function (c) { t[c.homeAway] = pick(c.team); });
      var hs = hero.style;
      if (t.home) { hs.setProperty("--mc-hl", mix(t.home, 0.62)); hs.setProperty("--mc-sl", "rgb(" + t.home.join(",") + ")"); }
      if (t.away) {
        var h = t.home, dist = h ? Math.abs(h[0] - t.away[0]) + Math.abs(h[1] - t.away[1]) + Math.abs(h[2] - t.away[2]) : 999;
        if (dist > 90) { hs.setProperty("--mc-hr", mix(t.away, 0.62)); hs.setProperty("--mc-sr", "rgb(" + t.away.join(",") + ")"); }
      }
    }
    function load() {
      if (data) return Promise.resolve(data);
      if (pending) return pending;
      pending = getSummary(m, false).then(function (v) { data = v; pending = null; try { tint(v); } catch (e) {} return v; }, function (e) { pending = null; throw e; });
      return pending;
    }

    function paintEvents(box, d) {
      var ev = parseEvents(d, m); box.innerHTML = "";
      if (!ev.rows.length) { state(box, "na", "مفيش أحداث متسجلة للماتش ده في المصدر."); return; }
      var sec = el("div", "mc-section");
      var th = el("div", "mc-team-head"); th.appendChild(el("span", "mc-green", m.home)); th.appendChild(el("span", "mc-muted", "الأحداث")); th.appendChild(el("span", "mc-blue", m.away)); sec.appendChild(th);
      var pe = el("div", "mc-period"); pe.appendChild(document.createTextNode("نهاية المباراة")); if (!isNaN(ev.hs) && !isNaN(ev.as)) { pe.appendChild(document.createTextNode(" · ")); pe.appendChild(el("bdi", null, ev.hs + "–" + ev.as)); } sec.appendChild(pe);
      ev.rows.slice().reverse().forEach(function (r) {
        if (r.k === "ht") { var h = el("div", "mc-period"); h.appendChild(document.createTextNode("نهاية الشوط الأول")); if (ev.tally) { h.appendChild(document.createTextNode(" · ")); h.appendChild(el("bdi", null, r.h + "–" + r.a)); } sec.appendChild(h); return; }
        var row = el("div", "mc-event");
        var L = el("div", "mc-left"), M = el("div", "mc-minute", r.min), R = el("div", "mc-right");
        var cell = r.side === "away" ? R : L;
        cell.appendChild(document.createTextNode(r.label));
        if (r.sub) cell.appendChild(el("small", "mc-sub", r.sub));
        if (r.k === "goal" && ev.tally) { var sm = el("small", null, r.h + "–" + r.a); sm.dir = "ltr"; cell.appendChild(sm); }
        row.appendChild(L); row.appendChild(M); row.appendChild(R); sec.appendChild(row);
      });
      var s0 = el("div", "mc-period"); s0.appendChild(document.createTextNode("بداية المباراة · ")); s0.appendChild(el("bdi", null, "0′")); sec.appendChild(s0);
      box.appendChild(sec);
    }

    function paintStats(box, d) {
      var s = parseStats(d); box.innerHTML = "";
      if (!s) { state(box, "na", "الإحصائيات مش متاحة للماتش ده في المصدر."); return; }
      var sec = el("div", "mc-section");
      var th = el("div", "mc-team-head"); th.appendChild(el("span", "mc-green", "● " + m.home)); th.appendChild(el("span", "mc-blue", m.away + " ●")); sec.appendChild(th);
      if (s.pos) {
        var C = 2 * Math.PI * 39, g = C * s.pos.h / 100;
        var svg = sv("svg", { "class": "mc-possession", viewBox: "0 0 320 105", role: "img", "aria-label": "الاستحواذ: " + m.home + " " + s.pos.h + " بالمئة، " + m.away + " " + s.pos.a + " بالمئة" });
        svg.appendChild(sv("circle", { cx: 160, cy: 52, r: 39, fill: "none", stroke: "#5689dc", "stroke-width": 9 }));
        svg.appendChild(sv("circle", { cx: 160, cy: 52, r: 39, fill: "none", stroke: "#36df82", "stroke-width": 9, "stroke-dasharray": g.toFixed(3) + " " + C.toFixed(3), transform: "rotate(-90 160 52)" }));
        var gt = sv("g", { "text-anchor": "middle", "font-family": "system-ui,Tahoma,sans-serif" });
        gt.appendChild(sv("text", { x: 160, y: 56, fill: "#d9e5ef", "font-size": 11 }, "الاستحواذ"));
        gt.appendChild(sv("text", { x: 57, y: 62, "font-size": 29, "font-weight": 700, fill: "#36df82" }, s.pos.h + "%"));
        gt.appendChild(sv("text", { x: 263, y: 62, "font-size": 29, "font-weight": 700, fill: "#729eff" }, s.pos.a + "%"));
        svg.appendChild(gt); sec.appendChild(svg);
      }
      var lst = el("div"); lst.style.cssText = "display:grid;gap:12px";
      s.rows.forEach(function (r) {
        var row = el("div", "mc-stat-row"), lb = el("div", "mc-stat-label");
        lb.appendChild(el("strong", null, r.a)); lb.appendChild(el("span", null, r.n)); lb.appendChild(el("strong", null, r.b)); row.appendChild(lb);
        var br = el("div", "mc-stat-bar"); br.setAttribute("aria-hidden", "true");
        [r.a, r.b].forEach(function (n) { var i = el("i"); i.style.flex = String(r.a + r.b ? n : 1); br.appendChild(i); }); row.appendChild(br); lst.appendChild(row);
      });
      sec.appendChild(lst); box.appendChild(sec);
    }

    function paintRatings(box, d) {
      box.innerHTML = "";
      var key = "home", lu = { home: parseLineup(d, "home"), away: parseLineup(d, "away") };
      if (!lu.home && !lu.away) { state(box, "na", "التشكيل مش متاح للماتش ده في المصدر."); return; }
      var sw = el("div", "mc-team-switch"); sw.setAttribute("role", "group"); sw.setAttribute("aria-label", "اختيار الفريق لعرض التشكيل");
      var btns = {};
      [["away", m.away, m.awayLogo], ["home", m.home, m.homeLogo]].forEach(function (t) {
        var b = el("button", "mc-team-button"); b.type = "button"; b.setAttribute("data-side", t[0]); b.setAttribute("aria-pressed", t[0] === key ? "true" : "false");
        var mc = el("span", "mc-mini-crest"); mc.setAttribute("aria-hidden", "true"); if (t[2]) mc.appendChild(logoImg(t[2])); b.appendChild(mc); b.appendChild(el("span", null, t[1]));
        b.addEventListener("click", function () { key = t[0]; draw(); }); sw.appendChild(b); btns[t[0]] = b;
      });
      box.appendChild(sw);
      var holder = el("div"); box.appendChild(holder);
      function draw() {
        btns.home.setAttribute("aria-pressed", String(key === "home")); btns.away.setAttribute("aria-pressed", String(key === "away"));
        holder.innerHTML = "";
        var L = lu[key], name = key === "home" ? m.home : m.away;
        if (!L || !L.players) {
          var msg = L && L.list ? "تشكيل " + name + " مش واضح في المصدر." : "تشكيل " + name + " مش متاح في المصدر.";
          holder.appendChild(el("div", "mc-state", msg)); return;
        }
        var svg = sv("svg", { "class": "mc-pitch", viewBox: "0 0 320 310", role: "img", "aria-label": "تشكيل " + name });
        var bg = sv("g", {}); for (var i = 0; i < 8; i++) bg.appendChild(sv("rect", { x: 0, y: i * 38.75, width: 320, height: 38.75, fill: i % 2 === 0 ? "#214536" : "#19392e" })); svg.appendChild(bg);
        var ln = sv("g", { stroke: "#8eaf9d", "stroke-width": 1, opacity: ".7", fill: "none" });
        [["rect", { x: 12, y: 10, width: 296, height: 290, rx: 2 }], ["path", { d: "M12 155H308" }], ["circle", { cx: 160, cy: 155, r: 37 }], ["rect", { x: 82, y: 10, width: 156, height: 49 }], ["rect", { x: 123, y: 10, width: 74, height: 18 }], ["rect", { x: 82, y: 251, width: 156, height: 49 }], ["rect", { x: 123, y: 282, width: 74, height: 18 }]].forEach(function (a) { ln.appendChild(sv(a[0], a[1])); });
        ln.appendChild(sv("circle", { cx: 160, cy: 155, r: 1.5, fill: "#8eaf9d" })); svg.appendChild(ln);
        var pl = sv("g", { "text-anchor": "middle", "font-family": "system-ui,sans-serif" }), desc = [];
        L.players.forEach(function (o) {
          var p = o.p, fill = key === "home" ? "#dceadf" : "#7298cb", g = sv("g", {});
          g.appendChild(sv("circle", { cx: o.x, cy: o.y, r: 16, fill: fill, stroke: "#b3c7bd" }));
          g.appendChild(sv("text", { x: o.x, y: o.y + 4, "font-size": 12, "font-weight": 700, fill: "#10251c" }, p.no));
          var mx = Math.max(6, Math.floor((o.per > 4 ? 52 : 66) / 5)), nm = p.name.length > mx ? p.name.slice(0, mx - 1) + "…" : p.name;
          g.appendChild(sv("text", { x: o.x, y: o.y + 27, "font-size": 8.5, "font-weight": 700, fill: "#eaf4ee", "class": "mc-pname" }, nm));
          var bd = (p.g ? "⚽" + (p.g > 1 ? p.g : "") : "") + (p.as ? "🅰" + (p.as > 1 ? p.as : "") : "") + (p.y ? "🟨" : "") + (p.rd ? "🟥" : "");
          if (bd) g.appendChild(sv("text", { x: o.x + 19, y: o.y - 8, "font-size": 8, "text-anchor": "start" }, bd));
          pl.appendChild(g); desc.push(p.name + " رقم " + p.no);
        });
        svg.appendChild(pl); holder.appendChild(svg);
        var sr = el("p", "mc-sr-only", name + ": " + desc.join("؛ ")); sr.setAttribute("aria-live", "polite"); holder.appendChild(sr);
        var pi = el("div", "mc-pitch-info"); var f = el("span", null, "الخطة: "); f.appendChild(el("bdi", null, L.formation)); pi.appendChild(f); pi.appendChild(el("span", null, "التشكيل الأساسي")); holder.appendChild(pi);
        holder.appendChild(el("p", "mc-note", "تقييمات اللاعبين بالأرقام مش متاحة في مصدر البيانات الحالي، فمش بنعرض أرقام مخترعة. اللي ظاهر هو التشكيل الأساسي الحقيقي، وجنب كل لاعب أهدافه (⚽) وصنعه (🅰) وبطاقاته لو فيه."));
      }
      draw();
    }

    function ensure(k) {
      if (painted[k]) return; painted[k] = true;
      if (k === "video") { paintVideo(); if (m.eid && !data) load().then(function () { if (cur === m) paintVideo(); }, function () {}); return; }
      needData(k, k === "events" ? paintEvents : k === "stats" ? paintStats : paintRatings);
    }
    ensure("video");
    bk.focus();
  }
  return { open: open, close: close };
})();
