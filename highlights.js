/* مطابقة الماتش بفيديو القناة: لازم الفريقين + تاريخ منطقي + كلمة ملخص/أهداف + (لو العنوان فيه نتيجة تطابق نتيجة الماتش). غير كده مفيش لينك مباشر. */
var KSHL = (function () {
  function norm(s) {
    s = String(s || "").toLowerCase();
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    s = s.replace(/[\u064b-\u065f\u0670\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
    s = s.replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 1632); });
    s = s.replace(/&/g, " and ").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ");
    return s.trim().split(/\s+/).filter(function (w) { return w && !/^(fc|sc|cf|afc|ac|fk|sk|ca|club|club|de|the)$/.test(w); }).map(function (w) { return w.length > 3 && w.indexOf("ال") === 0 ? w.slice(2) : w; });
  }
  function skel(t) { return t.replace(/غ/g, "ج").replace(/[اويه]/g, ""); }
  function lev1(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0; while (i < a.length && i < b.length && a.charAt(i) === b.charAt(i)) i++;
    if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
    return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
  }
  function teq(x, y) {
    if (x === y) return true;
    if (/^[a-z0-9]+$/.test(x) || /^[a-z0-9]+$/.test(y)) return false;
    var a = skel(x), b = skel(y);
    return a.length >= 3 && b.length >= 3 && (a === b || (a.length >= 4 && lev1(a, b)));
  }
  function tokVariants(t) { return t.length > 3 && t.charAt(0) === "و" ? [t, t.slice(1)] : [t]; }
  /* كل أماكن ظهور alias (مصفوفة توكنز) في توكنز العنوان؛ بترجع [start,end] */
  function spans(tt, al) {
    var out = [];
    for (var i = 0; i + al.length <= tt.length; i++) {
      var ok = true;
      for (var j = 0; j < al.length; j++) {
        if (teq(tt[i + j], al[j]) || (j === 0 && tokVariants(tt[i + j])[1] && teq(tokVariants(tt[i + j])[1], al[0]))) continue;
        ok = false; break;
      }
      if (ok) out.push([i, i + al.length]);
    }
    return out;
  }
  function aliasSets(name, REV) {
    var set = {}, out = [];
    var raw = [name].concat(REV[name] || []);
    if (REV.__fwd && REV.__fwd[name]) raw.push(REV.__fwd[name], REV.__fwd[name] && (REV[REV.__fwd[name]] || []).join("|") && 0 || "");
    if (REV.__fwd && REV.__fwd[name]) (REV[REV.__fwd[name]] || []).forEach(function (x) { raw.push(x); });
    if (name === "سبورتينج لشبونة") raw.push("سبورتينج");
    var GEN = /^(manchester|united|city|real|atletico|sporting|saint|borussia|athletic|sociedad|olympique|inter|racing|dynamo|dinamo|union|young|boys|red|star|club|sport|ahly|ittihad|wahda|nasr|مانشستر|يونايتد|سيتي|ريال|اتلتيكو|سبورتينج|اهلي|اتحاد|وحده|نصر|تحت|نادي|فريق)$/;
    raw.forEach(function (r) {
      var n = norm(r); var k = n.join(" ");
      if (n.length && !set[k]) { set[k] = 1; out.push(n); }
      if (n.length > 1) n.forEach(function (w) { if (w.length >= 4 && !/^\d+$/.test(w) && !GEN.test(w) && !set[w]) { set[w] = 1; out.push([w]); } });
    });
    return out.sort(function (a, b) { return b.join(" ").length - a.join(" ").length; });
  }
  var HL = /(ملخص|اهداف|أهداف|highlights?|extended|goals)/i, SUM = /(ملخص|highlights?|extended)/i;
  var BAD = /(مباشر|بث مباشر|live|مؤتمر صحفي|press conference|preview|reaction|رد فعل|تحليل|analysis|استوديو|الاستوديو|studio|full match|كامل|قبل المباراه|توقعات|prediction|ما بعد|post.?match)/i;
  function scoreOf(t) {
    var m = /(?:^|[^0-9])(\d{1,2})\s*[-–:]\s*(\d{1,2})(?![0-9])/.exec(String(t).replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 1632); }));
    return m ? [+m[1], +m[2]] : null;
  }
  function overlap(a, b) { return a[0] < b[1] && b[0] < a[1]; }
  /* بيرجع {sum, goals} أو null */
  function find(m, items, REV) {
    var H = aliasSets(m.home, REV), A = aliasSets(m.away, REV);
    var best = { sum: null, goals: null };
    items.forEach(function (it) {
      if (it.p < m.date + 70 * 60000 || it.p > m.date + 96 * 3600000) return;
      var raw = it.t;
      if (!HL.test(raw) || BAD.test(norm(raw).join(" ") + " " + raw)) return;
      var tt = norm(raw), hs = [], as = [];
      H.forEach(function (al) { spans(tt, al).forEach(function (s) { hs.push(s); }); });
      A.forEach(function (al) { spans(tt, al).forEach(function (s) { as.push(s); }); });
      var okTeams = hs.some(function (h) { return as.some(function (a) { return !overlap(h, a); }); });
      if (!okTeams) return;
      var sc = scoreOf(raw);
      if (sc) {
        var x = [m.hs, m.as].sort().join(), y = sc.slice().sort().join();
        if (x !== y) return;
      }
      var kind = SUM.test(raw) ? "sum" : "goals";
      if (!best[kind] || (sc && !best[kind].sc) || (it.p < best[kind].p && !!sc === !!best[kind].sc)) best[kind] = { c: it.c, i: it.i, t: it.t, p: it.p, sc: !!sc };
    });
    return best;
  }
  return { find: find, norm: norm };
})();
if (typeof module !== "undefined") module.exports = KSHL;

