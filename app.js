(function () {
  var D = window.KS_DATA;
  var AR = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  function ar(n) { return String(n).replace(/\d/g, function (d) { return AR[+d]; }); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function logoImg(src, cls) {
    if (!src) return null;
    var i = el("img", cls || "logo");
    /* لوجوهات ESPN أصلها 500px، بنطلبها بحجم الاستخدام الفعلي (أخف عشرات المرات) */
    var mm = /^https:\/\/a\.espncdn\.com(\/i\/(?:team|league)logos\/[^?]+?\.png)$/.exec(src);
    if (mm) src = "https://a.espncdn.com/combiner/i?img=" + mm[1] + "&w=" + (/lg-logo/.test(cls || "") ? 72 : 112) + "&h=" + (/lg-logo/.test(cls || "") ? 72 : 112);
    i.src = src; i.alt = ""; i.loading = "lazy"; i.decoding = "async";
    i.addEventListener("error", function () {
      var ph = (window.KS_LIVE && window.KS_LIVE.UNKNOWN_LOGO) || "";
      if (ph && !i.dataset.ph && i.getAttribute("src") !== ph) { i.dataset.ph = "1"; i.src = ph; return; }
      if (i.parentNode) i.parentNode.removeChild(i);
    });
    return i;
  }

  /* ---------- real data ---------- */
  var L = window.KS_LIVE, compName = {};
  L.COMPS.forEach(function (c) { compName[c.id] = c.name; });
  var DAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  var MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  var sel = 0, lastLive = [], timer = null, reqId = 0;

  /* ---------- القناة الناقلة والمعلق (بيانات FilGoal) ---------- */
  var TV = null, tvPair = null, tvHome = null, tvAway = null, tvAt = 0, tvPromise = null;
  function normAr(s) {
    return String(s == null ? "" : s)
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
      .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
      .replace(/\u0649/g, "\u064A").replace(/\u0629/g, "\u0647")
      .replace(/[|\u060C,.()\-\u2013\u2014]/g, " ")
      .replace(/\s+/g, " ").trim();
  }
  function buildTVIndex() {
    tvPair = {}; tvHome = {}; tvAway = {};
    ((TV && TV.matches) || []).forEach(function (t) {
      var h = normAr(t.home), a = normAr(t.away);
      if (!h || !a || !t.kick) return;
      tvPair[h + "|" + a] = t;
      (tvHome[h] = tvHome[h] || []).push(t);
      (tvAway[a] = tvAway[a] || []).push(t);
    });
    buildCompIndex();
  }
  function nearKick(t, ts, mins) { return !!(t && t.kick && Math.abs(t.kick - ts) <= mins * 60000); }
  function oneIn(list, ts, mins) {
    if (!list) return null;
    var hit = list.filter(function (t) { return nearKick(t, ts, mins); });
    return hit.length === 1 ? hit[0] : null;
  }
  /* أسماء البطولات في FilGoal مقابل معرّف البطولة عندنا (للمطابقة لما اسم الفريق مختلف) */
  var FGL = {
    "egy": ["الدوري المصري", "الدوري المصري الممتاز"],
    "egycup": ["كأس مصر"], "egycap": ["كأس عاصمة مصر", "كأس العاصمة"],
    "egylc": ["كأس الرابطة المصرية", "كأس الرابطة"], "egysuper": ["كأس السوبر المصري"],
    "ksa.1": ["الدوري السعودي للمحترفين", "دوري روشن السعودي", "دوري روشن"],
    "ksa.kings.cup": ["كأس خادم الحرمين الشريفين"],
    "esp.1": ["الدوري الإسباني"], "ita.1": ["الدوري الإيطالي"], "ger.1": ["الدوري الألماني"],
    "fra.1": ["الدوري الفرنسي"], "eng.1": ["الدوري الإنجليزي الممتاز", "الدوري الإنجليزي"],
    "uefa.champions": ["دوري أبطال أوروبا"], "uefa.europa": ["الدوري الأوروبي"],
    "uefa.europa.conf": ["دوري المؤتمر الأوروبي", "دوري المؤتمر"],
    "caf.champions": ["دوري أبطال إفريقيا", "دوري أبطال أفريقيا"],
    "caf.confed": ["كأس الكونفدرالية", "كأس الكونفدرالية الأفريقية"],
    "caf.supercup": ["كأس السوبر الأفريقي"],
    "afc.champions": ["دوري أبطال آسيا للنخبة"], "fifa.world": ["كأس العالم"],
    "caf.nations": ["كأس الأمم الأفريقية"], "uefa.euro": ["كأس الأمم الأوروبية"],
    "conmebol.america": ["كوبا أمريكا"], "afc.asian.cup": ["كأس آسيا"],
    "uefa.nations": ["دوري الأمم الأوروبية"], "fifa.friendly": ["مباريات ودية", "ودية"],
    "eng.fa": ["كأس الاتحاد الإنجليزي"], "eng.league_cup": ["كأس الرابطة الإنجليزية"],
    "esp.copa_del_rey": ["كأس ملك إسبانيا"], "ita.coppa_italia": ["كأس إيطاليا"],
    "usa.1": ["الدوري الأمريكي"], "uae": ["الدوري الإماراتي"], "arab.cup": ["كأس العرب"]
  };
  var tvComp = {};
  function buildCompIndex() {
    tvComp = {};
    var byLg = {};
    Object.keys(FGL).forEach(function (c) {
      FGL[c].forEach(function (n) { byLg[normAr(n)] = c; });
    });
    ((TV && TV.matches) || []).forEach(function (t) {
      var c = byLg[normAr(t.lg)];
      if (!c) return;
      (tvComp[c] = tvComp[c] || []).push(t);
    });
  }
  /* مطابقة الفريقين + الميعاد، وبعدها فريق واحد لو الميعاد قريب ومفيش غير ماتش واحد */
  function findTV(m) {
    if (!tvPair) return null;
    var h = normAr(m.home), a = normAr(m.away);
    var e = tvPair[h + "|" + a];
    if (nearKick(e, m.date, 20)) return e;
    e = tvPair[a + "|" + h];
    if (nearKick(e, m.date, 20)) return e;
    var byName = oneIn(tvHome[h], m.date, 10) || oneIn(tvAway[a], m.date, 10);
    if (byName) return byName;
    /* آخر حل: نفس البطولة ونفس الميعاد بالظبط ومفيش غير ماتش واحد */
    return oneIn(tvComp[m.comp], m.date, 6);
  }
  function ensureTV() {
    if (tvPromise && Date.now() - tvAt < 300000) return tvPromise;
    tvAt = Date.now();
    tvPromise = fetch("tv.json?ts=" + tvAt, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (j) { TV = j; buildTVIndex(); })
      .catch(function () { /* مفيش داتا قنوات: البطاقة تفضل زي ما هي */ });
    return tvPromise;
  }

  function hhmm(ts) {
    return new Date(ts).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  function dayDate(off) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return d; }

  function renderStrip() {
    var strip = document.getElementById("dayStrip");
    strip.innerHTML = "";
    for (var o = -7; o <= 7; o++) {
      (function (o) {
        var d = dayDate(o);
        var b = el("button", "day" + (o === sel ? " on" : ""));
        b.type = "button";
        b.appendChild(el("small", null, o === 0 ? "النهارده" : DAYS[d.getDay()]));
        b.appendChild(el("b", null, ar(d.getDate())));
        b.appendChild(el("small", null, MONTHS[d.getMonth()]));
        b.addEventListener("click", function () { sel = o; renderStrip(); load(false); });
        if (o === sel) b.setAttribute("aria-current", "date");
        strip.appendChild(b);
      })(o);
    }
    var on = strip.querySelector(".on");
    if (on && on.scrollIntoView) on.scrollIntoView({ inline: "center", block: "nearest" });
  }

  function fullTime(ts) {
    try {
      return new Date(ts).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
    } catch (e) { return hhmm(ts); }
  }

  function detailText(v) {
    if (!v) return "";
    var t = String(v).trim();
    if (/^scheduled$/i.test(t)) return "لسه ما بدأتش";
    if (/^(ft|full time|full-time)$/i.test(t)) return "انتهت";
    if (/^(ht|half time)$/i.test(t)) return "بين الشوطين";
    if (/^(postponed|pst)$/i.test(t)) return "مؤجلة";
    if (/^(1h|2h|et|bt|live)$/i.test(t)) return "شغالة دلوقتي";
    if (/[\u0600-\u06FF]/.test(t)) return t;
    return "";
  }

  function addFact(box, label, value) {
    if (!value) return;
    var d = el("div", "fact");
    d.appendChild(el("span", null, label));
    d.appendChild(el("b", null, String(value)));
    box.appendChild(d);
  }

  function matchRow(m) {
    var wrap = el("div", "match-wrap");
    var row = el("div", "match-row" + (m.status === "live" ? " is-live" : ""));
    var home = el("div", "team");
    home.appendChild(logoImg(m.homeLogo) || el("span", "dot"));
    home.appendChild(el("span", null, m.home));
    var center = el("div", "center");
    var hasScore = !isNaN(m.hs) && !isNaN(m.as);
    if (m.status === "upcoming" || m.status === "pp" || !hasScore) {
      center.appendChild(el("span", "time", m.status === "pp" ? "مؤجلة" : hhmm(m.date)));
    } else {
      var sc = el("span", "score score-nums");
      sc.appendChild(el("span", null, String(m.hs)));
      sc.appendChild(el("span", "sep", "-"));
      sc.appendChild(el("span", null, String(m.as)));
      center.appendChild(sc);
      center.appendChild(el("span", "minute" + (m.status === "ft" ? " ft" : ""), m.status === "live" ? "مباشر " + ar(m.minute || "") : "انتهت"));
    }
    var away = el("div", "team away");
    away.appendChild(logoImg(m.awayLogo) || el("span", "dot"));
    away.appendChild(el("span", null, m.away));
    var more = el("button", "more-btn", "المزيد");
    more.type = "button";
    more.setAttribute("aria-expanded", "false");
    center.appendChild(more);
    row.appendChild(home); row.appendChild(center); row.appendChild(away);

    var detail = el("div", "match-more");
    detail.hidden = true;
    addFact(detail, "البطولة", compName[m.comp]);
    addFact(detail, "الحالة", detailText(m.detail));
    addFact(detail, "الملعب", m.venue);
    addFact(detail, "التوقيت", fullTime(m.date) + " (بتوقيتك)");
    var tv = findTV(m);
    if (tv && (tv.ch || tv.cm)) {
      addFact(detail, "القناة الناقلة", tv.ch);
      addFact(detail, "المعلق", tv.cm);
    }
    more.addEventListener("click", function () {
      detail.hidden = !detail.hidden;
      more.textContent = detail.hidden ? "المزيد" : "أقل";
      more.setAttribute("aria-expanded", detail.hidden ? "false" : "true");
    });

    wrap.appendChild(row);
    wrap.appendChild(detail);
    return wrap;
  }

  var COL_CAP = 6;

  function groupEl(g, gi) {
    var sec = el("section", "lg-group" + (g.card ? " mcard" + (g.list[0].status === "live" ? " is-live-card" : "") : ""));
    if (!g.card || g.first) sec.id = "lg-" + g.id.replace(/\W/g, "_");
    var label = el("div", "lg-label");
    var lg = null;
    for (var q = 0; q < g.list.length; q++) if (g.list[q].leagueLogo) { lg = g.list[q].leagueLogo; break; }
    var lgi = logoImg(lg, "logo lg-logo");
    if (lgi) label.appendChild(lgi);
    label.appendChild(el("span", "lg-name", compName[g.id] + (g.more ? " (تكملة)" : "")));
    if (g.card) {
      var md = g.list[0].date, dtxt = "";
      try { dtxt = new Date(md).toLocaleDateString("ar-EG", { day: "numeric", month: "long" }) + " · " + hhmm(md); } catch (e) { dtxt = hhmm(md); }
      label.appendChild(el("b", "lg-date", dtxt));
    } else label.appendChild(el("b", null, ar(g.n) + " ماتش"));
    /* دوس على اسم/لوجو الدوري تفتح لوحة الترتيب والهدافين */
    label.appendChild(el("span", "lg-chev", "‹"));
    label.setAttribute("role", "button");
    label.tabIndex = 0;
    label.classList.add("lg-tap");
    label.setAttribute("aria-label", compName[g.id] + " — الترتيب والهدافين");
    label.addEventListener("click", function () { openDash(g.id); });
    label.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDash(g.id); }
    });
    if (gi) sec.style.animationDelay = (gi * 45) + "ms";
    sec.appendChild(label);
    g.list.forEach(function (m) { sec.appendChild(matchRow(m)); });
    return sec;
  }

  var lastRes = null, lastCols = 0, filterComp = "";

  function fillFilter() {
    var sel = document.getElementById("compFilter");
    if (!sel || sel.dataset.sig === "v1") return;
    sel.innerHTML = "";
    var lv = el("option", null, "● مباشر");
    lv.value = "__live"; sel.appendChild(lv);
    var all = el("option", null, "كل البطولات");
    all.value = ""; sel.appendChild(all);
    /* الدوريات الأول (بترتيب الأهمية)، وبعدهم الكؤوس */
    function grp(label, list) {
      if (!list.length) return;
      var g = document.createElement("optgroup");
      g.label = label;
      list.forEach(function (c) {
        var o = el("option", null, c.name);
        o.value = c.id; g.appendChild(o);
      });
      sel.appendChild(g);
    }
    grp("الدوريات", L.COMPS.filter(function (c) { return !c.cup; }));
    grp("الكؤوس", L.COMPS.filter(function (c) { return c.cup; }));
    sel.dataset.sig = "v1";
    sel.value = filterComp || "";
  }


  /* ---------- فلتر البطولات الجديد (شيت بلوجوهات وعدّاد) ---------- */
  var FX_ON = /[?&]fx=1\b/.test(location.search) || localStorage.getItem("ks_fx") === "1";
  function fxCounts(res) {
    var cnt = {}, logo = {};
    res.matches.forEach(function (m) {
      cnt[m.comp] = (cnt[m.comp] || 0) + 1;
      if (m.leagueLogo && !logo[m.comp]) logo[m.comp] = m.leagueLogo;
    });
    return { cnt: cnt, logo: logo };
  }
  function fxClose() {
    var sh = document.getElementById("fxSheet");
    if (sh) sh.hidden = true;
    document.body.classList.remove("fx-open");
  }
  function fxPick(v) {
    var sel = document.getElementById("compFilter");
    if (sel) { sel.value = v; sel.dispatchEvent(new Event("change")); }
    fxClose();
  }
  function fxRow(v, name, logoSrc, n, on, dim, icon) {
    var b = el("button", "fx-row" + (on ? " on" : "") + (dim ? " dim" : ""));
    b.type = "button";
    b.setAttribute("role", "option");
    b.setAttribute("aria-selected", on ? "true" : "false");
    var ic = el("span", "fx-ic");
    if (icon) ic.textContent = icon;
    else { var im = logoImg(logoSrc, "logo"); if (im) ic.appendChild(im); }
    b.appendChild(ic);
    b.appendChild(el("span", "fx-nm", name));
    b.appendChild(el("span", "fx-n", ar(n)));
    b.addEventListener("click", function () { fxPick(v); });
    return b;
  }
  function fxSync(res, liveN) {
    if (!FX_ON) return;
    var row = document.querySelector(".filter-row");
    var sel = document.getElementById("compFilter");
    if (!row || !sel) return;
    row.classList.add("fx");
    var c = fxCounts(res);
    var total = res.matches.length;
    var cur = filterComp || "";
    var curName = cur === "__live" ? "مباشر" : cur ? ((L.COMPS.filter(function (x) { return x.id === cur; })[0] || {}).name || "") : "كل البطولات";
    var curN = cur === "__live" ? liveN : cur ? (c.cnt[cur] || 0) : total;
    var btn = document.getElementById("fxBtn");
    if (!btn) {
      btn = el("button", "fx-btn"); btn.id = "fxBtn"; btn.type = "button";
      btn.setAttribute("aria-haspopup", "listbox");
      btn.addEventListener("click", function () {
        var sh = document.getElementById("fxSheet");
        if (sh) { sh.hidden = false; document.body.classList.add("fx-open"); }
      });
      row.appendChild(btn);
    }
    btn.innerHTML = "";
    var li = cur && cur !== "__live" ? (c.logo[cur] || (L.compLogo && L.compLogo(cur))) : null;
    var ic = el("span", "fx-ic");
    if (li) { var im = logoImg(li, "logo"); if (im) ic.appendChild(im); } else ic.textContent = cur === "__live" ? "●" : "⚽";
    if (cur === "__live") ic.classList.add("live");
    btn.appendChild(ic);
    btn.appendChild(el("span", "fx-nm", curName));
    btn.appendChild(el("span", "fx-n", ar(curN)));
    btn.appendChild(el("span", "fx-chev", "▾"));

    var sh = document.getElementById("fxSheet");
    if (!sh) {
      sh = el("div", "fx-ov"); sh.id = "fxSheet"; sh.hidden = true;
      sh.addEventListener("click", function (e) { if (e.target === sh) fxClose(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") fxClose(); });
      document.body.appendChild(sh);
    }
    sh.innerHTML = "";
    var p = el("div", "fx-panel");
    p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "اختار بطولة");
    var hd = el("div", "fx-head");
    hd.appendChild(el("h3", null, "اختار البطولة"));
    var x = el("button", "fx-x", "✕"); x.type = "button"; x.setAttribute("aria-label", "قفل");
    x.addEventListener("click", fxClose);
    hd.appendChild(x);
    p.appendChild(hd);
    var list = el("div", "fx-list"); list.setAttribute("role", "listbox");
    list.appendChild(fxRow("__live", "مباشر دلوقتي", null, liveN, cur === "__live", false, "●"));
    list.querySelector(".fx-ic").classList.add("live");
    list.appendChild(fxRow("", "كل البطولات", null, total, cur === "", false, "⚽"));
    var withM = L.COMPS.filter(function (x) { return c.cnt[x.id]; });
    var without = L.COMPS.filter(function (x) { return !c.cnt[x.id]; });
    if (withM.length) list.appendChild(el("div", "fx-sec", "ماتشات في اليوم المختار"));
    withM.forEach(function (x) { list.appendChild(fxRow(x.id, x.name, c.logo[x.id] || (L.compLogo && L.compLogo(x.id)), c.cnt[x.id], cur === x.id, false)); });
    if (without.length) list.appendChild(el("div", "fx-sec", "مفيش ماتشات في اليوم ده"));
    without.forEach(function (x) { list.appendChild(fxRow(x.id, x.name, c.logo[x.id] || (L.compLogo && L.compLogo(x.id)), 0, cur === x.id, true)); });
    p.appendChild(list);
    sh.appendChild(p);
  }
  function initFilter() {
    var sel = document.getElementById("compFilter");
    if (!sel) return;
    sel.addEventListener("change", function () {
      filterComp = sel.value;
      if (filterComp === "__live" && sel_day() !== 0) { setDay(0); return; }
      if (lastRes) render(lastRes, false);
    });
  }
  function render(res, animate) {
    lastRes = res;
    var wrap = document.getElementById("leagueBlocks"), rail = document.getElementById("leagueRail");
    wrap.innerHTML = ""; rail.innerHTML = "";
    var groups = {}, order = [];
    var liveAll = res.matches.filter(function (m) { return m.status === "live"; });
    var isLiveF = filterComp === "__live";
    (isLiveF ? liveAll : res.matches).forEach(function (m) {
      if (!groups[m.comp]) { groups[m.comp] = []; order.push(m.comp); }
      groups[m.comp].push(m);
    });
    var idx = {}; L.COMPS.forEach(function (c, i) { idx[c.id] = i; });
    order.sort(function (a, b) { return idx[a] - idx[b]; });
    fillFilter();
    var lvOpt = document.querySelector("#compFilter option[value='__live']");
    if (lvOpt) lvOpt.textContent = "● مباشر (" + ar(liveAll.length) + ")";
    fxSync(res, liveAll.length);
    if (filterComp && !isLiveF && groups[filterComp]) order = [filterComp];
    var gs = order.map(function (id) { return { id: id, list: groups[id], n: groups[id].length }; });

    /* كل عمود يشيل حوالي ٦ ماتشات، والدوري ما يتقسمش غير لو أطول من كده */
    var cols = [], cur = { items: [], n: 0 };
    gs.forEach(function (g) {
      var rest = g.list.slice(), done = 0;
      while (rest.length) {
        if (cur.n >= COL_CAP) { cols.push(cur); cur = { items: [], n: 0 }; }
        var space = COL_CAP - cur.n;
        var take = Math.min(space, rest.length);
        cur.items.push({ id: g.id, list: rest.slice(0, take), n: take, more: done > 0 });
        cur.n += take; done += take;
        rest = rest.slice(take);
        if (cur.n >= COL_CAP) { cols.push(cur); cur = { items: [], n: 0 }; }
      }
    });
    if (cur.items.length) cols.push(cur);

    /* كل ماتش في كارت لوحده (الدوري ظاهر في راس الكارت) */
    var cards = [];
    gs.forEach(function (g) { g.list.forEach(function (m) { cards.push({ id: g.id, list: [m], n: 1, card: true }); }); });
    /* ترتيب بالوقت: الأبكر الأول، ولو نفس الوقت بترتيب أهمية الدوري */
    cards.sort(function (a, b) { return (a.list[0].date - b.list[0].date) || (idx[a.id] - idx[b.id]); });
    var seenComp = {};
    cards.forEach(function (c) { c.first = !seenComp[c.id]; seenComp[c.id] = 1; });
    /* ٤ كروت في كل عمود (على الموبايل بتتسحب الأعمدة يمين وشمال) */
    cols = [];
    for (var ci = 0; ci < cards.length; ci += 4) cols.push({ items: cards.slice(ci, ci + 4), n: 4 });

    var gi = 0;
    cols.forEach(function (b) {
      var col = el("div", "col");
      b.items.forEach(function (g) { col.appendChild(groupEl(g, gi++)); });
      wrap.appendChild(col);
    });

    gs.forEach(function (g) {
      var li = el("li"), a = el("a");
      a.href = "#/scores";
      a.addEventListener("click", function (e) { e.preventDefault(); var t = document.getElementById("lg-" + g.id.replace(/\W/g, "_")); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); });
      a.appendChild(el("span", null, compName[g.id]));
      a.appendChild(el("b", null, ar(g.n)));
      li.appendChild(a); rail.appendChild(li);
    });

    var st = document.getElementById("dataStatus");
    if (isLiveF && !liveAll.length) {
      wrap.appendChild(el("p", "note", "مفيش ماتشات شغالة دلوقتي."));
    } else if (filterComp && !isLiveF && !groups[filterComp]) {
      wrap.appendChild(el("p", "note", "مفيش ماتشات في البطولة دي اليوم ده."));
    }
    if (!res.matches.length && !isLiveF) {
      wrap.appendChild(el("p", "note", res.errors ? "مقدرتش أجيب الداتا دلوقتي. جرّب تاني." : "مفيش ماتشات في الدوريات دي اليوم ده."));
    }
    var msg = "آخر تحديث " + hhmm(res.at) + " · بتوقيتك";
    if (res.errors) msg += " · " + ar(res.errors) + " مصدر ماردّش";
    st.textContent = msg;
    var live = res.matches.filter(function (m) { return m.status === "live"; }).length;
    document.getElementById("liveCount").textContent = ar(live);
    renderFeatured(res.matches);
  }

  var HERO = ["egy", "egycup", "egycap", "egylc", "egysuper",
    "uefa.champions", "eng.1", "esp.1", "ita.1", "ger.1", "fra.1", "uefa.europa", "uefa.europa.conf",
    "caf.champions", "caf.confed", "caf.supercup",
    "ksa.1", "ksa.kings.cup",
    "fifa.world", "caf.nations", "uefa.euro", "conmebol.america", "afc.asian.cup", "arab.cup",
    "uefa.nations", "fifa.friendly", "afc.champions",
    "fifa.worldq.caf", "fifa.worldq.uefa", "fifa.worldq.afc", "fifa.worldq.conmebol",
    "eng.fa", "eng.league_cup", "esp.copa_del_rey", "ita.coppa_italia", "uae", "usa.1"];
  function heroRank(m) {
    var i = HERO.indexOf(m.comp);
    return i < 0 ? 999 : i;
  }
  /* الماتش الرئيسي: لايف الأول (والمصري قبل غيره)، وبعدين أهم ماتش جاي، وبعدين اللي انتهى */
  function pickHero(matches) {
    var live = matches.filter(function (m) { return m.status === "live"; });
    var up = matches.filter(function (m) { return m.status === "upcoming"; });
    var ft = matches.filter(function (m) { return m.status === "ft"; });
    var byRank = function (a, b) { return heroRank(a) - heroRank(b) || a.date - b.date; };
    if (live.length) return live.slice().sort(byRank)[0];
    if (up.length) return up.slice().sort(byRank)[0];
    if (ft.length) return ft.slice().sort(function (a, b) { return heroRank(a) - heroRank(b) || b.date - a.date; })[0];
    return matches[0];
  }

  function renderFeatured(matches) {
    var box = document.getElementById("featured");
    box.innerHTML = "";
    var pick = pickHero(matches);
    box.hidden = !pick;
    if (!pick) return;
    var fl = el("div", "fl-wrap"); fl.innerHTML = '<svg class="fl-svg" viewBox="0 0 230 120" preserveAspectRatio="none" aria-hidden="true"><path d="M-6.0 -8.9L1.6 -7.3L9.1 -5.7L16.7 -4.2L24.2 -2.8L31.8 -1.6L39.4 -0.6L46.9 0.3L54.5 0.9L62.1 1.3L69.6 1.5L77.2 1.5L84.8 1.3L92.3 1.1L99.9 0.7L107.4 0.3L115.0 0.0L122.6 -0.3L130.1 -0.4L137.7 -0.4L145.2 -0.1L152.8 0.4L160.4 1.3L167.9 2.4L175.5 3.9L183.1 5.7L190.6 7.8L198.2 10.1L205.8 12.8L213.3 15.7L220.9 18.7L228.4 21.9L236.0 25.1L236.0 31.7L228.4 29.0L220.9 26.4L213.3 23.8L205.8 21.5L198.2 19.3L190.6 17.4L183.1 15.7L175.5 14.3L167.9 13.2L160.4 12.4L152.8 11.8L145.2 11.5L137.7 11.4L130.1 11.5L122.6 11.7L115.0 12.0L107.4 12.3L99.9 12.6L92.3 12.8L84.8 12.9L77.2 12.8L69.6 12.5L62.1 12.0L54.5 11.3L46.9 10.3L39.4 9.0L31.8 7.6L24.2 5.9L16.7 4.0L9.1 2.0L1.6 -0.1L-6.0 -2.3Z" fill="#000000"/><path d="M-6.0 -2.3L1.6 -0.1L9.1 2.0L16.7 4.0L24.2 5.9L31.8 7.6L39.4 9.0L46.9 10.3L54.5 11.3L62.1 12.0L69.6 12.5L77.2 12.8L84.8 12.9L92.3 12.8L99.9 12.6L107.4 12.3L115.0 12.0L122.6 11.7L130.1 11.5L137.7 11.4L145.2 11.5L152.8 11.8L160.4 12.4L167.9 13.2L175.5 14.3L183.1 15.7L190.6 17.4L198.2 19.3L205.8 21.5L213.3 23.8L220.9 26.4L228.4 29.0L236.0 31.7L236.0 38.3L228.4 36.1L220.9 34.0L213.3 32.0L205.8 30.1L198.2 28.4L190.6 27.0L183.1 25.7L175.5 24.7L167.9 24.0L160.4 23.5L152.8 23.2L145.2 23.1L137.7 23.2L130.1 23.4L122.6 23.7L115.0 24.0L107.4 24.3L99.9 24.5L92.3 24.6L84.8 24.5L77.2 24.2L69.6 23.6L62.1 22.8L54.5 21.7L46.9 20.3L39.4 18.6L31.8 16.7L24.2 14.5L16.7 12.2L9.1 9.6L1.6 7.0L-6.0 4.3Z" fill="#ffffff"/><path d="M-6.0 4.3L1.6 7.0L9.1 9.6L16.7 12.2L24.2 14.5L31.8 16.7L39.4 18.6L46.9 20.3L54.5 21.7L62.1 22.8L69.6 23.6L77.2 24.2L84.8 24.5L92.3 24.6L99.9 24.5L107.4 24.3L115.0 24.0L122.6 23.7L130.1 23.4L137.7 23.2L145.2 23.1L152.8 23.2L160.4 23.5L167.9 24.0L175.5 24.7L183.1 25.7L190.6 27.0L198.2 28.4L205.8 30.1L213.3 32.0L220.9 34.0L228.4 36.1L236.0 38.3L236.0 44.9L228.4 43.3L220.9 41.7L213.3 40.2L205.8 38.8L198.2 37.6L190.6 36.6L183.1 35.7L175.5 35.1L167.9 34.7L160.4 34.5L152.8 34.5L145.2 34.7L137.7 34.9L130.1 35.3L122.6 35.7L115.0 36.0L107.4 36.3L99.9 36.4L92.3 36.4L84.8 36.1L77.2 35.6L69.6 34.7L62.1 33.6L54.5 32.1L46.9 30.3L39.4 28.2L31.8 25.9L24.2 23.2L16.7 20.3L9.1 17.3L1.6 14.1L-6.0 10.9Z" fill="#007a3d"/><path d="M-6.0 -8.9L95.6 18.7L-6.0 10.9Z" fill="#ce1126"/><path d="M-6.0 33.1L1.6 34.7L9.1 36.3L16.7 37.8L24.2 39.2L31.8 40.4L39.4 41.4L46.9 42.3L54.5 42.9L62.1 43.3L69.6 43.5L77.2 43.5L84.8 43.3L92.3 43.1L99.9 42.7L107.4 42.3L115.0 42.0L122.6 41.7L130.1 41.6L137.7 41.6L145.2 41.9L152.8 42.4L160.4 43.3L167.9 44.4L175.5 45.9L183.1 47.7L190.6 49.8L198.2 52.1L205.8 54.8L213.3 57.7L220.9 60.7L228.4 63.9L236.0 67.1L236.0 73.7L228.4 71.0L220.9 68.4L213.3 65.8L205.8 63.5L198.2 61.3L190.6 59.4L183.1 57.7L175.5 56.3L167.9 55.2L160.4 54.4L152.8 53.8L145.2 53.5L137.7 53.4L130.1 53.5L122.6 53.7L115.0 54.0L107.4 54.3L99.9 54.6L92.3 54.8L84.8 54.9L77.2 54.8L69.6 54.5L62.1 54.0L54.5 53.3L46.9 52.3L39.4 51.0L31.8 49.6L24.2 47.9L16.7 46.0L9.1 44.0L1.6 41.9L-6.0 39.7Z" fill="#000000"/><path d="M-6.0 39.7L1.6 41.9L9.1 44.0L16.7 46.0L24.2 47.9L31.8 49.6L39.4 51.0L46.9 52.3L54.5 53.3L62.1 54.0L69.6 54.5L77.2 54.8L84.8 54.9L92.3 54.8L99.9 54.6L107.4 54.3L115.0 54.0L122.6 53.7L130.1 53.5L137.7 53.4L145.2 53.5L152.8 53.8L160.4 54.4L167.9 55.2L175.5 56.3L183.1 57.7L190.6 59.4L198.2 61.3L205.8 63.5L213.3 65.8L220.9 68.4L228.4 71.0L236.0 73.7L236.0 80.3L228.4 78.1L220.9 76.0L213.3 74.0L205.8 72.1L198.2 70.4L190.6 69.0L183.1 67.7L175.5 66.7L167.9 66.0L160.4 65.5L152.8 65.2L145.2 65.1L137.7 65.2L130.1 65.4L122.6 65.7L115.0 66.0L107.4 66.3L99.9 66.5L92.3 66.6L84.8 66.5L77.2 66.2L69.6 65.6L62.1 64.8L54.5 63.7L46.9 62.3L39.4 60.6L31.8 58.7L24.2 56.5L16.7 54.2L9.1 51.6L1.6 49.0L-6.0 46.3Z" fill="#ffffff"/><path d="M-6.0 46.3L1.6 49.0L9.1 51.6L16.7 54.2L24.2 56.5L31.8 58.7L39.4 60.6L46.9 62.3L54.5 63.7L62.1 64.8L69.6 65.6L77.2 66.2L84.8 66.5L92.3 66.6L99.9 66.5L107.4 66.3L115.0 66.0L122.6 65.7L130.1 65.4L137.7 65.2L145.2 65.1L152.8 65.2L160.4 65.5L167.9 66.0L175.5 66.7L183.1 67.7L190.6 69.0L198.2 70.4L205.8 72.1L213.3 74.0L220.9 76.0L228.4 78.1L236.0 80.3L236.0 86.9L228.4 85.3L220.9 83.7L213.3 82.2L205.8 80.8L198.2 79.6L190.6 78.6L183.1 77.7L175.5 77.1L167.9 76.7L160.4 76.5L152.8 76.5L145.2 76.7L137.7 76.9L130.1 77.3L122.6 77.7L115.0 78.0L107.4 78.3L99.9 78.4L92.3 78.4L84.8 78.1L77.2 77.6L69.6 76.7L62.1 75.6L54.5 74.1L46.9 72.3L39.4 70.2L31.8 67.9L24.2 65.2L16.7 62.3L9.1 59.3L1.6 56.1L-6.0 52.9Z" fill="#007a3d"/><path d="M-6.0 33.1L95.6 60.7L-6.0 52.9Z" fill="#ce1126"/><path d="M-6.0 75.1L1.6 76.7L9.1 78.3L16.7 79.8L24.2 81.2L31.8 82.4L39.4 83.4L46.9 84.3L54.5 84.9L62.1 85.3L69.6 85.5L77.2 85.5L84.8 85.3L92.3 85.1L99.9 84.7L107.4 84.3L115.0 84.0L122.6 83.7L130.1 83.6L137.7 83.6L145.2 83.9L152.8 84.4L160.4 85.3L167.9 86.4L175.5 87.9L183.1 89.7L190.6 91.8L198.2 94.1L205.8 96.8L213.3 99.7L220.9 102.7L228.4 105.9L236.0 109.1L236.0 115.7L228.4 113.0L220.9 110.4L213.3 107.8L205.8 105.5L198.2 103.3L190.6 101.4L183.1 99.7L175.5 98.3L167.9 97.2L160.4 96.4L152.8 95.8L145.2 95.5L137.7 95.4L130.1 95.5L122.6 95.7L115.0 96.0L107.4 96.3L99.9 96.6L92.3 96.8L84.8 96.9L77.2 96.8L69.6 96.5L62.1 96.0L54.5 95.3L46.9 94.3L39.4 93.0L31.8 91.6L24.2 89.9L16.7 88.0L9.1 86.0L1.6 83.9L-6.0 81.7Z" fill="#000000"/><path d="M-6.0 81.7L1.6 83.9L9.1 86.0L16.7 88.0L24.2 89.9L31.8 91.6L39.4 93.0L46.9 94.3L54.5 95.3L62.1 96.0L69.6 96.5L77.2 96.8L84.8 96.9L92.3 96.8L99.9 96.6L107.4 96.3L115.0 96.0L122.6 95.7L130.1 95.5L137.7 95.4L145.2 95.5L152.8 95.8L160.4 96.4L167.9 97.2L175.5 98.3L183.1 99.7L190.6 101.4L198.2 103.3L205.8 105.5L213.3 107.8L220.9 110.4L228.4 113.0L236.0 115.7L236.0 122.3L228.4 120.1L220.9 118.0L213.3 116.0L205.8 114.1L198.2 112.4L190.6 111.0L183.1 109.7L175.5 108.7L167.9 108.0L160.4 107.5L152.8 107.2L145.2 107.1L137.7 107.2L130.1 107.4L122.6 107.7L115.0 108.0L107.4 108.3L99.9 108.5L92.3 108.6L84.8 108.5L77.2 108.2L69.6 107.6L62.1 106.8L54.5 105.7L46.9 104.3L39.4 102.6L31.8 100.7L24.2 98.5L16.7 96.2L9.1 93.6L1.6 91.0L-6.0 88.3Z" fill="#ffffff"/><path d="M-6.0 88.3L1.6 91.0L9.1 93.6L16.7 96.2L24.2 98.5L31.8 100.7L39.4 102.6L46.9 104.3L54.5 105.7L62.1 106.8L69.6 107.6L77.2 108.2L84.8 108.5L92.3 108.6L99.9 108.5L107.4 108.3L115.0 108.0L122.6 107.7L130.1 107.4L137.7 107.2L145.2 107.1L152.8 107.2L160.4 107.5L167.9 108.0L175.5 108.7L183.1 109.7L190.6 111.0L198.2 112.4L205.8 114.1L213.3 116.0L220.9 118.0L228.4 120.1L236.0 122.3L236.0 128.9L228.4 127.3L220.9 125.7L213.3 124.2L205.8 122.8L198.2 121.6L190.6 120.6L183.1 119.7L175.5 119.1L167.9 118.7L160.4 118.5L152.8 118.5L145.2 118.7L137.7 118.9L130.1 119.3L122.6 119.7L115.0 120.0L107.4 120.3L99.9 120.4L92.3 120.4L84.8 120.1L77.2 119.6L69.6 118.7L62.1 117.6L54.5 116.1L46.9 114.3L39.4 112.2L31.8 109.9L24.2 107.2L16.7 104.3L9.1 101.3L1.6 98.1L-6.0 94.9Z" fill="#007a3d"/><path d="M-6.0 75.1L95.6 102.7L-6.0 94.9Z" fill="#ce1126"/></svg>';
    box.appendChild(fl);
    var tag = el("span", "featured-tag", pick.status === "live" ? "● مباشر دلوقتي" : "⭐ ماتش اليوم");
    var league = el("p", "featured-league", compName[pick.comp] + " · " + hhmm(pick.date));
    var matchup = el("div", "matchup");
    var home = el("div", "side");
    var hl = logoImg(pick.homeLogo, "logo hero-logo"); if (hl) home.appendChild(hl);
    home.appendChild(el("span", "team-name", pick.home));
    var num = el("div", "score score-nums");
    var hasScore = !isNaN(pick.hs) && !isNaN(pick.as) && pick.status !== "upcoming";
    num.appendChild(el("span", null, hasScore ? String(pick.hs) : "–"));
    num.appendChild(el("span", "sep", ":"));
    num.appendChild(el("span", null, hasScore ? String(pick.as) : "–"));
    var away = el("div", "side away");
    var al = logoImg(pick.awayLogo, "logo hero-logo"); if (al) away.appendChild(al);
    away.appendChild(el("span", "team-name", pick.away));
    matchup.appendChild(home); matchup.appendChild(num); matchup.appendChild(away);
    var meta = el("div", "featured-meta");
    meta.appendChild(el("span", "chip" + (pick.status === "live" ? " live" : ""),
      pick.status === "live" ? "● " + ar(pick.minute || "") : pick.status === "ft" ? "انتهت" : "لسه ما بدأتش"));
    box.appendChild(tag); box.appendChild(league); box.appendChild(matchup); box.appendChild(meta);
    var mn = parseInt(String(pick.minute || "").replace(/[^0-9]/g, ""), 10);
    if (pick.status === "live" && mn > 0) {
      var pr = el("div", "fl-prog"); var fi = el("i"); fi.style.width = Math.min(100, Math.round(mn / 90 * 100)) + "%"; pr.appendChild(fi); pr.appendChild(el("b"));
      box.appendChild(pr);
    }
  }

  function sel_day() { return sel; }
  function setDay(o) { sel = o; renderStrip(); load(false); }
  function load(force) {
    var my = ++reqId;
    var st = document.getElementById("dataStatus");
    if (!force) st.textContent = "بنحمّل الماتشات…";
    Promise.all([L.loadDay(dayDate(sel), force), ensureTV()]).then(function (out) {
      if (my !== reqId) return;
      var first = paintedSel !== sel;
      paintedSel = sel;
      render(out[0], first);
    })
      .catch(function () { if (my === reqId) st.textContent = "مقدرتش أجيب الداتا. جرّب تاني."; });
  }
  var paintedSel = null, skip = 0;
  function tick() {
    if (document.hidden || sel !== 0) return;
    var box = document.getElementById("leagueBlocks");
    var hasLive = !!box && /مباشر/.test(box.textContent || "");
    if (!hasLive && (skip = (skip + 1) % 15) !== 0) return; // no live match: refresh every ~60s
    load(true);
  }
  setInterval(tick, 4000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && sel === 0) load(true); });

  /* ---------- analysis ---------- */
  function renderAnalysis() {
    var wrap = document.getElementById("analysisRail");
    wrap.innerHTML = "";
    D.analysis.forEach(function (a) {
      var card = el("article", "analysis-card");
      card.appendChild(el("span", "kicker", a.kicker));
      card.appendChild(el("h3", null, a.title));
      card.appendChild(el("p", null, a.body));
      card.appendChild(el("div", "meta", a.meta));
      wrap.appendChild(card);
    });
  }

  /* ---------- match detail ---------- */
  function renderDetail() {
    var box = document.getElementById("matchDetail");
    box.innerHTML = "";
    var f = D.featured;
    var top = el("div", "detail-teams");
    top.appendChild(el("span", "t", f.home));
    var ds = el("span", "s score-nums");
    ds.appendChild(el("span", null, ar(f.score[0])));
    ds.appendChild(el("span", "sep", ":"));
    ds.appendChild(el("span", null, ar(f.score[1])));
    top.appendChild(ds);
    top.appendChild(el("span", "t", f.away));
    box.appendChild(top);
    D.stats.forEach(function (s) {
      var total = s.home + s.away || 1;
      var stat = el("div", "stat");
      var t = el("div", "stat-top");
      t.appendChild(el("b", null, ar(s.home)));
      t.appendChild(el("span", null, s.label));
      t.appendChild(el("b", null, ar(s.away)));
      var bar = el("div", "bar");
      var h = el("i"); h.style.width = Math.round(s.home / total * 100) + "%";
      var a = el("i", "away"); a.style.width = Math.round(s.away / total * 100) + "%";
      bar.appendChild(h); bar.appendChild(a);
      stat.appendChild(t); stat.appendChild(bar);
      box.appendChild(stat);
    });
    box.appendChild(el("p", "note", "بيانات تجريبية للعرض. المشاهدة على القنوات الرسمية بس — مفيش بث ولا روابط غير مرخصة."));
  }

  /* ---------- router ---------- */
  var views = { scores: "view-scores", predict: "view-predict", highlights: "view-highlights", lockers: "view-lockers" };
  function route() {
    var key = (location.hash.replace("#/", "") || "scores");
    if (key === "analysis") key = "predict";
    if (key === "match") key = "highlights";
    if (!views[key]) key = "scores";
    Object.keys(views).forEach(function (k) {
      var v = document.getElementById(views[k]);
      if (v) v.hidden = k !== key;
    });
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === key) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }

  /* ---------- live count + install + sw ---------- */
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferredPrompt = e;
    var b = document.getElementById("installBtn");
    b.hidden = false;
    b.addEventListener("click", function () {
      b.hidden = true; deferredPrompt.prompt();
    });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      var had = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register("sw.js").catch(function () {});
      navigator.serviceWorker.addEventListener("controllerchange", function () { if (had && !window.__ksReloaded) { window.__ksReloaded = true; location.reload(); } });
    });
  }

  renderStrip(); initFilter(); load(false);

  /* سحب الأفقي بالماوس على الديسكتوب */
  (function () {
    var box = document.getElementById("leagueBlocks");
    if (!box) return;
    var down = false, x0 = 0, l0 = 0, moved = false;
    box.addEventListener("mousedown", function (e) { down = true; moved = false; x0 = e.pageX; l0 = box.scrollLeft; box.classList.add("grab"); });
    window.addEventListener("mouseup", function () { down = false; box.classList.remove("grab"); });
    window.addEventListener("mousemove", function (e) {
      if (!down) return;
      var dx = e.pageX - x0;
      if (Math.abs(dx) > 4) moved = true;
      box.scrollLeft = l0 - dx;
    });
    box.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  })();

  /* ---------- لوحة البطولة: ترتيب + هدافين (بيانات حقيقية بس) ---------- */
  var DASH = { tables: null, t: {}, s: {} };
  var dashComp = null, dashTab = "table", dashReq = 0;

  function fetchJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    });
  }
  function logoFor(name, remote) {
    var l = L.teamLogo ? L.teamLogo(name) : null;
    if (l && l !== L.UNKNOWN_LOGO) return l;
    return remote || l || L.UNKNOWN_LOGO;
  }
  function compById(id) {
    for (var i = 0; i < L.COMPS.length; i++) if (L.COMPS[i].id === id) return L.COMPS[i];
    return null;
  }
  function tablesFile() {
    if (DASH.tables) return Promise.resolve(DASH.tables);
    var bucket = Math.floor(Date.now() / 600000);
    return fetchJSON("tables.json?b=" + bucket)
      .then(function (j) { DASH.tables = j; return j; })
      .catch(function () { return null; });
  }
  function statVal(en, name) {
    var s = en.stats || [];
    for (var i = 0; i < s.length; i++) if (s[i].name === name) return s[i].value;
    return null;
  }
  function remoteLogo(tm) {
    return (tm && tm.logos && tm.logos[0] && tm.logos[0].href) || null;
  }
  function espnGroups(id) {
    if (DASH.t[id]) return DASH.t[id];
    DASH.t[id] = fetchJSON("https://site.api.espn.com/apis/v2/sports/soccer/" + id + "/standings")
      .then(function (j) {
        var out = (j.children || []).map(function (ch) {
          var st = ch.standings || {};
          var rows = (st.entries || []).map(function (en) {
            var tm = en.team || {};
            return {
              rank: statVal(en, "rank"),
              name: L.team(tm.displayName || tm.name || ""),
              logo: logoFor(tm.displayName || tm.name || "", remoteLogo(tm)),
              played: statVal(en, "gamesPlayed"),
              win: statVal(en, "wins"),
              draw: statVal(en, "ties"),
              lose: statVal(en, "losses"),
              gf: statVal(en, "pointsFor"),
              ga: statVal(en, "pointsAgainst"),
              gd: statVal(en, "pointDifferential"),
              points: statVal(en, "points")
            };
          });
          var nm = String(ch.name || "").replace(/^\d{4}(\s*-\s*\d{2,4})?\s*/, "").trim();
          var dash = nm.lastIndexOf(" - ");
          if (dash > 0) nm = nm.slice(dash + 3);
          return { name: nm, rows: rows };
        });
        out = out.filter(function (g) { return g.rows.length; });
        out.forEach(function (g) {
          g.rows.sort(function (a, b) {
            var ra = a.rank == null ? 999 : a.rank, rb = b.rank == null ? 999 : b.rank;
            if (ra !== rb) return ra - rb;
            var pa = a.points == null ? -1 : a.points, pb = b.points == null ? -1 : b.points;
            if (pa !== pb) return pb - pa;
            return (b.gd == null ? 0 : b.gd) - (a.gd == null ? 0 : a.gd);
          });
        });
        return { groups: out, season: (j.season && (j.season.displayName || j.season.year)) || "" };
      })
      .catch(function () { return { groups: [], season: "" }; });
    return DASH.t[id];
  }
  function espnScorers(id) {
    if (DASH.s[id]) return DASH.s[id];
    DASH.s[id] = fetchJSON("https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + id + "/statistics")
      .then(function (j) {
        var stats = j.stats || {};
        function pick(name) {
          for (var k in stats) if (stats[k] && stats[k].name === name) return stats[k].leaders || [];
          return [];
        }
        function map(list, n) {
          return list.slice(0, n).map(function (l) {
            var a = l.athlete || {}, tm = a.team || {};
            return {
              name: a.displayName || a.shortName || "",
              team: L.team(tm.displayName || tm.name || ""),
              logo: logoFor(tm.displayName || tm.name || "", remoteLogo(tm)),
              value: l.value
            };
          });
        }
        return { goals: map(pick("goalsLeaders"), 15), assists: map(pick("assistsLeaders"), 10) };
      })
      .catch(function () { return { goals: [], assists: [] }; });
    return DASH.s[id];
  }
  var CONFED_URL = "https://korastine-live-proxy.gn-acc.workers.dev/confed";
  function confedLive() {
    return fetchJSON(CONFED_URL).then(function (j) {
      if (!j || !j.standings || !j.standings.length) throw new Error("empty");
      return { leagues: { "caf.confed": j } };
    });
  }
  function curvaData(compId) {
    var src = compId === "caf.confed" ? confedLive().catch(function () { return tablesFile(); }) : tablesFile();
    return src.then(function (j) {
      var e = j && j.leagues && j.leagues[compId];
      if (!e) return { groups: [], goals: [], assists: [] };
      var groups = (e.standings || []).map(function (g) {
        return {
          name: g.name,
          rows: (g.rows || []).map(function (r) {
            return {
              rank: r.rank, name: L.team(r.team), logo: logoFor(r.team, r.logo),
              played: r.played, win: r.win, draw: r.draw, lose: r.lose,
              gf: r.gf, ga: r.ga, gd: r.gd, points: r.points
            };
          })
        };
      }).filter(function (g) { return g.rows.length; });
      var seasonLabel = e.source === "wikipedia"
        ? ((e.season ? e.season + " · " : "") + "المصدر: ويكيبيديا (CC BY-SA)")
        : (e.season || "");
      var goals = (e.scorers || []).map(function (s) {
        return { name: s.player, team: L.team(s.team), logo: logoFor(s.team, s.logo), photo: s.photo || null, value: s.goals, assists: s.assists };
      });
      return { groups: groups, season: seasonLabel, goals: goals, assists: [] };
    }).catch(function () { return { groups: [], season: "", goals: [], assists: [] }; });
  }
  function dashData(compId) {
    var c = compById(compId);
    if (compId === "egy" || compId === "caf.confed") return curvaData(compId);
    if (c && c.src) return Promise.resolve({ groups: [], goals: [], assists: [] });
    return Promise.all([espnGroups(compId), espnScorers(compId)]).then(function (a) {
      return { groups: a[0].groups, season: a[0].season, goals: a[1].goals, assists: a[1].assists };
    });
  }

  function dashOverlay() {
    var ov = document.getElementById("ksDash");
    if (ov) return ov;
    ov = el("div", "dash-ov");
    ov.id = "ksDash";
    ov.hidden = true;
    ov.addEventListener("click", function (e) { if (e.target === ov) closeDash(); });
    document.body.appendChild(ov);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDash(); });
    return ov;
  }
  function closeDash(fromPop) {
    var ov = document.getElementById("ksDash");
    if (ov) ov.hidden = true;
    document.body.classList.remove("dash-open");
    if (fromPop !== true && history.state && history.state.ksDash) { try { history.back(); } catch (e) {} }
  }
  window.addEventListener("popstate", function () {
    var o = document.getElementById("ksDash");
    if (o && !o.hidden) closeDash(true);
  });
  function openDash(compId) {
    if (!compById(compId)) return;
    dashComp = compId; dashTab = "table";
    var ov = dashOverlay();
    ov.hidden = false;
    document.body.classList.add("dash-open");
    if (!(history.state && history.state.ksDash)) { try { history.pushState({ ksDash: 1 }, ""); } catch (e) {} }
    renderDash();
    clearInterval(dashPoll);
    if (compId === "caf.confed") {
      var last = "";
      dashPoll = setInterval(function () {
        var o = document.getElementById("ksDash");
        if (!o || o.hidden || dashComp !== "caf.confed") { clearInterval(dashPoll); return; }
        confedLive().then(function (j) {
          var sig = JSON.stringify(j.leagues["caf.confed"].standings) + JSON.stringify(j.leagues["caf.confed"].scorers);
          if (last && sig !== last) renderDash();
          last = sig;
        }).catch(function () {});
      }, 5000);
    }
  }
  var dashPoll = null;

  function dnum(v) { return v == null ? "—" : String(Math.round(Number(v))); }
  function teamCell(r) {
    var td = el("td", "d-team");
    var i = logoImg(r.logo, "logo");
    if (i) td.appendChild(i);
    td.appendChild(el("span", null, r.name));
    return td;
  }
  function tableEl(groups) {
    var box = el("div", "dash-tables");
    var many = groups.length > 1;
    groups.forEach(function (g) {
      if (many) box.appendChild(el("div", "dash-gname", g.name));
      var t = el("table", "dash-table");
      var thead = el("thead"), tr = el("tr");
      ["#", "الفريق", "لعب", "ف", "ت", "خ", "أهداف", "نقاط"].forEach(function (h, i) {
        var th = el("th", i === 1 ? "d-team" : null, h);
        tr.appendChild(th);
      });
      thead.appendChild(tr); t.appendChild(thead);
      var tb = el("tbody");
      g.rows.forEach(function (r) {
        var row = el("tr");
        row.appendChild(el("td", "d-rank", dnum(r.rank)));
        row.appendChild(teamCell(r));
        row.appendChild(el("td", null, dnum(r.played)));
        row.appendChild(el("td", null, dnum(r.win)));
        row.appendChild(el("td", null, dnum(r.draw)));
        row.appendChild(el("td", null, dnum(r.lose)));
        row.appendChild(el("td", "d-gf", dnum(r.gf) + "-" + dnum(r.ga)));
        row.appendChild(el("td", "d-pts", dnum(r.points)));
        tb.appendChild(row);
      });
      t.appendChild(tb);
      box.appendChild(t);
    });
    return box;
  }
  function scorersEl(list, withAssists) {
    var t = el("table", "dash-table dash-scorers");
    var thead = el("thead"), tr = el("tr");
    ["#", "اللاعب", "الفريق", "أهداف"].forEach(function (h, i) {
      tr.appendChild(el("th", i === 1 ? "d-team" : null, h));
    });
    if (withAssists) tr.appendChild(el("th", null, "أسيست"));
    thead.appendChild(tr); t.appendChild(thead);
    var tb = el("tbody");
    list.forEach(function (p, i) {
      var row = el("tr");
      row.appendChild(el("td", "d-rank", String(i + 1)));
      var td = el("td", "d-team");
      var img = logoImg(p.photo || p.logo, "logo");
      if (img) td.appendChild(img);
      td.appendChild(el("span", null, p.name));
      row.appendChild(td);
      row.appendChild(el("td", "d-team", p.team));
      row.appendChild(el("td", "d-pts", dnum(p.value)));
      if (withAssists) row.appendChild(el("td", null, dnum(p.assists)));
      tb.appendChild(row);
    });
    t.appendChild(tb);
    return t;
  }
  function emptyNote(text) { return el("p", "dash-empty", text); }
  /* فرق البطولة الظاهرة في ماتشات اليوم — عشان نعرف لو جدول المصدر من موسم تاني */
  function compTeams(compId) {
    var set = {};
    if (!lastRes || !lastRes.matches) return set;
    lastRes.matches.forEach(function (m) {
      if (m.comp !== compId) return;
      if (m.home) set[m.home] = 1;
      if (m.away) set[m.away] = 1;
    });
    return set;
  }

  function renderDash() {
    var ov = dashOverlay();
    var c = compById(dashComp);
    var logo = (L.compLogo && L.compLogo(dashComp)) || L.UNKNOWN_LOGO;
    ov.innerHTML = "";
    var panel = el("div", "dash");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", c.name);

    var head = el("div", "dash-head");
    var hi = logoImg(logo, "logo dash-logo");
    if (hi) head.appendChild(hi);
    head.appendChild(el("h2", "dash-title", c.name));
    var x = el("button", "dash-x", "✕");
    x.type = "button";
    x.setAttribute("aria-label", "قفل");
    x.addEventListener("click", closeDash);
    head.appendChild(x);
    panel.appendChild(head);

    var tabs = el("div", "dash-tabs");
    [["table", "الترتيب"], ["scorers", "الهدافين"]].forEach(function (pair) {
      var b = el("button", "dash-tab" + (dashTab === pair[0] ? " on" : ""), pair[1]);
      b.type = "button";
      b.addEventListener("click", function () { dashTab = pair[0]; renderDash(); });
      tabs.appendChild(b);
    });
    panel.appendChild(tabs);

    var body = el("div", "dash-body");
    body.appendChild(el("p", "dash-load", "بنجيب الداتا…"));
    panel.appendChild(body);
    ov.appendChild(panel);

    var my = ++dashReq;
    dashData(dashComp).catch(function () { return { groups: [], goals: [], assists: [] }; }).then(function (d) {
      if (my !== dashReq) return;
      body.innerHTML = "";
      if (dashTab === "table") {
        if (d.season) body.appendChild(el("p", "dash-season", d.season));
        if (d.groups.length) {
          var fx = compTeams(dashComp), names = [], known = 0;
          d.groups.forEach(function (g) { g.rows.forEach(function (r) { names.push(r.name); if (fx[r.name]) known++; }); });
          if (Object.keys(fx).length >= 2 && names.length && known === 0) {
            body.appendChild(el("p", "dash-note", "المصدر لسه بيعرض جدول الموسم اللي فات، والأرقام دي مش بتاعة الموسم الحالي — مش هنعرضها."));
          } else {
          var played = 0;
          d.groups.forEach(function (g) { g.rows.forEach(function (r) { played += Number(r.played) || 0; }); });
          if (!played) body.appendChild(el("p", "dash-note", "الموسم لسه ما بدأش، الترتيب فاضي."));
          body.appendChild(tableEl(d.groups));
          }
        } else {
          body.appendChild(emptyNote("المصدر مش بيوفر ترتيب للبطولة دي."));
        }
      } else {
        var has = d.goals.length || d.assists.length;
        if (d.goals.length) {
          body.appendChild(el("div", "dash-gname", "هدافين البطولة"));
          body.appendChild(scorersEl(d.goals, true));
        }
        if (d.assists.length) {
          body.appendChild(el("div", "dash-gname", "أكتر أسيست"));
          body.appendChild(scorersEl(d.assists, false));
        }
        if (!has) body.appendChild(emptyNote("المصدر مش بيوفر هدافين للبطولة دي."));
      }
    });
  }

  window.addEventListener("hashchange", route); route();
})();

/* منع قايمة الضغط المطوّل والسحب على اللوجوهات، من غير ما نلمس الخانات أو الروابط */
(function () {
  function typing(t) { return t && t.closest && t.closest("input,textarea,select,[contenteditable='true']"); }
  document.addEventListener("contextmenu", function (e) { if (!typing(e.target)) e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { if (!typing(e.target)) e.preventDefault(); });
})();
