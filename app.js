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
    var fl = el("div", "fl-wrap"); fl.innerHTML = '<svg class="fl-svg" viewBox="0 0 230 120" preserveAspectRatio="none" aria-hidden="true"><path d="M-6.0 3.4L2.6 1.1L11.3 0.3L19.9 -0.1L28.6 -0.4L37.2 -0.5L45.9 -0.5L54.5 -0.4L63.1 -0.1L71.8 0.2L80.4 0.5L89.1 1.0L97.7 1.6L106.4 2.3L115.0 3.0L123.6 3.8L132.3 4.7L140.9 5.7L149.6 6.8L158.2 8.0L166.9 9.3L175.5 10.6L184.1 12.1L192.8 13.7L201.4 15.3L210.1 17.2L218.7 19.2L227.4 21.5L236.0 25.4L236.0 30.5L227.4 28.7L218.7 27.4L210.1 26.2L201.4 25.0L192.8 23.9L184.1 22.9L175.5 21.9L166.9 20.9L158.2 20.0L149.6 19.0L140.9 18.2L132.3 17.3L123.6 16.5L115.0 15.7L106.4 14.9L97.7 14.2L89.1 13.4L80.4 12.8L71.8 12.1L63.1 11.5L54.5 10.9L45.9 10.3L37.2 9.8L28.6 9.3L19.9 8.9L11.3 8.5L2.6 8.2L-6.0 8.5Z" fill="#000000"/><path d="M-6.0 8.5L2.6 8.2L11.3 8.5L19.9 8.9L28.6 9.3L37.2 9.8L45.9 10.3L54.5 10.9L63.1 11.5L71.8 12.1L80.4 12.8L89.1 13.4L97.7 14.2L106.4 14.9L115.0 15.7L123.6 16.5L132.3 17.3L140.9 18.2L149.6 19.0L158.2 20.0L166.9 20.9L175.5 21.9L184.1 22.9L192.8 23.9L201.4 25.0L210.1 26.2L218.7 27.4L227.4 28.7L236.0 30.5L236.0 35.5L227.4 35.8L218.7 35.5L210.1 35.1L201.4 34.7L192.8 34.2L184.1 33.7L175.5 33.1L166.9 32.5L158.2 31.9L149.6 31.2L140.9 30.6L132.3 29.8L123.6 29.1L115.0 28.3L106.4 27.5L97.7 26.7L89.1 25.8L80.4 25.0L71.8 24.0L63.1 23.1L54.5 22.1L45.9 21.1L37.2 20.1L28.6 19.0L19.9 17.8L11.3 16.6L2.6 15.3L-6.0 13.5Z" fill="#ffffff"/><path d="M-6.0 13.5L2.6 15.3L11.3 16.6L19.9 17.8L28.6 19.0L37.2 20.1L45.9 21.1L54.5 22.1L63.1 23.1L71.8 24.0L80.4 25.0L89.1 25.8L97.7 26.7L106.4 27.5L115.0 28.3L123.6 29.1L132.3 29.8L140.9 30.6L149.6 31.2L158.2 31.9L166.9 32.5L175.5 33.1L184.1 33.7L192.8 34.2L201.4 34.7L210.1 35.1L218.7 35.5L227.4 35.8L236.0 35.5L236.0 40.6L227.4 42.9L218.7 43.7L210.1 44.1L201.4 44.4L192.8 44.5L184.1 44.5L175.5 44.4L166.9 44.1L158.2 43.8L149.6 43.5L140.9 43.0L132.3 42.4L123.6 41.7L115.0 41.0L106.4 40.2L97.7 39.3L89.1 38.3L80.4 37.2L71.8 36.0L63.1 34.7L54.5 33.4L45.9 31.9L37.2 30.3L28.6 28.7L19.9 26.8L11.3 24.8L2.6 22.5L-6.0 18.6Z" fill="#007a3d"/><path d="M-6 3.4L66.6 17.6L-6 18.6Z" fill="#ce1126"/><path d="M-6.0 41.4L2.6 39.1L11.3 38.3L19.9 37.9L28.6 37.6L37.2 37.5L45.9 37.5L54.5 37.6L63.1 37.9L71.8 38.2L80.4 38.5L89.1 39.0L97.7 39.6L106.4 40.3L115.0 41.0L123.6 41.8L132.3 42.7L140.9 43.7L149.6 44.8L158.2 46.0L166.9 47.3L175.5 48.6L184.1 50.1L192.8 51.7L201.4 53.3L210.1 55.2L218.7 57.2L227.4 59.5L236.0 63.4L236.0 68.5L227.4 66.7L218.7 65.4L210.1 64.2L201.4 63.0L192.8 61.9L184.1 60.9L175.5 59.9L166.9 58.9L158.2 58.0L149.6 57.0L140.9 56.2L132.3 55.3L123.6 54.5L115.0 53.7L106.4 52.9L97.7 52.2L89.1 51.4L80.4 50.8L71.8 50.1L63.1 49.5L54.5 48.9L45.9 48.3L37.2 47.8L28.6 47.3L19.9 46.9L11.3 46.5L2.6 46.2L-6.0 46.5Z" fill="#000000"/><path d="M-6.0 46.5L2.6 46.2L11.3 46.5L19.9 46.9L28.6 47.3L37.2 47.8L45.9 48.3L54.5 48.9L63.1 49.5L71.8 50.1L80.4 50.8L89.1 51.4L97.7 52.2L106.4 52.9L115.0 53.7L123.6 54.5L132.3 55.3L140.9 56.2L149.6 57.0L158.2 58.0L166.9 58.9L175.5 59.9L184.1 60.9L192.8 61.9L201.4 63.0L210.1 64.2L218.7 65.4L227.4 66.7L236.0 68.5L236.0 73.5L227.4 73.8L218.7 73.5L210.1 73.1L201.4 72.7L192.8 72.2L184.1 71.7L175.5 71.1L166.9 70.5L158.2 69.9L149.6 69.2L140.9 68.6L132.3 67.8L123.6 67.1L115.0 66.3L106.4 65.5L97.7 64.7L89.1 63.8L80.4 63.0L71.8 62.0L63.1 61.1L54.5 60.1L45.9 59.1L37.2 58.1L28.6 57.0L19.9 55.8L11.3 54.6L2.6 53.3L-6.0 51.5Z" fill="#ffffff"/><path d="M-6.0 51.5L2.6 53.3L11.3 54.6L19.9 55.8L28.6 57.0L37.2 58.1L45.9 59.1L54.5 60.1L63.1 61.1L71.8 62.0L80.4 63.0L89.1 63.8L97.7 64.7L106.4 65.5L115.0 66.3L123.6 67.1L132.3 67.8L140.9 68.6L149.6 69.2L158.2 69.9L166.9 70.5L175.5 71.1L184.1 71.7L192.8 72.2L201.4 72.7L210.1 73.1L218.7 73.5L227.4 73.8L236.0 73.5L236.0 78.6L227.4 80.9L218.7 81.7L210.1 82.1L201.4 82.4L192.8 82.5L184.1 82.5L175.5 82.4L166.9 82.1L158.2 81.8L149.6 81.5L140.9 81.0L132.3 80.4L123.6 79.7L115.0 79.0L106.4 78.2L97.7 77.3L89.1 76.3L80.4 75.2L71.8 74.0L63.1 72.7L54.5 71.4L45.9 69.9L37.2 68.3L28.6 66.7L19.9 64.8L11.3 62.8L2.6 60.5L-6.0 56.6Z" fill="#007a3d"/><path d="M-6 41.4L66.6 55.6L-6 56.6Z" fill="#ce1126"/><path d="M-6.0 79.4L2.6 77.1L11.3 76.3L19.9 75.9L28.6 75.6L37.2 75.5L45.9 75.5L54.5 75.6L63.1 75.9L71.8 76.2L80.4 76.5L89.1 77.0L97.7 77.6L106.4 78.3L115.0 79.0L123.6 79.8L132.3 80.7L140.9 81.7L149.6 82.8L158.2 84.0L166.9 85.3L175.5 86.6L184.1 88.1L192.8 89.7L201.4 91.3L210.1 93.2L218.7 95.2L227.4 97.5L236.0 101.4L236.0 106.5L227.4 104.7L218.7 103.4L210.1 102.2L201.4 101.0L192.8 99.9L184.1 98.9L175.5 97.9L166.9 96.9L158.2 96.0L149.6 95.0L140.9 94.2L132.3 93.3L123.6 92.5L115.0 91.7L106.4 90.9L97.7 90.2L89.1 89.4L80.4 88.8L71.8 88.1L63.1 87.5L54.5 86.9L45.9 86.3L37.2 85.8L28.6 85.3L19.9 84.9L11.3 84.5L2.6 84.2L-6.0 84.5Z" fill="#000000"/><path d="M-6.0 84.5L2.6 84.2L11.3 84.5L19.9 84.9L28.6 85.3L37.2 85.8L45.9 86.3L54.5 86.9L63.1 87.5L71.8 88.1L80.4 88.8L89.1 89.4L97.7 90.2L106.4 90.9L115.0 91.7L123.6 92.5L132.3 93.3L140.9 94.2L149.6 95.0L158.2 96.0L166.9 96.9L175.5 97.9L184.1 98.9L192.8 99.9L201.4 101.0L210.1 102.2L218.7 103.4L227.4 104.7L236.0 106.5L236.0 111.5L227.4 111.8L218.7 111.5L210.1 111.1L201.4 110.7L192.8 110.2L184.1 109.7L175.5 109.1L166.9 108.5L158.2 107.9L149.6 107.2L140.9 106.6L132.3 105.8L123.6 105.1L115.0 104.3L106.4 103.5L97.7 102.7L89.1 101.8L80.4 101.0L71.8 100.0L63.1 99.1L54.5 98.1L45.9 97.1L37.2 96.1L28.6 95.0L19.9 93.8L11.3 92.6L2.6 91.3L-6.0 89.5Z" fill="#ffffff"/><path d="M-6.0 89.5L2.6 91.3L11.3 92.6L19.9 93.8L28.6 95.0L37.2 96.1L45.9 97.1L54.5 98.1L63.1 99.1L71.8 100.0L80.4 101.0L89.1 101.8L97.7 102.7L106.4 103.5L115.0 104.3L123.6 105.1L132.3 105.8L140.9 106.6L149.6 107.2L158.2 107.9L166.9 108.5L175.5 109.1L184.1 109.7L192.8 110.2L201.4 110.7L210.1 111.1L218.7 111.5L227.4 111.8L236.0 111.5L236.0 116.6L227.4 118.9L218.7 119.7L210.1 120.1L201.4 120.4L192.8 120.5L184.1 120.5L175.5 120.4L166.9 120.1L158.2 119.8L149.6 119.5L140.9 119.0L132.3 118.4L123.6 117.7L115.0 117.0L106.4 116.2L97.7 115.3L89.1 114.3L80.4 113.2L71.8 112.0L63.1 110.7L54.5 109.4L45.9 107.9L37.2 106.3L28.6 104.7L19.9 102.8L11.3 100.8L2.6 98.5L-6.0 94.6Z" fill="#007a3d"/><path d="M-6 79.4L66.6 93.6L-6 94.6Z" fill="#ce1126"/></svg>';
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