/* الأهداف / الملخصات: الماتشات اللي خلصت + روابط بحث يوتيوب + قنوات رسمية متأكد منها. من غير ما نألف أي فيديو. */
(function () {
  var L = typeof window !== "undefined" && window.KS_LIVE;
  var root = typeof document !== "undefined" && document.getElementById("hlRoot");
  if (!L || !root) return;
  var AR = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  function ar(n) { return String(n).replace(/\d/g, function (d) { return AR[+d]; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var compName = {};
  L.COMPS.forEach(function (c) { compName[c.id] = c.name; });

  /* قنوات يوتيوب رسمية اتأكدت من صفحتها (الاسم + آخر الرفعات). غير كده مفيش رابط قناة. */
  var YT = "https://www.youtube.com/channel/";
  var CH = {
    bein: ["beIN SPORTS", "UCJUCcJUeh0Cz2xyKwkw5Q1w"], kora: ["Kora Plus", "UCoTREVo1yJwXXDY0TbTA4EQ"], on: ["ON Sport", "UCo2TvjBHS1BtyIkeGGTMe6w"],
    thm: ["رياضة ثمانية", "UCj-2hfXdYPPNcLqcBeW3y8g"], spl: ["SPL", "UCqXAWrjSgLb0EPa_icPt-pw"], pl: ["Premier League", "UCG5qGWdu8nIRZqJ_GgDwQ-w"],
    laliga: ["LALIGA", "UCTv-XvfzLX3i4IGWAm4sbmA"], ad: ["AD Sports", "UCF8Fpc7bPHC8Jrflci-mUiQ"], seriea: ["Serie A", "UCBJeMCIeLQos7wacox4hmLQ"],
    mbc: ["MBC Action", "UCNYIXeDQovRVy0TlmSta2Ow"], bl: ["Bundesliga", "UC6UL29enLNe4mqwTfAyeNuw"], l1: ["Ligue 1", "UCQsH5XtIc9hONE1BQjucM0g"],
    uefa: ["UEFA", "UCyGa1YEx9ST66rYrJTGIKOw"], caf: ["CAF TV", "UCr5K057x3mHroPHsNk9OiwA"], afc: ["The AFC Hub", "UCnj0TjaM0wyxkAWW_nz8_1g"],
    alkass: ["قنوات الكاس", "UCS_yHXNb5w5S74KQL_TK8Yw"], fifa: ["FIFA", "UCpcTrCXblq78GZrTUTLWeBw"], dubai: ["دبي الرياضية", "UCmJr9VRnC8Q1TCIrf2G8bcg"], mls: ["MLS", "UCSZbXT5TLLW_i-5W8FZpFsg"]
  };
  var CHAN = {
    egy: ["kora", "on"], egycap: ["kora", "on"], egycup: ["kora", "on"], egylc: ["kora", "on"], egysuper: ["kora", "on"],
    "ksa.1": ["thm", "spl"], "ksa.kings.cup": ["thm", "spl"],
    "eng.1": ["bein", "pl"], "esp.1": ["bein", "laliga"], "ita.1": ["ad", "seriea"], "ger.1": ["mbc", "bl"], "fra.1": ["bein", "l1"],
    "uefa.champions": ["bein", "uefa"], "uefa.europa": ["bein", "uefa"], "uefa.europa.conf": ["bein", "uefa"], "uefa.nations": ["bein", "uefa"],
    "caf.champions": ["bein", "caf"], "caf.confed": ["bein", "caf"], "afc.champions": ["bein", "alkass", "afc"],
    "fifa.worldq.caf": ["bein", "fifa"], "fifa.worldq.uefa": ["bein", "fifa"], "fifa.worldq.afc": ["bein", "fifa"], "fifa.worldq.conmebol": ["bein", "fifa"],
    "4678": ["ad", "dubai"], "usa.1": ["mls"]
  };
  var FEED = "https://korastine-live-proxy.gn-acc.workers.dev/highlights";
  var feed = { at: 0, items: [], ok: false }, REV = null;
  function loadFeed() {
    if (feed.at && Date.now() - feed.at < 300000) return Promise.resolve(feed);
    return fetch(FEED, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("feed " + r.status); return r.json(); }).then(function (j) {
      feed = { at: Date.now(), items: j.items || [], ok: true, failed: j.failed || [] };
      return feed;
    }).catch(function () { return feed; }); /* لو الفيد وقع بنكمل بآخر نسخة سليمة، ولو مفيش بنرجع لأزرار البحث */
  }
  function rev() {
    if (REV) return REV;
    REV = { __fwd: L.TEAMS || {} };
    var T = L.TEAMS || {};
    Object.keys(T).forEach(function (k) { (REV[T[k]] = REV[T[k]] || []).push(k); });
    return REV;
  }
  function search(q) { return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q); }
  function link(href, text, cls) { var a = el("a", cls || "hl-btn", text); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; return a; }
  function small(src) {
    if (!src) return null;
    var mm = /^https:\/\/a\.espncdn\.com(\/i\/(?:team|league)logos\/[^?]+?\.png)$/.exec(src);
    if (mm) src = "https://a.espncdn.com/combiner/i?img=" + mm[1] + "&w=72&h=72";
    var i = el("img", "pd-logo"); i.src = src; i.alt = ""; i.loading = "lazy"; i.decoding = "async";
    i.addEventListener("error", function () { if (i.parentNode) i.parentNode.removeChild(i); });
    return i;
  }
  function hhmm(ts) { try { return new Date(ts).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }

  var off = 0, listBox = null, loadId = 0;
  function dayDate(o) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return d; }

  /* مركز المباراة: متقفل افتراضي لحد الموافقة؛ بيتفتح بـ ?mc=1 (والرابط بيفتكر الاختيار) */
  function mcOn() { try { var q = /[?&#]mc=([01])/.exec(location.href); if (q) localStorage.setItem("ks_mc", q[1]); return localStorage.getItem("ks_mc") === "1"; } catch (e) { return false; } }
  var mcQ = null;
  function loadMC(cb) {
    if (window.KSMC) return cb();
    if (mcQ) { mcQ.push(cb); return; }
    mcQ = [cb];
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "mc.css?v=3"; document.head.appendChild(l);
    var s = document.createElement("script"); s.src = "mc.js?v=3";
    s.onload = function () { var q = mcQ; mcQ = null; q.forEach(function (f) { f(); }); };
    s.onerror = function () { mcQ = null; };
    document.head.appendChild(s);
  }
  function card(m) {
    var c = el("article", "pd-card");
    var head = el("div", "pd-head");
    head.appendChild(el("span", "pd-comp", compName[m.comp] || ""));
    head.appendChild(el("span", "pd-time", "انتهت · " + hhmm(m.date)));
    c.appendChild(head);
    var teams = el("div", "pd-teams");
    function side(name, logo, cls) { var s = el("div", "pd-side " + (cls || "")); var lg = small(logo); if (lg) s.appendChild(lg); s.appendChild(el("span", null, name)); return s; }
    teams.appendChild(side(m.home, m.homeLogo));
    teams.appendChild(el("div", "pd-mid", ar(m.hs) + " - " + ar(m.as)));
    teams.appendChild(side(m.away, m.awayLogo, "away"));
    c.appendChild(teams);
    var links = el("div", "hl-links");
    var keys = CHAN[m.comp] || [];
    var hit = { sum: null, goals: null };
    try { hit = KSHL.find(m, feed.items.filter(function (i) { return keys.indexOf(i.c) >= 0; }), rev()); } catch (e) {}
    function watch(h, label, fallback) {
      if (h && CH[h.c]) return link("https://www.youtube.com/watch?v=" + h.i, label + " · " + CH[h.c][0]);
      return link(search(fallback), label + " (بحث)", "hl-btn alt");
    }
    links.appendChild(watch(hit.sum, "▶ ملخص الماتش", "ملخص مباراة " + m.home + " " + m.away));
    links.appendChild(watch(hit.goals, "⚽ الأهداف", "أهداف " + m.home + " " + m.away));
    keys.forEach(function (k) {
      var ch = CH[k];
      links.appendChild(link("https://www.youtube.com/channel/" + ch[1] + "/search?query=" + encodeURIComponent(m.home + " " + m.away), "🔎 " + ch[0], "hl-btn alt"));
    });
    if (mcOn()) {
      function v(h) { return h && CH[h.c] ? { url: "https://www.youtube.com/watch?v=" + h.i, label: CH[h.c][0] } : null; }
      function openMC() { loadMC(function () { window.KSMC.open(m, { compName: compName[m.comp] || "", video: { sum: v(hit.sum), goals: v(hit.goals), search: search("ملخص مباراة " + m.home + " " + m.away) } }); }); }
      c.style.cursor = "pointer"; c.setAttribute("role", "button"); c.tabIndex = 0;
      c.setAttribute("aria-label", "مركز المباراة: " + m.home + " ضد " + m.away);
      c.addEventListener("click", function (ev) { if (ev.target.closest && ev.target.closest("a")) return; openMC(); });
      c.addEventListener("keydown", function (ev) { if ((ev.key === "Enter" || ev.key === " ") && ev.target === c) { ev.preventDefault(); openMC(); } });
    }
    c.appendChild(links);
    return c;
  }

  function paint(list, msg) {
    listBox.innerHTML = "";
    if (msg) { listBox.appendChild(el("p", "pd-empty", msg)); return; }
    if (!list.length) { listBox.appendChild(el("p", "pd-empty", off === 0 ? "لسه مفيش ماتشات خلصت النهارده." : "مفيش ماتشات خلصت في اليوم ده.")); return; }
    list.forEach(function (m) { listBox.appendChild(card(m)); });
  }

  function build() {
    root.innerHTML = "";
    var strip = el("div", "pd-days");
    [["إمبارح", -1], ["النهارده", 0]].forEach(function (d) {
      var b = el("button", "pd-day" + (off === d[1] ? " on" : ""), d[0]); b.type = "button";
      b.addEventListener("click", function () { off = d[1]; build(); refresh(); });
      strip.appendChild(b);
    });
    root.appendChild(strip);
    root.appendChild(el("p", "pd-rule", "الماتشات اللي خلصت بس. الأخضر بيفتح فيديو الملخص مباشرة لما القناة الرسمية تنزّله (بيتربط لوحده من تحديثات القنوات). لو لسه منزلش، الزرار بيفتح بحث يوتيوب عن الماتش. زرار كل قناة بيدوّر جواها على الماتش. القنوات الرسمية بتنزّل الملخصات بعد الماتش، ومواعيدها بتختلف من دوري للتاني."));
    listBox = el("div", "pd-list"); root.appendChild(listBox);
    paint([], "بنحمّل الماتشات…");
  }

  function refresh() {
    var my = ++loadId;
    Promise.all([L.loadDay(dayDate(off), false), loadFeed()]).then(function (rr) {
      var r = rr[0];
      if (my !== loadId) return;
      var fin = r.matches.filter(function (m) { return m.status === "ft" && !isNaN(m.hs) && !isNaN(m.as); }).sort(function (a, b) { return b.date - a.date; });
      paint(fin);
    }).catch(function () { if (my === loadId) paint([], "مقدرتش أجيب الماتشات. جرّب تاني."); });
  }
  function show() { build(); refresh(); }
  window.addEventListener("hashchange", function () { if (location.hash === "#/highlights") show(); });
  setInterval(function () { if (location.hash === "#/highlights" && !document.hidden) refresh(); }, 60000);
  if (location.hash === "#/highlights") show(); else build();
})();
