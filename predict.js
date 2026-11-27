/* التوقعات: لعبة توقع نتايج الماتشات. كل حاجة بتتخزن على جهاز المستخدم (localStorage)، من غير تسجيل دخول. */
(function () {
  var L = window.KS_LIVE;
  var root = document.getElementById("predictRoot");
  if (!L || !root) return;

  var KEY = "ks_pred_v1";
  var AR = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  function ar(n) { return String(n).replace(/\d/g, function (d) { return AR[+d]; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var S = (function () {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.preds) return s; } catch (e) {}
    return { name: "", preds: {} };
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var compName = {};
  L.COMPS.forEach(function (c) { compName[c.id] = c.name; });

  var off = 0, matches = [], status = "", editing = {}, loadId = 0, lastKey = "";
  function dayDate(o) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return d; }
  function mkey(m) { return m.comp + "|" + m.home + "|" + m.away + "|" + L.dkey(new Date(m.date)); }
  function sign(h, a) { return h > a ? "1" : h < a ? "2" : "X"; }
  function hhmm(ts) { try { return new Date(ts).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
  function small(src) {
    if (!src) return null;
    var mm = /^https:\/\/a\.espncdn\.com(\/i\/(?:team|league)logos\/[^?]+?\.png)$/.exec(src);
    if (mm) src = "https://a.espncdn.com/combiner/i?img=" + mm[1] + "&w=72&h=72";
    var i = el("img", "pd-logo"); i.src = src; i.alt = ""; i.loading = "lazy"; i.decoding = "async";
    i.addEventListener("error", function () { if (i.parentNode) i.parentNode.removeChild(i); });
    return i;
  }

  /* ---------- النقط ---------- */
  var PTS_EXACT = 3, PTS_RESULT = 1;
  function grade(p, hs, as) {
    var ok = p.o === sign(hs, as);
    var exact = p.h != null && p.h === hs && p.a === as;
    return { hs: hs, as: as, ok: ok, exact: exact, pts: exact ? PTS_EXACT : ok ? PTS_RESULT : 0 };
  }
  function settle(list) {
    var changed = false;
    list.forEach(function (m) {
      var p = S.preds[mkey(m)];
      if (!p || p.res || m.status !== "ft" || isNaN(m.hs) || isNaN(m.as)) return;
      p.res = grade(p, m.hs, m.as); changed = true;
    });
    if (changed) save();
  }
  function stats() {
    var t = { pts: 0, n: 0, done: 0, ok: 0, exact: 0 };
    Object.keys(S.preds).forEach(function (k) {
      var p = S.preds[k]; t.n++;
      if (p.res) { t.done++; t.pts += p.res.pts; if (p.res.ok) t.ok++; if (p.res.exact) t.exact++; }
    });
    return t;
  }

  /* توقعات قديمة لسه ما اتحسبتش: نجيب نتايج يومها */
  function settleOld() {
    var today = L.dkey(new Date()), days = {};
    Object.keys(S.preds).forEach(function (k) {
      var p = S.preds[k];
      if (p.res || !p.date) return;
      var dk = L.dkey(new Date(p.date));
      if (dk < today || Date.now() - p.date > 3 * 3600000) days[dk] = p.date;
    });
    Object.keys(days).slice(0, 6).forEach(function (dk) {
      if (dk === L.dkey(dayDate(off))) return;
      var d = new Date(days[dk]); d.setHours(12, 0, 0, 0);
      L.loadDay(d, false).then(function (r) { settle(r.matches); paintProfile(); }).catch(function () {});
    });
  }

  /* ---------- الشاشة ---------- */
  var profileBox, listBox, boardBox;
  function build() {
    root.innerHTML = "";
    profileBox = listBox = boardBox = null;
    if (!S.name) { buildJoin(); return; }
    profileBox = el("div", "pd-profile"); root.appendChild(profileBox);
    var strip = el("div", "pd-days");
    [["اليوم", 0], ["بكرة", 1]].forEach(function (d) {
      var b = el("button", "pd-day" + (off === d[1] ? " on" : ""), d[0]); b.type = "button";
      b.addEventListener("click", function () { off = d[1]; editing = {}; build(); refresh(false); });
      strip.appendChild(b);
    });
    root.appendChild(strip);
    root.appendChild(el("p", "pd-rule", "اختار الفائز أو اكتب النتيجة بالظبط. توقع النتيجة الصح = ١ نقطة، والنتيجة بالظبط = ٣ نقط. التوقع بيتقفل مع صافرة البداية."));
    listBox = el("div", "pd-list"); root.appendChild(listBox);
    boardBox = el("div", "pd-board"); root.appendChild(boardBox);
    paintProfile(); paintBoard(); paintList();
  }

  function buildJoin() {
    var box = el("div", "pd-join");
    box.appendChild(el("h3", null, "العب وتوقّع"));
    box.appendChild(el("p", null, "اكتب اسم مستعار (من غير تسجيل دخول) وابدأ توقع نتايج ماتشات النهاردة وبكرة. النقط بتتحسب لوحدها لما الماتش يخلص."));
    var inp = el("input", "pd-name"); inp.type = "text"; inp.maxLength = 16; inp.placeholder = "اسمك المستعار"; inp.setAttribute("aria-label", "الاسم المستعار");
    var go = el("button", "pd-btn", "ابدأ"); go.type = "button";
    function ok() { var v = inp.value.trim().replace(/\s+/g, " "); if (v.length < 2) { inp.focus(); return; } S.name = v; save(); build(); refresh(false); }
    go.addEventListener("click", ok);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") ok(); });
    box.appendChild(inp); box.appendChild(go);
    root.appendChild(box);
  }

  function paintProfile() {
    if (!profileBox) return;
    var t = stats();
    profileBox.innerHTML = "";
    var top = el("div", "pd-ptop");
    top.appendChild(el("b", "pd-pname", S.name));
    var ren = el("button", "pd-link", "غيّر الاسم"); ren.type = "button";
    ren.addEventListener("click", function () {
      var v = (window.prompt("الاسم المستعار الجديد", S.name) || "").trim().replace(/\s+/g, " ").slice(0, 16);
      if (v.length >= 2) { S.name = v; save(); paintProfile(); paintBoard(); }
    });
    top.appendChild(ren);
    profileBox.appendChild(top);
    var row = el("div", "pd-stats");
    [[ar(t.pts), "نقطة"], [ar(t.n), "توقع"], [ar(t.ok), "نتيجة صح"], [ar(t.exact), "نتيجة بالظبط"]].forEach(function (x) {
      var c = el("div", "pd-stat"); c.appendChild(el("b", null, x[0])); c.appendChild(el("span", null, x[1])); row.appendChild(c);
    });
    profileBox.appendChild(row);
  }

  function paintBoard() {
    if (!boardBox) return;
    var t = stats();
    boardBox.innerHTML = "";
    boardBox.appendChild(el("h3", null, "المتصدرين"));
    var r = el("div", "pd-lb-row me");
    r.appendChild(el("span", "pd-rank", "١"));
    r.appendChild(el("span", "pd-lb-name", S.name + " (انت)"));
    r.appendChild(el("b", null, ar(t.pts) + " نقطة"));
    boardBox.appendChild(r);
    boardBox.appendChild(el("p", "pd-note", "الترتيب ده على جهازك بس. الترتيب المشترك بين كل اللاعبين محتاج قاعدة بيانات مشتركة ولسه مش متوصلة، فمفيش لاعبين تانيين بيظهروا هنا دلوقتي."));
  }

  function pickText(p, m) {
    var o = p.h != null ? sign(p.h, p.a) : p.o;
    var s = o === "1" ? "فوز " + m.home : o === "2" ? "فوز " + m.away : "تعادل";
    if (p.h != null) s += " (" + ar(p.h) + " - " + ar(p.a) + ")";
    return s;
  }

  function card(m) {
    var k = mkey(m), p = S.preds[k];
    var open = m.status === "upcoming" && m.date > Date.now();
    var c = el("article", "pd-card" + (m.status === "live" ? " live" : ""));
    var head = el("div", "pd-head");
    head.appendChild(el("span", "pd-comp", compName[m.comp] || ""));
    head.appendChild(el("span", "pd-time", m.status === "live" ? "● مباشر" : m.status === "ft" ? "انتهت" : m.status === "pp" ? "مؤجلة" : hhmm(m.date)));
    c.appendChild(head);
    var teams = el("div", "pd-teams");
    function side(name, logo, cls) {
      var s = el("div", "pd-side " + (cls || "")); var lg = small(logo); if (lg) s.appendChild(lg); s.appendChild(el("span", null, name)); return s;
    }
    var mid = el("div", "pd-mid");
    var hasScore = !isNaN(m.hs) && !isNaN(m.as) && m.status !== "upcoming";
    mid.textContent = hasScore ? ar(m.hs) + " - " + ar(m.as) : "ضد";
    teams.appendChild(side(m.home, m.homeLogo)); teams.appendChild(mid); teams.appendChild(side(m.away, m.awayLogo, "away"));
    c.appendChild(teams);

    if (!open) {
      var foot = el("div", "pd-foot");
      if (m.status === "pp") foot.appendChild(el("span", "pd-muted", "الماتش مؤجل، مفيش توقعات."));
      else if (!p) foot.appendChild(el("span", "pd-muted", "ما توقعتش الماتش ده."));
      else {
        foot.appendChild(el("span", null, "توقعك: " + pickText(p, m)));
        if (p.res) {
          var pill = el("b", "pd-res " + (p.res.exact ? "x" : p.res.ok ? "ok" : "no"), p.res.pts ? "+" + ar(p.res.pts) + (p.res.exact ? " بالظبط" : " نتيجة صح") : "غلط");
          foot.appendChild(pill);
        } else foot.appendChild(el("span", "pd-muted", m.status === "live" ? "لسه بيتلعب" : "في انتظار النتيجة"));
      }
      c.appendChild(foot);
      return c;
    }

    if (p && !editing[k]) {
      var f2 = el("div", "pd-foot");
      f2.appendChild(el("span", null, "توقعك: " + pickText(p, m)));
      var ed = el("button", "pd-link", "عدّل"); ed.type = "button";
      ed.addEventListener("click", function () { editing[k] = true; paintList(); });
      f2.appendChild(ed); c.appendChild(f2);
      return c;
    }

    var st = { o: p ? (p.h != null ? sign(p.h, p.a) : p.o) : null, h: p && p.h != null ? p.h : "", a: p && p.a != null ? p.a : "" };
    var opts = el("div", "pd-opts"), btns = {};
    [["1", m.home], ["X", "تعادل"], ["2", m.away]].forEach(function (x) {
      var b = el("button", "pd-opt", x[0] === "X" ? x[1] : "فوز " + x[1]); b.type = "button"; btns[x[0]] = b;
      b.addEventListener("click", function () {
        st.o = x[0];
        if (st.h !== "" && st.a !== "" && sign(+st.h, +st.a) !== st.o) { st.h = ""; st.a = ""; hi.value = ""; ai.value = ""; }
        mark();
      });
      opts.appendChild(b);
    });
    c.appendChild(opts);
    var sc = el("div", "pd-score");
    sc.appendChild(el("span", "pd-muted", "أو النتيجة بالظبط:"));
    function num() { var i = el("input", "pd-num"); i.type = "number"; i.min = "0"; i.max = "20"; i.inputMode = "numeric"; return i; }
    var hi = num(), ai = num(); hi.value = st.h; ai.value = st.a;
    hi.setAttribute("aria-label", "أهداف " + m.home); ai.setAttribute("aria-label", "أهداف " + m.away);
    function onScore() {
      st.h = hi.value; st.a = ai.value;
      if (st.h !== "" && st.a !== "") st.o = sign(+st.h, +st.a);
      mark();
    }
    hi.addEventListener("input", onScore); ai.addEventListener("input", onScore);
    sc.appendChild(hi); sc.appendChild(el("span", null, "-")); sc.appendChild(ai);
    c.appendChild(sc);
    var sv = el("button", "pd-btn", "ثبّت توقعي"); sv.type = "button"; sv.disabled = true;
    function mark() {
      Object.keys(btns).forEach(function (q) { btns[q].classList.toggle("on", st.o === q); });
      sv.disabled = !st.o;
    }
    sv.addEventListener("click", function () {
      if (!st.o || m.date <= Date.now()) { paintList(); return; }
      var one = st.h !== "" && st.a !== "";
      var h = one ? Math.max(0, Math.min(20, Math.floor(+st.h))) : null, a = one ? Math.max(0, Math.min(20, Math.floor(+st.a))) : null;
      if (one && (isNaN(h) || isNaN(a))) { h = null; a = null; one = false; }
      var n = { o: one ? sign(h, a) : st.o, h: h, a: a, t: Date.now(), date: m.date, comp: m.comp, home: m.home, away: m.away };
      S.preds[k] = n; delete editing[k]; save(); paintProfile(); paintList();
    });
    mark();
    c.appendChild(sv);
    return c;
  }

  function paintList() {
    if (!listBox) return;
    var keep = window.pageYOffset;
    listBox.innerHTML = "";
    if (status) { listBox.appendChild(el("p", "pd-empty", status)); return; }
    var list = matches.filter(function (m) { return m.status !== "pp" || S.preds[mkey(m)]; });
    if (!list.length) { listBox.appendChild(el("p", "pd-empty", "مفيش ماتشات في اليوم ده.")); return; }
    list.forEach(function (m) { listBox.appendChild(card(m)); });
    window.scrollTo(0, keep);
  }

  function refresh(force) {
    var my = ++loadId;
    if (!matches.length) { status = "بنحمّل الماتشات…"; paintList(); }
    L.loadDay(dayDate(off), !!force).then(function (r) {
      if (my !== loadId) return;
      matches = r.matches.slice().sort(function (a, b) { return a.date - b.date; });
      status = "";
      settle(matches); paintProfile();
      var sig = matches.map(function (m) { return mkey(m) + m.status + m.hs + m.as; }).join(",") + Object.keys(editing).join(",");
      var ae = document.activeElement;
      if (ae && listBox && listBox.contains(ae) && ae.tagName === "INPUT") return;
      if (sig !== lastKey) { lastKey = sig; paintList(); }
    }).catch(function () { if (my === loadId) { status = "مقدرتش أجيب الماتشات. جرّب تاني."; paintList(); } });
  }

  function active() { return location.hash === "#/predict" && !document.hidden; }
  function show() { build(); matches = []; lastKey = ""; refresh(false); settleOld(); }
  window.addEventListener("hashchange", function () { if (location.hash === "#/predict") show(); });
  setInterval(function () { if (active() && S.name) refresh(true); }, 30000);
  if (location.hash === "#/predict") show(); else build();
})();
