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

  /* ---------- featured ---------- */
  function renderFeatured() {
    var f = D.featured, box = document.getElementById("featured");
    box.innerHTML = "";
    var wm = el("img", "wm");
    wm.src = "assets-brand.svg"; wm.alt = "";
    box.appendChild(wm);
    var tag = el("span", "featured-tag", "⭐ مباراة اليوم");
    var league = el("p", "featured-league", f.league + " · " + f.kickoff);
    var title = el("h2", "featured-title");
    title.innerHTML = f.title;

    var matchup = el("div", "matchup");
    var home = el("div", "side");
    home.appendChild(el("span", "team-name", f.home));
    var num = el("div", "score score-nums");
    num.appendChild(el("span", null, ar(f.score[0])));
    num.appendChild(el("span", "sep", ":"));
    num.appendChild(el("span", null, ar(f.score[1])));
    var away = el("div", "side away");
    away.appendChild(el("span", "team-name", f.away));
    matchup.appendChild(home); matchup.appendChild(num); matchup.appendChild(away);

    var meta = el("div", "featured-meta");
    meta.appendChild(el("span", "chip live", "● " + f.minute));
    meta.appendChild(el("span", "chip", f.broadcaster));
    var cta = el("a", "featured-cta", "افتح تفاصيل الماتش ←");
    cta.href = "#/match";
    box.appendChild(tag); box.appendChild(league); box.appendChild(title);
    box.appendChild(matchup); box.appendChild(meta); box.appendChild(cta);
    animateNumber(num);
  }

  function animateNumber(node) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    node.animate([{ transform: "scale(.82)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }],
      { duration: 520, easing: "cubic-bezier(.2,.7,.2,1)" });
  }

  /* ---------- league rail ---------- */
  function renderRail() {
    var rail = document.getElementById("leagueRail");
    rail.innerHTML = "";
    D.leagues.forEach(function (lg) {
      var li = el("li");
      var a = el("a");
      a.href = "#/scores";
      a.appendChild(el("span", null, lg.name));
      a.appendChild(el("b", null, ar(lg.count)));
      li.appendChild(a); rail.appendChild(li);
    });
  }

  /* ---------- league blocks ---------- */
  function matchRow(m) {
    var row = el("div", "match-row" + (m.status === "live" ? " is-live" : ""));
    var home = el("div", "team");
    home.appendChild(el("span", "dot"));
    home.appendChild(el("span", null, m.home));
    var center = el("div", "center");
    if (m.status === "upcoming") {
      center.appendChild(el("span", "time", m.time));
    } else {
      var sc = el("span", "score score-nums");
      sc.appendChild(el("span", null, ar(m.score[0])));
      sc.appendChild(el("span", "sep", "-"));
      sc.appendChild(el("span", null, ar(m.score[1])));
      center.appendChild(sc);
      center.appendChild(el("span", "minute" + (m.status === "ft" ? " ft" : ""), m.status === "live" ? m.minute : "انتهت"));
    }
    var away = el("div", "team away");
    away.appendChild(el("span", "dot"));
    away.appendChild(el("span", null, m.away));
    row.appendChild(home); row.appendChild(center); row.appendChild(away);
    return row;
  }

  function renderBlocks() {
    var wrap = document.getElementById("leagueBlocks");
    wrap.innerHTML = "";
    D.leagues.forEach(function (lg) {
      var block = el("section", "league-block");
      var head = el("div", "league-head");
      var h3 = el("h3", null, lg.name);
      head.appendChild(h3);
      head.appendChild(el("span", null, ar(lg.matches.length) + " ماتش"));
      block.appendChild(head);
      lg.matches.forEach(function (m) { block.appendChild(matchRow(m)); });
      wrap.appendChild(block);
    });
  }

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
  function liveCount() {
    var n = 0;
    D.leagues.forEach(function (lg) { lg.matches.forEach(function (m) { if (m.status === "live") n++; }); });
    document.getElementById("liveCount").textContent = ar(n);
  }

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
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  renderFeatured(); renderRail(); renderBlocks(); renderAnalysis(); renderDetail(); liveCount();
  window.addEventListener("hashchange", route); route();
})();
