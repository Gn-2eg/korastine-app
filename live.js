/* كورهسطين: بيانات حقيقية. ESPN (من غير مفتاح) + TheSportsDB للدوري المصري والإماراتي */
window.KS_LIVE = (function () {
  var ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/";
  var TSDB = "https://www.thesportsdb.com/api/v1/json/123/";
  var COMPS = [
    { id: "egy", src: "tsdb", tid: "4829", name: "الدوري المصري" },
    { id: "egyc", src: "tsdb", tid: "5185", name: "كأس مصر" },
    { id: "eng.1", name: "الدوري الإنجليزي" },
    { id: "esp.1", name: "الدوري الإسباني" },
    { id: "ita.1", name: "الدوري الإيطالي" },
    { id: "ger.1", name: "الدوري الألماني" },
    { id: "fra.1", name: "الدوري الفرنسي" },
    { id: "uefa.champions", name: "دوري أبطال أوروبا" },
    { id: "uefa.europa", name: "الدوري الأوروبي" },
    { id: "caf.champions", name: "دوري أبطال أفريقيا" },
    { id: "caf.confed", name: "كأس الكونفدرالية الأفريقية" },
    { id: "fifa.world.u17", name: "كأس العالم تحت ١٧" },
    { id: "ksa.1", name: "الدوري السعودي" },
    { id: "ksa.kings.cup", name: "كأس خادم الحرمين" },
    { id: "uae", src: "tsdb", tid: "4678", name: "الدوري الإماراتي" },
    { id: "uaec", src: "tsdb", tid: "5198", name: "كأس الرابطة الإماراتي" },
    { id: "eng.fa", name: "كأس الاتحاد الإنجليزي" },
    { id: "eng.league_cup", name: "كأس الرابطة الإنجليزية" },
    { id: "esp.copa_del_rey", name: "كأس ملك إسبانيا" },
    { id: "ita.coppa_italia", name: "كأس إيطاليا" },
    { id: "ger.dfb_pokal", name: "كأس ألمانيا" },
    { id: "fra.coupe_de_france", name: "كأس فرنسا" },
    { id: "esp.super_cup", name: "السوبر الإسباني" },
    { id: "ita.super_cup", name: "السوبر الإيطالي" },
    { id: "ger.super_cup", name: "السوبر الألماني" },
    { id: "fra.super_cup", name: "السوبر الفرنسي" },
    { id: "eng.charity", name: "الدرع الخيرية" }
  ];
  var TEAMS = { "Al Ahly":"الأهلي","Zamalek":"الزمالك","Pyramids":"بيراميدز","Al Masry":"المصري","Smouha":"سموحة","ENPPI":"إنبي","Petrojet":"بتروجت","Ceramica Cleopatra":"سيراميكا كليوباترا","Real Madrid":"ريال مدريد","Barcelona":"برشلونة","Liverpool":"ليفربول","Arsenal":"آرسنال","Manchester City":"مانشستر سيتي","Manchester United":"مانشستر يونايتد","Chelsea":"تشيلسي","Tottenham Hotspur":"توتنهام","Newcastle United":"نيوكاسل","Aston Villa":"أستون فيلا","Bayern Munich":"بايرن ميونخ","Paris Saint-Germain":"باريس سان جيرمان","Juventus":"يوفنتوس","Inter Milan":"إنتر","Internazionale":"إنتر","AC Milan":"ميلان","Napoli":"نابولي","Atlético Madrid":"أتلتيكو مدريد","Borussia Dortmund":"دورتموند","Al Hilal":"الهلال","Al Nassr":"النصر","Al-Hilal":"الهلال","Al-Nassr":"النصر","Al-Ittihad":"الاتحاد","Al-Ahli":"الأهلي السعودي" };
  var STAMP = "ks_cache_v1_";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dkey(d) { return d.getFullYear() + "" + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function team(n) { return TEAMS[n] || n; }

  function getJSON(url, ms) {
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, ms || 9000);
    return fetch(url, { signal: ctl.signal }).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    });
  }

  function espnDay(comp, day) {
    return getJSON(ESPN + comp.id + "/scoreboard?dates=" + day).then(function (j) {
      return (j.events || []).map(function (e) {
        var c = (e.competitions || [])[0] || {};
        var cs = c.competitors || [];
        var h = cs.filter(function (x) { return x.homeAway === "home"; })[0] || cs[0] || {};
        var a = cs.filter(function (x) { return x.homeAway === "away"; })[0] || cs[1] || {};
        var st = (e.status && e.status.type) || {};
        var state = st.state === "in" ? "live" : st.state === "post" ? "ft" : "upcoming";
        if (st.name === "STATUS_POSTPONED" || st.name === "STATUS_CANCELED") state = "pp";
        return {
          comp: comp.id, date: new Date(e.date).getTime(),
          home: team(h.team && h.team.displayName), away: team(a.team && a.team.displayName),
          hs: +h.score, as: +a.score, status: state,
          minute: state === "live" ? (e.status.displayClock || "") : "",
          detail: st.shortDetail || ""
        };
      });
    });
  }

  function tsdbList(comp) {
    var k = STAMP + comp.id, now = Date.now();
    try {
      var c = JSON.parse(localStorage.getItem(k) || "null");
      if (c && now - c.t < 10 * 60000) return Promise.resolve(c.v);
    } catch (e) {}
    function one(path) {
      return getJSON(TSDB + path + ".php?id=" + comp.tid).then(function (j) { return j.events || []; }).catch(function () { return []; });
    }
    return Promise.all([one("eventspastleague"), one("eventsnextleague")]).then(function (r) {
      var seen = {}, out = [];
      r[0].concat(r[1]).forEach(function (e) {
        if (seen[e.idEvent]) return; seen[e.idEvent] = 1;
        var ts = e.strTimestamp ? Date.parse(e.strTimestamp + (/Z|\+/.test(e.strTimestamp) ? "" : "Z")) : Date.parse(e.dateEvent + "T12:00:00Z");
        var hasScore = e.intHomeScore !== null && e.intHomeScore !== "" && e.intHomeScore !== undefined;
        var done = /FT|AET|PEN/i.test(e.strStatus || "") || (hasScore && ts < Date.now() - 3 * 3600000);
        out.push({ comp: comp.id, date: ts, home: team(e.strHomeTeam), away: team(e.strAwayTeam),
          hs: hasScore ? +e.intHomeScore : NaN, as: hasScore ? +e.intAwayScore : NaN,
          status: done ? "ft" : "upcoming", minute: "", detail: "" });
      });
      try { localStorage.setItem(k, JSON.stringify({ t: now, v: out })); } catch (e) {}
      return out;
    });
  }

  var cache = {};
  function loadDay(date, force) {
    var day = dkey(date), hit = cache[day];
    if (hit && !force && Date.now() - hit.t < 40000) return Promise.resolve(hit.v);
    var from = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(), to = from + 86400000;
    var errors = 0;
    var jobs = COMPS.map(function (c) {
      var p = c.src === "tsdb"
        ? tsdbList(c).then(function (l) { return l.filter(function (m) { return m.date >= from && m.date < to; }); })
        : espnDay(c, day);
      return p.catch(function () { errors++; return []; });
    });
    return Promise.all(jobs).then(function (parts) {
      var all = [].concat.apply([], parts).sort(function (a, b) { return a.date - b.date; });
      var v = { matches: all, errors: errors, at: Date.now() };
      if (errors < COMPS.length) cache[day] = { t: Date.now(), v: v };
      return v;
    });
  }
  return { COMPS: COMPS, loadDay: loadDay, dkey: dkey };
})();
