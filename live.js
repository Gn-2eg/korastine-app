/* كورهسطين: بيانات حقيقية. ESPN (من غير مفتاح) + Curva للمصري + TheSportsDB للإماراتي */
window.KS_LIVE = (function () {
  var ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/";
  var TSDB = "https://www.thesportsdb.com/api/v1/json/123/";
  var COMPS = [
    { id: "uefa.champions", name: "دوري أبطال أوروبا", big: 1 },
    { id: "eng.1", name: "الدوري الإنجليزي الممتاز", big: 1 },
    { id: "egy", src: "curva", name: "الدوري المصري الممتاز", big: 1 },
    { id: "egycup", cup: 1, src: "curva", name: "كأس مصر", big: 1 },
    { id: "egycap", cup: 1, src: "curva", name: "كأس العاصمة", big: 1 },
    { id: "egylc", cup: 1, src: "curva", name: "كأس الرابطة المصرية", big: 1 },
    { id: "egysuper", cup: 1, src: "curva", name: "كأس السوبر المصري", big: 1 },
    { id: "ksa.1", name: "دوري روشن السعودي", big: 1 },
    { id: "ksa.kings.cup", cup: 1, name: "كأس خادم الحرمين الشريفين", big: 1 },
    { id: "esp.1", name: "الدوري الإسباني", big: 1 },
    { id: "ita.1", name: "الدوري الإيطالي", big: 1 },
    { id: "ger.1", name: "الدوري الألماني", big: 1 },
    { id: "fra.1", name: "الدوري الفرنسي", big: 1 },
    { id: "uefa.europa", name: "الدوري الأوروبي", big: 1 },
    { id: "uefa.europa.conf", name: "دوري المؤتمر الأوروبي", big: 1 },
    { id: "caf.champions", name: "دوري أبطال أفريقيا", big: 1 },
    { id: "caf.confed", name: "كأس الكونفدرالية الأفريقية", big: 1 },
    { id: "caf.supercup", cup: 1, src: "curva", name: "كأس السوبر الأفريقي", big: 1 },
    { id: "afc.champions", name: "دوري أبطال آسيا للنخبة" },
    { id: "fifa.world", cup: 1, name: "كأس العالم" },
    { id: "fifa.worldq.caf", name: "تصفيات كأس العالم - أفريقيا" },
    { id: "fifa.worldq.uefa", name: "تصفيات كأس العالم - أوروبا" },
    { id: "fifa.worldq.afc", name: "تصفيات كأس العالم - آسيا" },
    { id: "fifa.worldq.conmebol", name: "تصفيات كأس العالم - أمريكا الجنوبية" },
    { id: "caf.nations", cup: 1, name: "كأس الأمم الأفريقية" },
    { id: "uefa.euro", cup: 1, name: "كأس الأمم الأوروبية" },
    { id: "conmebol.america", cup: 1, name: "كوبا أمريكا" },
    { id: "afc.asian.cup", cup: 1, name: "كأس آسيا" },
    { id: "arab.cup", cup: 1, src: "curva", name: "كأس العرب" },
    { id: "uefa.nations", name: "دوري الأمم الأوروبية" },
    { id: "fifa.friendly", name: "مباريات دولية ودية" },
    { id: "eng.fa", cup: 1, name: "كأس الاتحاد الإنجليزي" },
    { id: "eng.league_cup", cup: 1, name: "كأس الرابطة الإنجليزية" },
    { id: "esp.copa_del_rey", cup: 1, name: "كأس ملك إسبانيا" },
    { id: "ita.coppa_italia", cup: 1, name: "كأس إيطاليا" },
    { id: "uae", src: "tsdb", tid: "4678", name: "الدوري الإماراتي" },
    { id: "usa.1", name: "الدوري الأمريكي" }
  ];
  var TEAMS = { "Al Ahly":"الأهلي","Zamalek":"الزمالك","Pyramids":"بيراميدز","Al Masry":"المصري","Smouha":"سموحة","ENPPI":"إنبي","Petrojet":"بتروجت","Ceramica Cleopatra":"سيراميكا كليوباترا","Real Madrid":"ريال مدريد","Barcelona":"برشلونة","Liverpool":"ليفربول","Arsenal":"آرسنال","Manchester City":"مانشستر سيتي","Manchester United":"مانشستر يونايتد","Chelsea":"تشيلسي","Tottenham Hotspur":"توتنهام","Newcastle United":"نيوكاسل","Aston Villa":"أستون فيلا","Bayern Munich":"بايرن ميونخ","Paris Saint-Germain":"باريس سان جيرمان","Juventus":"يوفنتوس","Inter Milan":"إنتر","Internazionale":"إنتر","AC Milan":"ميلان","Napoli":"نابولي","Atlético Madrid":"أتلتيكو مدريد","Borussia Dortmund":"دورتموند","Al Hilal":"الهلال","Al Nassr":"النصر","Al-Hilal":"الهلال","Al-Nassr":"النصر","Al-Ittihad":"الاتحاد","Al-Ahli":"الأهلي السعودي" };
    Object.assign(TEAMS, {"Wadi Degla": "وادي دجلة", "ZED": "زد", "Al Ittihad Alexandria": "الاتحاد السكندري", "Al Ittihad": "الاتحاد", "Abou Qir Fertilizers": "أبو قير للأسمدة", "National Bank of Egypt": "البنك الأهلي", "Tala'ea El Gaish": "طلائع الجيش", "Al-Mokawloon al-Arab": "المقاولون العرب", "Al Mokawloon Al Arab": "المقاولون العرب", "Asyut Petroleum": "بترول أسيوط", "Ghazl El Mahalla": "غزل المحلة", "El Gouna": "الجونة", "Modern Sport": "مودرن سبورت", "El Qanah": "القناة", "Future FC": "فيوتشر", "Al Ahly Cairo": "الأهلي", "Pharco": "فاركو", "Haras El Hodoud": "حرس الحدود", "Ismaily": "الإسماعيلي", "Al Ismaily": "الإسماعيلي", "Ittihad Alexandria": "الاتحاد السكندري", "Tottenham": "توتنهام", "Nottingham Forest": "نوتنجهام فورست", "West Ham United": "وست هام", "Everton": "إيفرتون", "Brighton & Hove Albion": "برايتون", "Fulham": "فولهام", "Brentford": "برينتفورد", "Crystal Palace": "كريستال بالاس", "Wolverhampton Wanderers": "وولفرهامبتون", "Leeds United": "ليدز", "Burnley": "بيرنلي", "Bournemouth": "بورنموث", "AFC Bournemouth": "بورنموث", "Sunderland": "سندرلاند", "Sevilla": "إشبيلية", "Valencia": "فالنسيا", "Villarreal": "فياريال", "Real Sociedad": "ريال سوسيداد", "Athletic Club": "أتلتيك بيلباو", "Real Betis": "ريال بيتيس", "Girona": "جيرونا", "Celta Vigo": "سيلتا فيجو", "Roma": "روما", "AS Roma": "روما", "Lazio": "لاتسيو", "Atalanta": "أتالانتا", "Fiorentina": "فيورنتينا", "Bologna": "بولونيا", "Torino": "تورينو", "Genoa": "جنوى", "Bayer Leverkusen": "باير ليفركوزن", "RB Leipzig": "لايبزيج", "Eintracht Frankfurt": "آينتراخت فرانكفورت", "VfB Stuttgart": "شتوتجارت", "Werder Bremen": "فيردر بريمن", "Borussia Mönchengladbach": "مونشنجلادباخ", "Wolfsburg": "فولفسبورج", "Marseille": "مارسيليا", "Olympique Marseille": "مارسيليا", "Lyon": "ليون", "Olympique Lyonnais": "ليون", "Monaco": "موناكو", "AS Monaco": "موناكو", "Lille": "ليل", "Nice": "نيس", "Lens": "لانس", "Brest": "بريست", "Benfica": "بنفيكا", "Porto": "بورتو", "FC Porto": "بورتو", "Sporting CP": "سبورتينج لشبونة", "Ajax": "أياكس", "PSV Eindhoven": "آيندهوفن", "Galatasaray": "جالطة سراي", "Fenerbahce": "فنربخشة", "Celtic": "سلتيك", "Club Brugge": "كلوب بروج", "Mamelodi Sundowns": "صنداونز", "Wydad AC": "الوداد", "Wydad Casablanca": "الوداد", "Raja Casablanca": "الرجاء", "Raja CA": "الرجاء", "Esperance de Tunis": "الترجي", "ES Tunis": "الترجي", "CR Belouizdad": "شباب بلوزداد", "Al Ahli Tripoli": "الأهلي طرابلس", "Azam FC": "أزام", "Al Qadsiah": "القادسية", "Al Qadsiyah": "القادسية", "Al Ettifaq": "الاتفاق", "Al Fayha": "الفيحاء", "Al Khaleej": "الخليج", "Al Kholood": "الخلود", "Neom SC": "نيوم", "Al Taawoun": "التعاون", "Al Shabab": "الشباب", "Al Fateh": "الفتح", "Damac": "ضمك", "Al Raed": "الرائد", "Al Riyadh": "الرياض", "Al Okhdood": "الأخدود", "Al Wehda": "الوحدة", "Al Ain": "العين", "Shabab Al Ahli": "شباب الأهلي", "Al Wahda": "الوحدة", "Al Jazira": "الجزيرة", "Al Wasl": "الوصل", "Sharjah": "الشارقة", "Al Nasr": "النصر", "Bani Yas": "بني ياس", "Khor Fakkan": "خورفكان", "Ajman": "عجمان", "Al Dhafra": "الظفرة", "Kalba": "كلباء", "Colombia U17": "كولومبيا تحت ١٧", "Serbia U17": "صربيا تحت ١٧", "Japan U17": "اليابان تحت ١٧", "Honduras U17": "هندوراس تحت ١٧", "Brazil U17": "البرازيل تحت ١٧", "Costa Rica U17": "كوستاريكا تحت ١٧", "Tanzania U17": "تنزانيا تحت ١٧", "Republic of Ireland U17": "أيرلندا تحت ١٧", "Egypt U17": "مصر تحت ١٧", "Morocco U17": "المغرب تحت ١٧", "Argentina U17": "الأرجنتين تحت ١٧", "England U17": "إنجلترا تحت ١٧", "France U17": "فرنسا تحت ١٧", "Germany U17": "ألمانيا تحت ١٧", "Spain U17": "إسبانيا تحت ١٧", "Italy U17": "إيطاليا تحت ١٧", "Portugal U17": "البرتغال تحت ١٧", "Mali U17": "مالي تحت ١٧", "Senegal U17": "السنغال تحت ١٧", "USA U17": "أمريكا تحت ١٧", "Mexico U17": "المكسيك تحت ١٧", "Saudi Arabia U17": "السعودية تحت ١٧"});
Object.assign(TEAMS, {"AL Masry": "المصري", "Abu Qair Semad": "أبو قير للأسمدة", "Asyut Petrol": "بترول أسيوط", "Asyut Petroleum": "بترول أسيوط", "Olympic El Qanah": "القناة", "El Qanah": "القناة", "Al Ittihad": "الاتحاد السكندري", "El Gouna FC": "الجونة", "El Geish": "طلائع الجيش", "Enppi": "إنبي", "Future FC": "فيوتشر", "Zamalek SC": "الزمالك", "Al Ahly": "الأهلي", "Al Ahly SC": "الأهلي", "Pyramids FC": "بيراميدز", "Ismaily SC": "الإسماعيلي", "El Mokawloon": "المقاولون العرب", "Haras El Hodood": "حرس الحدود", "Ittihad Alexandria": "الاتحاد السكندري", "Al Ittihad": "الاتحاد السكندري", "El Masry": "المصري", "Smouha SC": "سموحة", "Pharco FC": "فاركو", "Pharco": "فاركو", "Kahrabaa Ismailia": "كهرباء الإسماعيلية", "National Bank Of Egypt": "البنك الأهلي", "Zed FC": "زد", "ZED FC": "زد", "Modern Sport FC": "مودرن سبورت", "Modern Future": "مودرن سبورت", "Ghazl El Mehalla": "غزل المحلة", "El Entag El Harby": "الإنتاج الحربي", "Tanta": "طنطا", "Telecom Egypt": "المصرية للاتصالات", "Baladiyat Al Mahalla": "بلدية المحلة", "Bank Alahly": "البنك الأهلي"});
  var STAMP = "ks_cache_v1_";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dkey(d) { return d.getFullYear() + "" + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function team(n) { return TEAMS[n] || n; }

  /* memo: نفس الطلب ما يتكررش قبل ما الـ ttl يخلص */
  var memo = {};
  function cached(key, ttl, fn) {
    var e = memo[key];
    if (e && Date.now() - e.t < ttl) return e.p;
    e = memo[key] = { t: Date.now(), p: null };
    e.p = fn();
    e.p.catch(function () { if (memo[key] === e) delete memo[key]; });
    return e.p;
  }
  /* pool: ما نفتحش ٤٠ طلب مرة واحدة */
  function pool(items, n, fn) {
    var i = 0, out = new Array(items.length);
    function next() {
      if (i >= items.length) return Promise.resolve();
      var k = i++;
      return Promise.resolve(fn(items[k], k)).then(function (v) { out[k] = v; return next(); });
    }
    var jobs = [];
    for (var j = 0; j < Math.min(n, items.length); j++) jobs.push(next());
    return Promise.all(jobs).then(function () { return out; });
  }

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
    return cached("espn:" + comp.id + ":" + day, 30000, function () {
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
          homeLogo: (h.team && h.team.logo) || null, awayLogo: (a.team && a.team.logo) || null,
          leagueLogo: (j.leagues && j.leagues[0] && j.leagues[0].logos && j.leagues[0].logos[0] && j.leagues[0].logos[0].href) || null,
          venue: (c.venue && (c.venue.fullName || c.venue.name)) || null,
          hs: +h.score, as: +a.score, status: state,
          minute: state === "live" ? (e.status.displayClock || "") : "",
          detail: st.shortDetail || ""
        };
      });
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
          homeLogo: e.strHomeTeamBadge || null, awayLogo: e.strAwayTeamBadge || null, leagueLogo: e.strLeagueBadge || null,
          hs: hasScore ? +e.intHomeScore : NaN, as: hasScore ? +e.intAwayScore : NaN,
          status: done ? "ft" : "upcoming", minute: "", detail: "" });
      });
      try { localStorage.setItem(k, JSON.stringify({ t: now, v: out })); } catch (e) {}
      return out;
    });
  }


  function curvaComp(m) {
    if (m.leagueId === 233) return "egy";
    var n = (m.league || "") + " " + (m.country || "");
    if (m.country && m.country !== "Egypt") {
      if (/super/i.test(n)) return "caf.supercup";
      return "arab.cup";
    }
    if (/super/i.test(n)) return "egysuper";
    if (/capital/i.test(n)) return "egycap";
    if (/league\s*cup/i.test(n)) return "egylc";
    return "egycup";
  }

  function curvaAll() {
    return cached("curva", 15000, function () {
      return fetch("fixtures.json", { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      }).then(function (j) {
        var list = (j.matches || []).map(function (m) {
          var sh = m.status || "NS", state = "upcoming";
          if (/^(FT|AET|PEN)$/.test(sh)) state = "ft";
          else if (/^(PST|CANC|ABD|AWD|WO|SUSP)$/.test(sh)) state = "pp";
          else if (/^(1H|HT|2H|ET|BT|P|LIVE|INT)$/.test(sh)) state = "live";
          var hasS = m.hs !== null && m.as !== null;
          return { comp: curvaComp(m), date: m.date, home: team(m.home), away: team(m.away),
            homeLogo: m.homeLogo || null, awayLogo: m.awayLogo || null, leagueLogo: m.leagueLogo || null,
            venue: m.venue || null,
            hs: hasS ? +m.hs : NaN, as: hasS ? +m.as : NaN, status: state,
            minute: state === "live" ? (sh === "HT" ? "ا" : String(m.minute || "")) : "", detail: m.league || "" };
        });
        return { list: list, at: j.updatedAt };
      });
    });
  }
  var cache = {};
  function loadDay(date, force) {
    var day = dkey(date), hit = cache[day];
    if (hit && !force && Date.now() - hit.t < 10000) return Promise.resolve(hit.v);
    var from = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(), to = from + 86400000;
    var errors = 0;
    var jobs = COMPS.map(function (c) {
      return function () {
        var inDay = function (l) { return l.filter(function (m) { return m.date >= from && m.date < to; }); };
        var p;
        if (c.src === "curva") {
          p = curvaAll().then(function (o) { return inDay(o.list).filter(function (m) { return m.comp === c.id; }); })
            .catch(function () { return c.id === "egy" ? tsdbList(c).then(inDay) : []; });
        } else if (c.src === "tsdb") p = tsdbList(c).then(inDay);
        else p = espnDay(c, day);
        return p.catch(function () { errors++; return []; });
      };
    });
    return pool(jobs, 8, function (j) { return j(); }).then(function (parts) {
      var all = [].concat.apply([], parts).sort(function (a, b) { return a.date - b.date; });
      var v = { matches: all, errors: errors, at: Date.now() };
      if (errors < COMPS.length) cache[day] = { t: Date.now(), v: v };
      return v;
    });
  }
  return { COMPS: COMPS, loadDay: loadDay, dkey: dkey };
})();
