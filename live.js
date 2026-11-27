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
    Object.assign(TEAMS, {"Wadi Degla": "وادي دجلة", "ZED": "زد", "Al Ittihad Alexandria": "الاتحاد السكندري", "Al Ittihad": "الاتحاد", "Abou Qir Fertilizers": "أبو قير للأسمدة", "National Bank of Egypt": "البنك الأهلي", "Tala'ea El Gaish": "طلائع الجيش", "Al-Mokawloon al-Arab": "المقاولون العرب", "Al Mokawloon Al Arab": "المقاولون العرب", "Asyut Petroleum": "بترول أسيوط", "Ghazl El Mahalla": "غزل المحلة", "El Gouna": "الجونة", "Modern Sport": "مودرن سبورت", "El Qanah": "القناة", "Future FC": "فيوتشر", "Al Ahly Cairo": "الأهلي", "Pharco": "فاركو", "Haras El Hodoud": "حرس الحدود", "Ismaily": "الإسماعيلي", "Al Ismaily": "الإسماعيلي", "Ittihad Alexandria": "الاتحاد السكندري", "Tottenham": "توتنهام", "Nottingham Forest": "نوتنجهام فورست", "West Ham United": "وست هام", "Everton": "إيفرتون", "Brighton & Hove Albion": "برايتون", "Fulham": "فولهام", "Brentford": "برينتفورد", "Crystal Palace": "كريستال بالاس", "Wolverhampton Wanderers": "وولفرهامبتون", "Leeds United": "ليدز", "Burnley": "بيرنلي", "Bournemouth": "بورنموث", "AFC Bournemouth": "بورنموث", "Sunderland": "سندرلاند", "Sevilla": "إشبيلية", "Valencia": "فالنسيا", "Villarreal": "فياريال", "Real Sociedad": "ريال سوسيداد", "Athletic Club": "أتلتيك بيلباو", "Real Betis": "ريال بيتيس", "Girona": "جيرونا", "Celta Vigo": "سيلتا فيجو", "Roma": "روما", "AS Roma": "روما", "Lazio": "لاتسيو", "Atalanta": "أتالانتا", "Fiorentina": "فيورنتينا", "Bologna": "بولونيا", "Torino": "تورينو", "Genoa": "جنوى", "Bayer Leverkusen": "باير ليفركوزن", "RB Leipzig": "لايبزيج", "Eintracht Frankfurt": "آينتراخت فرانكفورت", "VfB Stuttgart": "شتوتجارت", "Werder Bremen": "فيردر بريمن", "Borussia Mönchengladbach": "مونشنجلادباخ", "Wolfsburg": "فولفسبورج", "Marseille": "مارسيليا", "Olympique Marseille": "مارسيليا", "Lyon": "ليون", "Olympique Lyonnais": "ليون", "Monaco": "موناكو", "AS Monaco": "موناكو", "Lille": "ليل", "Nice": "نيس", "Lens": "لانس", "Brest": "بريست", "Benfica": "بنفيكا", "Porto": "بورتو", "FC Porto": "بورتو", "Sporting CP": "سبورتينج لشبونة", "Ajax": "أياكس", "PSV Eindhoven": "آيندهوفن", "Galatasaray": "جالطة سراي", "Fenerbahce": "فنربخشة", "Celtic": "سلتيك", "Club Brugge": "كلوب بروج", "Mamelodi Sundowns": "صنداونز", "Wydad AC": "الوداد", "Wydad Casablanca": "الوداد", "Raja Casablanca": "الرجاء", "Raja CA": "الرجاء", "Esperance de Tunis": "الترجي", "ES Tunis": "الترجي", "CR Belouizdad": "شباب بلوزداد", "Al Ahli Tripoli": "الأهلي طرابلس", "Azam FC": "أزام", "Al Qadsiah": "القادسية", "Al Qadsiyah": "القادسية", "Al Ettifaq": "الاتفاق", "Al Fayha": "الفيحاء", "Al Khaleej": "الخليج", "Al Kholood": "الخلود", "Neom SC": "نيوم", "Al Taawoun": "التعاون", "Al Shabab": "الشباب", "Al Fateh": "الفتح", "Damac": "ضمك", "Al Raed": "الرائد", "Al Riyadh": "الرياض", "Al Okhdood": "الأخدود", "Al Wehda": "الوحدة", "Al Ain": "العين", "Shabab Al Ahli": "شباب الأهلي", "Al Wahda": "الوحدة", "Al Jazira": "الجزيرة", "Al Wasl": "الوصل", "Sharjah": "الشارقة", "Al Nasr": "النصر", "Bani Yas": "بني ياس", "Khor Fakkan": "خورفكان", "Ajman": "عجمان", "Al Dhafra": "الظفرة", "Kalba": "كلباء", "Colombia U17": "كولومبيا تحت ١٧", "Serbia U17": "صربيا تحت ١٧", "Japan U17": "اليابان تحت ١٧", "Honduras U17": "هندوراس تحت ١٧", "Brazil U17": "البرازيل تحت ١٧", "Costa Rica U17": "كوستاريكا تحت ١٧", "Tanzania U17": "تنزانيا تحت ١٧", "Republic of Ireland U17": "أيرلندا تحت ١٧", "Egypt U17": "مصر تحت ١٧", "Morocco U17": "المغرب تحت ١٧", "Argentina U17": "الأرجنتين تحت ١٧", "England U17": "إنجلترا تحت ١٧", "France U17": "فرنسا تحت ١٧", "Germany U17": "ألمانيا تحت ١٧", "Spain U17": "إسبانيا تحت ١٧", "Italy U17": "إيطاليا تحت ١٧", "Portugal U17": "البرتغال تحت ١٧", "Mali U17": "مالي تحت ١٧", "Senegal U17": "السنغال تحت ١٧", "USA U17": "أمريكا تحت ١٧", "Mexico U17": "المكسيك تحت ١٧", "Saudi Arabia U17": "السعودية تحت ١٧"});
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
