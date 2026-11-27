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

  function matchRow(m) {
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
    row.appendChild(home); row.appendChild(center); row.appendChild(away);
    return row;
  }

  function colCount() {
    var w = window.innerWidth || 1200;
    return w >= 1180 ? 3 : w >= 800 ? 2 : 1;
  }

  function groupEl(g) {
    var sec = el("section", "lg-group");
    sec.id = "lg-" + g.id.replace(/\W/g, "_");
    var label = el("div", "lg-label");
    var lg = null;
    for (var q = 0; q < g.list.length; q++) if (g.list[q].leagueLogo) { lg = g.list[q].leagueLogo; break; }
    var lgi = logoImg(lg, "logo lg-logo");
    if (lgi) label.appendChild(lgi);
    label.appendChild(el("span", "lg-name", compName[g.id]));
    label.appendChild(el("b", null, ar(g.n) + " ماتش"));
    sec.appendChild(label);
    g.list.forEach(function (m) { sec.appendChild(matchRow(m)); });
    return sec;
  }

  var lastRes = null, lastCols = 0;
  function render(res) {
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
    var gs = order.map(function (id) { return { id: id, list: groups[id], n: groups[id].length }; });

    /* وزّع البطولات على كذا عمود بحيث الأعمدة تطلع متساوية تقريبًا حسب عدد الماتشات */
    var cols = colCount();
    lastCols = cols;
    wrap.style.gridTemplateColumns = "repeat(" + cols + ",1fr)";
    var buckets = [];
    for (var i = 0; i < cols; i++) buckets.push({ items: [], h: 0 });
    gs.forEach(function (g) {
      var b = buckets[0];
      for (var k = 1; k < buckets.length; k++) if (buckets[k].h < b.h - 0.001) b = buckets[k];
      b.items.push(g); b.h += g.n + 1.5;
    });
    buckets.forEach(function (b) {
      if (!b.items.length) return;
      var col = el("div", "col");
      b.items.forEach(function (g) { col.appendChild(groupEl(g)); });
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
    if (!res.matches.length) {
      wrap.appendChild(el("p", "note", res.errors ? "مقدرتش أجيب الداتا دلوقتي. جرّب تاني." : "مفيش ماتشات في الدوريات دي اليوم ده."));
    }
    var msg = "آخر تحديث " + hhmm(res.at);
    if (res.errors) msg += " · " + ar(res.errors) + " مصدر ماردّش";
    st.textContent = msg;
    var live = res.matches.filter(function (m) { return m.status === "live"; }).length;
    document.getElementById("liveCount").textContent = ar(live);
    renderFeatured(res.matches);
  }

  function heroRank(m) {
    for (var i = 0; i < L.COMPS.length; i++) if (L.COMPS[i].id === m.comp) return L.COMPS[i].big ? i : 100 + i;
    return 999;
  }
  /* الماتش الرئيسي: لايف الأول (والمصري قبل غيره)، وبعدين أهم ماتش جاي، وبعدين اللي انتهى */
  function pickHero(matches) {
    var live = matches.filter(function (m) { return m.status === "live"; });
    var up = matches.filter(function (m) { return m.status === "upcoming"; });
    var ft = matches.filter(function (m) { return m.status === "ft"; });
    var byRank = function (a, b) { return heroRank(a) - heroRank(b) || a.date - b.date; };
    if (live.length) return live.slice().sort(byRank)[0];
    if (up.length) {
      var big = up.filter(function (m) { return heroRank(m) < 100; });
      return (big.length ? big : up).slice().sort(byRank)[0];
    }
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
    L.loadDay(dayDate(sel), force).then(function (res) { if (my === reqId) render(res); })
      .catch(function () { if (my === reqId) st.textContent = "مقدرتش أجيب الداتا. جرّب تاني."; });
  }
  var skip = 0;
  function tick() {
    if (document.hidden || sel !== 0) return;
    var box = document.getElementById("leagueBlocks");
    var hasLive = !!box && /مباشر/.test(box.textContent || "");
    if (!hasLive && (skip = (skip + 1) % 4) !== 0) return; // no live match: refresh every ~60s
    load(true);
  }
  setInterval(tick, 15000);
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

  renderAnalysis(); renderDetail(); renderStrip(); load(false);
  var rzT = null;
  window.addEventListener("resize", function () {
    clearTimeout(rzT);
    rzT = setTimeout(function () {
      if (lastRes && colCount() !== lastCols) render(lastRes);
    }, 200);
  });
  window.addEventListener("hashchange", route); route();
})();


