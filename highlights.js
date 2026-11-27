/* الأهداف / الملخصات: الماتشات اللي خلصت + روابط بحث يوتيوب + قنوات رسمية متأكد منها. من غير ما نألف أي فيديو. */
(function () {
  var L = window.KS_LIVE;
  var root = document.getElementById("hlRoot");
  if (!L || !root) return;
  var AR = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  function ar(n) { return String(n).replace(/\d/g, function (d) { return AR[+d]; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var compName = {};
  L.COMPS.forEach(function (c) { compName[c.id] = c.name; });

  /* قنوات يوتيوب رسمية اتأكدت من صفحتها (الاسم + آخر الرفعات). غير كده مفيش رابط قناة. */
  var YT = "https://www.youtube.com/channel/";
  var CHAN = {
    "eng.1": ["Premier League", YT + "UCG5qGWdu8nIRZqJ_GgDwQ-w/videos"],
    "esp.1": ["LALIGA", YT + "UCTv-XvfzLX3i4IGWAm4sbmA/videos"],
    "ita.1": ["Serie A", YT + "UCBJeMCIeLQos7wacox4hmLQ/videos"],
    "ger.1": ["Bundesliga", YT + "UC6UL29enLNe4mqwTfAyeNuw/videos"],
    "fra.1": ["Ligue 1", YT + "UCQsH5XtIc9hONE1BQjucM0g/videos"],
    "uefa.champions": ["UEFA", YT + "UCyGa1YEx9ST66rYrJTGIKOw/videos"],
    "uefa.europa": ["UEFA", YT + "UCyGa1YEx9ST66rYrJTGIKOw/videos"],
    "uefa.europa.conf": ["UEFA", YT + "UCyGa1YEx9ST66rYrJTGIKOw/videos"]
  };
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
    links.appendChild(link(search("ملخص مباراة " + m.home + " " + m.away), "▶ ملخص الماتش"));
    links.appendChild(link(search("أهداف " + m.home + " " + m.away), "⚽ الأهداف"));
    var ch = CHAN[m.comp];
    if (ch) links.appendChild(link(ch[1], "القناة الرسمية: " + ch[0], "hl-btn alt"));
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
    [["النهارده", 0], ["إمبارح", -1]].forEach(function (d) {
      var b = el("button", "pd-day" + (off === d[1] ? " on" : ""), d[0]); b.type = "button";
      b.addEventListener("click", function () { off = d[1]; build(); refresh(); });
      strip.appendChild(b);
    });
    root.appendChild(strip);
    root.appendChild(el("p", "pd-rule", "الماتشات اللي خلصت بس. الأزرار بتفتح يوتيوب في تاب جديد على بحث الماتش (مش فيديو محدد، لأن مفيش مصدر مجاني بيدينا رابط الملخص لكل ماتش). قنوات الدوريات الرسمية بتنزّل الملخصات بعد الماتش، ومواعيدها بتختلف من دوري للتاني."));
    listBox = el("div", "pd-list"); root.appendChild(listBox);
    paint([], "بنحمّل الماتشات…");
  }

  function refresh() {
    var my = ++loadId;
    L.loadDay(dayDate(off), false).then(function (r) {
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
