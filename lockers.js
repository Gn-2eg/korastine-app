/* غرفة الملابس: التشكيلة الأساسية (Starting XI) من بيانات ESPN الحقيقية. مفيش لاعبين من عندنا. */
(function () {
  var L = window.KS_LIVE;
  var root = document.getElementById("lkRoot");
  if (!L || !root) return;
  var API = "https://site.api.espn.com/apis/site/v2/sports/soccer/";
  var AR = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  function ar(n) { return String(n).replace(/\d/g, function (d) { return AR[+d]; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var compName = {};
  L.COMPS.forEach(function (c) { compName[c.id] = c.name; });
  function hhmm(ts) { try { return new Date(ts).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
  function small(src, cls) {
    if (!src) return null;
    var mm = /^https:\/\/a\.espncdn\.com(\/i\/(?:team|league)logos\/[^?]+?\.png)$/.exec(src);
    if (mm) src = "https://a.espncdn.com/combiner/i?img=" + mm[1] + "&w=96&h=96";
    var i = el("img", cls || "pd-logo"); i.src = src; i.alt = ""; i.loading = "lazy"; i.decoding = "async";
    i.addEventListener("error", function () { if (i.parentNode) i.parentNode.removeChild(i); });
    return i;
  }
  function dayDate(o) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return d; }

  var off = 0, matches = [], loadId = 0, cache = {};

  /* ---------- جلب التشكيلة ---------- */
  var EGY = { egy: 1, egycup: 1, egycap: 1, egylc: 1, egysuper: 1 };
  var LN_URL = "https://korastine-live-proxy.gn-acc.workers.dev/lineup";
  function hasLineup(m) { return !!m.eid || !!EGY[m.comp]; }
  function cairoDay(d) { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d)); } catch (e) { return ""; } }
  function getEgyLineup(m) {
    var key = "egy:" + m.comp + ":" + m.home + ":" + m.away + ":" + cairoDay(m.date);
    var hit = cache[key];
    if (hit && (hit.ok || Date.now() - hit.t < 60000)) return Promise.resolve(hit);
    var u = LN_URL + "?date=" + cairoDay(m.date) + "&home=" + encodeURIComponent(m.home) + "&away=" + encodeURIComponent(m.away);
    return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      var out = { t: Date.now(), ok: false, teams: {} };
      if (j && j.ok) ["home", "away"].forEach(function (sd) {
        var t = j[sd]; if (!t || !t.starters || t.starters.length < 11) return;
        out.teams[sd] = { formation: t.formation || "", color: "6b7a86", starters: t.starters, bench: t.bench || [] };
        out.ok = true;
      });
      cache[key] = out; return out;
    }).catch(function () { return { t: Date.now(), ok: false, err: true, teams: {} }; });
  }
  function getLineup(m) {
    if (!m.eid && EGY[m.comp]) return getEgyLineup(m);
    var hit = cache[m.eid];
    if (hit && (hit.ok || Date.now() - hit.t < 60000)) return Promise.resolve(hit);
    return fetch(API + m.comp + "/summary?event=" + m.eid).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      var out = { t: Date.now(), ok: false, teams: {} };
      (j.rosters || []).forEach(function (r) {
        var st = (r.roster || []).filter(function (p) { return p.starter; });
        if (st.length < 11) return;
        out.teams[r.homeAway] = {
          formation: r.formation || "",
          color: (r.uniform && r.uniform.color) || (r.team && r.team.color) || "888888",
          starters: st.map(function (p) { return { n: p.jersey || "", name: (p.athlete && (p.athlete.displayName || p.athlete.shortName)) || "", pos: (p.position && p.position.abbreviation) || "", place: +p.formationPlace || 0 }; }),
          bench: (r.roster || []).filter(function (p) { return !p.starter && p.jersey; }).map(function (p) { return { n: p.jersey, name: (p.athlete && (p.athlete.displayName || p.athlete.shortName)) || "" }; })
        };
        out.ok = true;
      });
      cache[m.eid] = out; return out;
    }).catch(function () { return { t: Date.now(), ok: false, err: true, teams: {} }; });
  }

  /* ---------- ترتيب اللاعبين على الملعب ---------- */
  function depth(pos) {
    if (pos === "G") return 0;
    if (/^(CD|CB|SW|LB|RB)/.test(pos)) return 1;
    if (/WB/.test(pos)) return 1.5;
    if (/^DM/.test(pos)) return 2;
    if (/^(CM|LM|RM)/.test(pos)) return 2.5;
    if (/^(AM|LAM|RAM)/.test(pos)) return 3;
    return 4;
  }
  function xr(pos) {
    if (/(^L|-L$)/.test(pos)) return 0;
    if (/(^R|-R$)/.test(pos)) return 2;
    return 1;
  }
  function rows(t) {
    var s = t.starters.slice().sort(function (a, b) { return depth(a.pos) - depth(b.pos) || a.place - b.place; });
    var gk = s.filter(function (p) { return p.pos === "G"; });
    var rest = s.filter(function (p) { return p.pos !== "G"; });
    var nums = (t.formation || "").split("-").map(Number).filter(function (x) { return x > 0; });
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    var out = [gk];
    if (gk.length === 1 && sum === rest.length) {
      var i = 0; nums.forEach(function (n) { out.push(rest.slice(i, i + n)); i += n; });
    } else {
      var g = {}; rest.forEach(function (p) { var d = Math.floor(depth(p.pos)); (g[d] = g[d] || []).push(p); });
      Object.keys(g).sort().forEach(function (k) { out.push(g[k]); });
    }
    out.forEach(function (r) { r.sort(function (a, b) { return xr(a.pos) - xr(b.pos) || a.place - b.place; }); });
    return out;
  }

  function lum(hex) { var n = parseInt(hex, 16) || 0; return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); }
  function shirt(color, num) {
    var ink = lum(color) > 150 ? "#0a1219" : "#ffffff";
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg"); s.setAttribute("viewBox", "0 0 64 60"); s.setAttribute("class", "lk-shirt");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M22 3l-6 3-13 8 6 12 7-3v31h28V23l7 3 6-12-13-8-6-3c-2 5-6 7-10 7s-8-2-10-7z");
    p.setAttribute("fill", "#" + color); p.setAttribute("stroke", ink === "#ffffff" ? "#ffffff" : "#0a1219"); p.setAttribute("stroke-width", "1.6"); p.setAttribute("stroke-linejoin", "round");
    s.appendChild(p);
    var t = document.createElementNS(ns, "text");
    t.setAttribute("x", "32"); t.setAttribute("y", "38"); t.setAttribute("text-anchor", "middle"); t.setAttribute("font-size", "19"); t.setAttribute("font-weight", "800"); t.setAttribute("fill", ink); t.setAttribute("font-family", "Changa,Cairo,sans-serif");
    t.textContent = ar(num || ""); s.appendChild(t);
    return s;
  }

  /* ---------- الأوضة (شاشة التشكيلة) ---------- */
  var sheet = null;
  function closeSheet() { if (sheet) { document.body.removeChild(sheet); sheet = null; document.body.classList.remove("lk-open"); } }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });
  window.addEventListener("hashchange", closeSheet);

  function openRoom(m, side) {
    closeSheet();
    sheet = el("div", "lk-sheet"); document.body.appendChild(sheet); document.body.classList.add("lk-open");
    var box = el("div", "lk-room"); sheet.appendChild(box);
    sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    function paint(data) {
      box.innerHTML = "";
      var top = el("div", "lk-top");
      var x = el("button", "lk-x", "✕"); x.type = "button"; x.setAttribute("aria-label", "إغلاق"); x.addEventListener("click", closeSheet);
      top.appendChild(x);
      var tabs = el("div", "lk-tabs");
      ["home", "away"].forEach(function (sd) {
        var b = el("button", "lk-tab" + (sd === side ? " on" : "")); b.type = "button";
        var lg = small(sd === "home" ? m.homeLogo : m.awayLogo, "lk-tlogo"); if (lg) b.appendChild(lg);
        b.appendChild(el("span", null, sd === "home" ? m.home : m.away));
        b.addEventListener("click", function () { side = sd; paint(data); });
        tabs.appendChild(b);
      });
      top.appendChild(tabs); box.appendChild(top);
      var sub = el("div", "lk-sub", (compName[m.comp] || "") + " · " + (m.status === "ft" ? "انتهت" : m.status === "live" ? "مباشر" : hhmm(m.date)));
      box.appendChild(sub);
      var t = data && data.teams[side];
      if (!data) { box.appendChild(el("p", "lk-empty", "بنجيب التشكيلة…")); return; }
      if (!t) {
        box.appendChild(el("p", "lk-empty", data.err ? "مقدرتش أجيب التشكيلة. جرّب تاني." : "التشكيلة لسه ما اتعلنتش."));
        return;
      }
      var fm = el("div", "lk-form", "التشكيلة الأساسية"); if (t.formation) { var fb = el("b", null, " " + ar(t.formation)); fb.setAttribute("dir", "ltr"); fb.style.unicodeBidi = "isolate"; fm.appendChild(fb); } box.appendChild(fm);
      var pitch = el("div", "lk-pitch"); pitch.appendChild(el("i", "lk-line")); pitch.appendChild(el("i", "lk-circle"));
      var rs = rows(t), n = rs.length;
      rs.forEach(function (r, i) {
        var row = el("div", "lk-row"); row.style.bottom = (3 + (n === 1 ? 0 : i * (78 / (n - 1)))) + "%";
        r.forEach(function (p) {
          var c = el("div", "lk-p"); c.appendChild(shirt(t.color, p.n));
          var nm = p.name.split(" "); c.appendChild(el("span", "lk-name", nm.length > 2 ? nm[0].charAt(0) + ". " + nm.slice(-1)[0] : p.name));
          row.appendChild(c);
        });
        pitch.appendChild(row);
      });
      box.appendChild(pitch);
      if (t.bench.length) {
        box.appendChild(el("h4", "lk-bh", "دكة البدلاء"));
        var b = el("div", "lk-bench");
        t.bench.forEach(function (p) { var c = el("div", "lk-b"); c.appendChild(el("b", null, ar(p.n))); c.appendChild(el("span", null, p.name)); b.appendChild(c); });
        box.appendChild(b);
      }
    }
    paint(null);
    getLineup(m).then(function (d) { if (sheet) paint(d); });
  }

  /* ---------- قائمة الماتشات ---------- */
  function build() {
    root.innerHTML = "";
    var hero = el("div", "lk-hero");
    hero.appendChild(el("b", null, "غرفة الملابس"));
    hero.appendChild(el("span", null, "دوس على أي فريق تشوف تشكيلته الأساسية"));
    root.appendChild(hero);
    var strip = el("div", "pd-days");
    [["إمبارح", -1], ["النهارده", 0], ["بكرة", 1]].forEach(function (d) {
      var b = el("button", "pd-day" + (off === d[1] ? " on" : ""), d[0]); b.type = "button";
      b.addEventListener("click", function () { off = d[1]; build(); refresh(); });
      strip.appendChild(b);
    });
    root.appendChild(strip);
    root.appendChild(el("div", "lk-list", ""));
    paintList("بنحمّل الماتشات…");
  }
  function paintList(msg) {
    var box = root.querySelector(".lk-list"); if (!box) return;
    box.innerHTML = "";
    if (msg) { box.appendChild(el("p", "pd-empty", msg)); return; }
    if (!matches.length) { box.appendChild(el("p", "pd-empty", "مفيش ماتشات في اليوم ده.")); return; }
    matches.forEach(function (m) {
      var c = el("article", "lk-match");
      var h = el("div", "pd-head"); h.appendChild(el("span", "pd-comp", compName[m.comp] || ""));
      h.appendChild(el("span", "pd-time", m.status === "live" ? "● مباشر" : m.status === "ft" ? "انتهت" : m.status === "pp" ? "مؤجلة" : hhmm(m.date)));
      c.appendChild(h);
      var r = el("div", "lk-pair");
      [["home", m.home, m.homeLogo], ["away", m.away, m.awayLogo]].forEach(function (x) {
        if (!hasLineup(m)) {
          var d = el("div", "lk-team off"); var l0 = small(x[2]); if (l0) d.appendChild(l0); d.appendChild(el("span", null, x[1])); d.appendChild(el("em", null, "مفيش مصدر للتشكيلة")); r.appendChild(d); return;
        }
        var b = el("button", "lk-team"); b.type = "button";
        var lg = small(x[2]); if (lg) b.appendChild(lg);
        b.appendChild(el("span", null, x[1])); b.appendChild(el("em", null, "شوف التشكيلة"));
        b.addEventListener("click", function () { openRoom(m, x[0]); });
        r.appendChild(b);
      });
      c.appendChild(r); box.appendChild(c);
    });
  }
  function refresh() {
    var my = ++loadId;
    L.loadDay(dayDate(off), false).then(function (r) {
      if (my !== loadId) return;
      matches = r.matches.filter(function (m) { return m.status !== "pp"; }).sort(function (a, b) { return a.date - b.date; });
      paintList();
    }).catch(function () { if (my === loadId) paintList("مقدرتش أجيب الماتشات. جرّب تاني."); });
  }
  function show() { build(); refresh(); }
  window.addEventListener("hashchange", function () { if (location.hash === "#/lockers") show(); });
  if (location.hash === "#/lockers") show(); else build();
})();
