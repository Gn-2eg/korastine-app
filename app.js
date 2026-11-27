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
    i.src = src; i.alt = ""; i.loading = "lazy";
    i.addEventListener("error", function () { if (i.parentNode) i.parentNode.removeChild(i); });
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
    var sec = el("section", "lg-group");
    sec.id = "lg-" + g.id.replace(/\W/g, "_");
    var label = el("div", "lg-label");
    var lg = null;
    for (var q = 0; q < g.list.length; q++) if (g.list[q].leagueLogo) { lg = g.list[q].leagueLogo; break; }
    var lgi = logoImg(lg, "logo lg-logo");
    if (lgi) label.appendChild(lgi);
    label.appendChild(el("span", "lg-name", compName[g.id] + (g.more ? " (تكملة)" : "")));
    label.appendChild(el("b", null, ar(g.n) + " ماتش"));
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

  function initFilter() {
    var sel = document.getElementById("compFilter");
    if (!sel) return;
    sel.addEventListener("change", function () {
      filterComp = sel.value;
      if (lastRes) render(lastRes, false);
    });
  }
  function render(res, animate) {
    lastRes = res;
    var wrap = document.getElementById("leagueBlocks"), rail = document.getElementById("leagueRail");
    wrap.innerHTML = ""; rail.innerHTML = "";
    var groups = {}, order = [];
    res.matches.forEach(function (m) {
      if (!groups[m.comp]) { groups[m.comp] = []; order.push(m.comp); }
      groups[m.comp].push(m);
    });
    var idx = {}; L.COMPS.forEach(function (c, i) { idx[c.id] = i; });
    order.sort(function (a, b) { return idx[a] - idx[b]; });
    fillFilter();
    if (filterComp && groups[filterComp]) order = [filterComp];
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
    if (filterComp && !groups[filterComp]) {
      wrap.appendChild(el("p", "note", "مفيش ماتشات في البطولة دي اليوم ده."));
    }
    if (!res.matches.length) {
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
    var wm = el("img", "wm"); wm.src = "assets-brand.svg"; wm.alt = "";
    box.appendChild(wm);
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
  }

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
  var views = { scores: "view-scores", analysis: "view-analysis", match: "view-match" };
  function route() {
    var key = (location.hash.replace("#/", "") || "scores");
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

  renderAnalysis(); renderDetail(); renderStrip(); initFilter(); load(false);

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
        return out.filter(function (g) { return g.rows.length; });
      })
      .catch(function () { return []; });
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
  function curvaData(compId) {
    return tablesFile().then(function (j) {
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
      var goals = (e.scorers || []).map(function (s) {
        return { name: s.player, team: L.team(s.team), logo: logoFor(s.team, s.logo), photo: s.photo || null, value: s.goals, assists: s.assists };
      });
      return { groups: groups, goals: goals, assists: [] };
    }).catch(function () { return { groups: [], goals: [], assists: [] }; });
  }
  function dashData(compId) {
    var c = compById(compId);
    if (compId === "egy") return curvaData("egy");
    if (c && c.src) return Promise.resolve({ groups: [], goals: [], assists: [] });
    return Promise.all([espnGroups(compId), espnScorers(compId)]).then(function (a) {
      return { groups: a[0], goals: a[1].goals, assists: a[1].assists };
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
  function closeDash() {
    var ov = document.getElementById("ksDash");
    if (ov) ov.hidden = true;
    document.body.classList.remove("dash-open");
  }
  function openDash(compId) {
    if (!compById(compId)) return;
    dashComp = compId; dashTab = "table";
    var ov = dashOverlay();
    ov.hidden = false;
    document.body.classList.add("dash-open");
    renderDash();
  }

  function dnum(v) { return v == null ? "—" : ar(v); }
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
      row.appendChild(el("td", "d-rank", ar(i + 1)));
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
        if (d.groups.length) {
          var played = 0;
          d.groups.forEach(function (g) { g.rows.forEach(function (r) { played += Number(r.played) || 0; }); });
          if (!played) body.appendChild(el("p", "dash-note", "الموسم لسه ما بدأش، الترتيب فاضي."));
          body.appendChild(tableEl(d.groups));
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

