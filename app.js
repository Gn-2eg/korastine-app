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
    var fl = el("div", "fl-wrap"); fl.innerHTML = '<svg class="fl-svg" viewBox="0 0 230 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M-8.0 10.5L0.8 7.1L9.6 5.9L18.4 5.2L27.1 4.8L35.9 4.6L44.7 4.5L53.5 4.6L62.3 4.8L71.1 5.2L79.9 5.7L88.6 6.3L97.4 7.1L106.2 8.0L115.0 9.0L123.8 10.1L132.6 11.4L141.4 12.8L150.1 14.3L158.9 15.9L167.7 17.7L176.5 19.6L185.3 21.6L194.1 23.8L202.9 26.2L211.6 28.8L220.4 31.7L229.2 35.0L238.0 40.5L238.0 46.2L229.2 43.6L220.4 41.8L211.6 40.1L202.9 38.5L194.1 37.0L185.3 35.6L176.5 34.2L167.7 32.9L158.9 31.5L150.1 30.3L141.4 29.1L132.6 27.9L123.8 26.8L115.0 25.7L106.2 24.6L97.4 23.6L88.6 22.6L79.9 21.7L71.1 20.8L62.3 20.0L53.5 19.2L44.7 18.5L35.9 17.8L27.1 17.1L18.4 16.6L9.6 16.1L0.8 15.8L-8.0 16.2Z" fill="#000000"/><path d="M-8.0 16.2L0.8 15.8L9.6 16.1L18.4 16.6L27.1 17.1L35.9 17.8L44.7 18.5L53.5 19.2L62.3 20.0L71.1 20.8L79.9 21.7L88.6 22.6L97.4 23.6L106.2 24.6L115.0 25.7L123.8 26.8L132.6 27.9L141.4 29.1L150.1 30.3L158.9 31.5L167.7 32.9L176.5 34.2L185.3 35.6L194.1 37.0L202.9 38.5L211.6 40.1L220.4 41.8L229.2 43.6L238.0 46.2L238.0 51.8L229.2 52.2L220.4 51.9L211.6 51.4L202.9 50.9L194.1 50.2L185.3 49.5L176.5 48.8L167.7 48.0L158.9 47.2L150.1 46.3L141.4 45.4L132.6 44.4L123.8 43.4L115.0 42.3L106.2 41.2L97.4 40.1L88.6 38.9L79.9 37.7L71.1 36.5L62.3 35.1L53.5 33.8L44.7 32.4L35.9 31.0L27.1 29.5L18.4 27.9L9.6 26.2L0.8 24.4L-8.0 21.8Z" fill="#ffffff"/><path d="M-8.0 21.8L0.8 24.4L9.6 26.2L18.4 27.9L27.1 29.5L35.9 31.0L44.7 32.4L53.5 33.8L62.3 35.1L71.1 36.5L79.9 37.7L88.6 38.9L97.4 40.1L106.2 41.2L115.0 42.3L123.8 43.4L132.6 44.4L141.4 45.4L150.1 46.3L158.9 47.2L167.7 48.0L176.5 48.8L185.3 49.5L194.1 50.2L202.9 50.9L211.6 51.4L220.4 51.9L229.2 52.2L238.0 51.8L238.0 57.5L229.2 60.9L220.4 62.1L211.6 62.8L202.9 63.2L194.1 63.4L185.3 63.5L176.5 63.4L167.7 63.2L158.9 62.8L150.1 62.3L141.4 61.7L132.6 60.9L123.8 60.0L115.0 59.0L106.2 57.9L97.4 56.6L88.6 55.2L79.9 53.7L71.1 52.1L62.3 50.3L53.5 48.4L44.7 46.4L35.9 44.2L27.1 41.8L18.4 39.2L9.6 36.3L0.8 33.0L-8.0 27.5Z" fill="#007a3d"/><path d="M-8.0 10.5L65.8 28.0L-8.0 27.5Z" fill="#ce1126"/><path d="M-8.0 71.5L0.8 68.1L9.6 66.9L18.4 66.2L27.1 65.8L35.9 65.6L44.7 65.5L53.5 65.6L62.3 65.8L71.1 66.2L79.9 66.7L88.6 67.3L97.4 68.1L106.2 69.0L115.0 70.0L123.8 71.1L132.6 72.4L141.4 73.8L150.1 75.3L158.9 76.9L167.7 78.7L176.5 80.6L185.3 82.6L194.1 84.8L202.9 87.2L211.6 89.8L220.4 92.7L229.2 96.0L238.0 101.5L238.0 107.2L229.2 104.6L220.4 102.8L211.6 101.1L202.9 99.5L194.1 98.0L185.3 96.6L176.5 95.2L167.7 93.9L158.9 92.5L150.1 91.3L141.4 90.1L132.6 88.9L123.8 87.8L115.0 86.7L106.2 85.6L97.4 84.6L88.6 83.6L79.9 82.7L71.1 81.8L62.3 81.0L53.5 80.2L44.7 79.5L35.9 78.8L27.1 78.1L18.4 77.6L9.6 77.1L0.8 76.8L-8.0 77.2Z" fill="#000000"/><path d="M-8.0 77.2L0.8 76.8L9.6 77.1L18.4 77.6L27.1 78.1L35.9 78.8L44.7 79.5L53.5 80.2L62.3 81.0L71.1 81.8L79.9 82.7L88.6 83.6L97.4 84.6L106.2 85.6L115.0 86.7L123.8 87.8L132.6 88.9L141.4 90.1L150.1 91.3L158.9 92.5L167.7 93.9L176.5 95.2L185.3 96.6L194.1 98.0L202.9 99.5L211.6 101.1L220.4 102.8L229.2 104.6L238.0 107.2L238.0 112.8L229.2 113.2L220.4 112.9L211.6 112.4L202.9 111.9L194.1 111.2L185.3 110.5L176.5 109.8L167.7 109.0L158.9 108.2L150.1 107.3L141.4 106.4L132.6 105.4L123.8 104.4L115.0 103.3L106.2 102.2L97.4 101.1L88.6 99.9L79.9 98.7L71.1 97.5L62.3 96.1L53.5 94.8L44.7 93.4L35.9 92.0L27.1 90.5L18.4 88.9L9.6 87.2L0.8 85.4L-8.0 82.8Z" fill="#ffffff"/><path d="M-8.0 82.8L0.8 85.4L9.6 87.2L18.4 88.9L27.1 90.5L35.9 92.0L44.7 93.4L53.5 94.8L62.3 96.1L71.1 97.5L79.9 98.7L88.6 99.9L97.4 101.1L106.2 102.2L115.0 103.3L123.8 104.4L132.6 105.4L141.4 106.4L150.1 107.3L158.9 108.2L167.7 109.0L176.5 109.8L185.3 110.5L194.1 111.2L202.9 111.9L211.6 112.4L220.4 112.9L229.2 113.2L238.0 112.8L238.0 118.5L229.2 121.9L220.4 123.1L211.6 123.8L202.9 124.2L194.1 124.4L185.3 124.5L176.5 124.4L167.7 124.2L158.9 123.8L150.1 123.3L141.4 122.7L132.6 121.9L123.8 121.0L115.0 120.0L106.2 118.9L97.4 117.6L88.6 116.2L79.9 114.7L71.1 113.1L62.3 111.3L53.5 109.4L44.7 107.4L35.9 105.2L27.1 102.8L18.4 100.2L9.6 97.3L0.8 94.0L-8.0 88.5Z" fill="#007a3d"/><path d="M-8.0 71.5L65.8 89.0L-8.0 88.5Z" fill="#ce1126"/><path d="M-8.0 132.5L0.8 129.1L9.6 127.9L18.4 127.2L27.1 126.8L35.9 126.6L44.7 126.5L53.5 126.6L62.3 126.8L71.1 127.2L79.9 127.7L88.6 128.3L97.4 129.1L106.2 130.0L115.0 131.0L123.8 132.1L132.6 133.4L141.4 134.8L150.1 136.3L158.9 137.9L167.7 139.7L176.5 141.6L185.3 143.6L194.1 145.8L202.9 148.2L211.6 150.8L220.4 153.7L229.2 157.0L238.0 162.5L238.0 168.2L229.2 165.6L220.4 163.8L211.6 162.1L202.9 160.5L194.1 159.0L185.3 157.6L176.5 156.2L167.7 154.9L158.9 153.5L150.1 152.3L141.4 151.1L132.6 149.9L123.8 148.8L115.0 147.7L106.2 146.6L97.4 145.6L88.6 144.6L79.9 143.7L71.1 142.8L62.3 142.0L53.5 141.2L44.7 140.5L35.9 139.8L27.1 139.1L18.4 138.6L9.6 138.1L0.8 137.8L-8.0 138.2Z" fill="#000000"/><path d="M-8.0 138.2L0.8 137.8L9.6 138.1L18.4 138.6L27.1 139.1L35.9 139.8L44.7 140.5L53.5 141.2L62.3 142.0L71.1 142.8L79.9 143.7L88.6 144.6L97.4 145.6L106.2 146.6L115.0 147.7L123.8 148.8L132.6 149.9L141.4 151.1L150.1 152.3L158.9 153.5L167.7 154.9L176.5 156.2L185.3 157.6L194.1 159.0L202.9 160.5L211.6 162.1L220.4 163.8L229.2 165.6L238.0 168.2L238.0 173.8L229.2 174.2L220.4 173.9L211.6 173.4L202.9 172.9L194.1 172.2L185.3 171.5L176.5 170.8L167.7 170.0L158.9 169.2L150.1 168.3L141.4 167.4L132.6 166.4L123.8 165.4L115.0 164.3L106.2 163.2L97.4 162.1L88.6 160.9L79.9 159.7L71.1 158.5L62.3 157.1L53.5 155.8L44.7 154.4L35.9 153.0L27.1 151.5L18.4 149.9L9.6 148.2L0.8 146.4L-8.0 143.8Z" fill="#ffffff"/><path d="M-8.0 143.8L0.8 146.4L9.6 148.2L18.4 149.9L27.1 151.5L35.9 153.0L44.7 154.4L53.5 155.8L62.3 157.1L71.1 158.5L79.9 159.7L88.6 160.9L97.4 162.1L106.2 163.2L115.0 164.3L123.8 165.4L132.6 166.4L141.4 167.4L150.1 168.3L158.9 169.2L167.7 170.0L176.5 170.8L185.3 171.5L194.1 172.2L202.9 172.9L211.6 173.4L220.4 173.9L229.2 174.2L238.0 173.8L238.0 179.5L229.2 182.9L220.4 184.1L211.6 184.8L202.9 185.2L194.1 185.4L185.3 185.5L176.5 185.4L167.7 185.2L158.9 184.8L150.1 184.3L141.4 183.7L132.6 182.9L123.8 182.0L115.0 181.0L106.2 179.9L97.4 178.6L88.6 177.2L79.9 175.7L71.1 174.1L62.3 172.3L53.5 170.4L44.7 168.4L35.9 166.2L27.1 163.8L18.4 161.2L9.6 158.3L0.8 155.0L-8.0 149.5Z" fill="#007a3d"/><path d="M-8.0 132.5L65.8 150.0L-8.0 149.5Z" fill="#ce1126"/></svg>';
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
