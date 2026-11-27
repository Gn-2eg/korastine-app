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
  Object.assign(TEAMS, {"Al Ahly FC": "الأهلي", "Al Ahli Wad Madani": "الأهلي ودمدني", "AFAD Plateau": "أفاد بلاتو", "ASKO de Kara": "أسكو كارا", "AS FAR": "الجيش الملكي", "AS Real Bamako": "ريال باماكو", "ASPAC FC": "أسباك", "Azam FC": "أزام", "Black Bulls": "بلاك بولز", "CR Belouizdad": "شباب بلوزداد", "CS Sfaxien": "الصفاقسي", "Diambars FC": "ديامبار", "Durban City FC": "ديربان سيتي", "ES Zarzis": "الترجي الجرجيسي", "Hafia FC": "هافيا", "Kaizer Chiefs FC": "كايزر تشيفز", "Kitara FC": "كيتارا", "Panthere Sportive du Nde": "بانثر دو ندي", "Primeiro de Agosto": "بريميرو دي أجوستو", "Raja Club Athletic": "الرجاء", "Rayon Sports FC": "رايون سبورتس", "Red Arrows FC": "ريد أروز", "Shooting Stars SC": "شوتنج ستارز", "Singida Black Stars FC": "سينجيدا بلاك ستارز", "USM Alger": "اتحاد الجزائر", "ZED FC": "زد"});
  var TEAMLOGO = {
 "Al Ahly FC": "logos/al-ahly-fc.png",
 "الأهلي": "logos/al-ahly-fc.png",
 "Al Ahli Wad Madani": "logos/al-ahli-wad-madani.png",
 "الأهلي ودمدني": "logos/al-ahli-wad-madani.png",
 "AFAD Plateau": "logos/afad-plateau.png",
 "أفاد بلاتو": "logos/afad-plateau.png",
 "ASKO de Kara": "logos/asko-de-kara.png",
 "أسكو كارا": "logos/asko-de-kara.png",
 "AS FAR": "logos/as-far.png",
 "الجيش الملكي": "logos/as-far.png",
 "AS Real Bamako": "logos/as-real-bamako.png",
 "ريال باماكو": "logos/as-real-bamako.png",
 "ASPAC FC": "logos/aspac-fc.png",
 "أسباك": "logos/aspac-fc.png",
 "Azam FC": "logos/azam-fc.png",
 "أزام": "logos/azam-fc.png",
 "Black Bulls": "logos/black-bulls.png",
 "بلاك بولز": "logos/black-bulls.png",
 "CR Belouizdad": "logos/cr-belouizdad.png",
 "شباب بلوزداد": "logos/cr-belouizdad.png",
 "CS Sfaxien": "logos/cs-sfaxien.png",
 "الصفاقسي": "logos/cs-sfaxien.png",
 "Diambars FC": "logos/diambars-fc.png",
 "ديامبار": "logos/diambars-fc.png",
 "Durban City FC": "logos/durban-city-fc.png",
 "ديربان سيتي": "logos/durban-city-fc.png",
 "ES Zarzis": "logos/es-zarzis.png",
 "الترجي الجرجيسي": "logos/es-zarzis.png",
 "Hafia FC": "logos/hafia-fc.png",
 "هافيا": "logos/hafia-fc.png",
 "Kaizer Chiefs FC": "logos/kaizer-chiefs-fc.png",
 "كايزر تشيفز": "logos/kaizer-chiefs-fc.png",
 "Kitara FC": "logos/kitara-fc.png",
 "كيتارا": "logos/kitara-fc.png",
 "Panthere Sportive du Nde": "logos/panthere-sportive-du-nde.png",
 "بانثر دو ندي": "logos/panthere-sportive-du-nde.png",
 "Primeiro de Agosto": "logos/primeiro-de-agosto.png",
 "بريميرو دي أجوستو": "logos/primeiro-de-agosto.png",
 "Raja Club Athletic": "logos/raja-club-athletic.png",
 "الرجاء": "logos/raja-club-athletic.png",
 "Rayon Sports FC": "logos/rayon-sports-fc.png",
 "رايون سبورتس": "logos/rayon-sports-fc.png",
 "Red Arrows FC": "logos/red-arrows-fc.png",
 "ريد أروز": "logos/red-arrows-fc.png",
 "Shooting Stars SC": "logos/shooting-stars-sc.png",
 "شوتنج ستارز": "logos/shooting-stars-sc.png",
 "Singida Black Stars FC": "logos/singida-black-stars-fc.png",
 "سينجيدا بلاك ستارز": "logos/singida-black-stars-fc.png",
 "USM Alger": "logos/usm-alger.png",
 "اتحاد الجزائر": "logos/usm-alger.png",
 "ZED FC": "logos/zed-fc.png",
 "زد": "logos/zed-fc.png"
};
  var COMPLOGO = { "caf.confed": "logos/caf-confederation-cup.png" };
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
  /* بروكسي مباشر: كورفا كل 5 ثواني عبر Cloudflare Worker (بديل: fixtures.json) */
  var PROXY = "https://korastine-live-proxy.gn-acc.workers.dev/";
  function normN(x) { return String(x || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06FF ]/g, " ").replace(/\b(fc|sc|cf|club|ac|ca|cd)\b/g, " ").replace(/\s+/g, " ").trim(); }
  function proxyLive() {
    return cached("proxy", 3000, function () {
      return fetch(PROXY, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("proxy " + r.status);
        return r.json();
      }).then(function (j) {
        var byName = {};
        (j.matches || []).forEach(function (x) {
          byName[normN(team(x.home)) + "|" + normN(team(x.away))] = x;
        });
        return { byName: byName, at: j.updatedAt, n: (j.matches || []).length };
      });
    });
  }
  function applyProxy(all) {
    return proxyLive().then(function (p) {
      all.forEach(function (m) {
        var x = p.byName[normN(m.home) + "|" + normN(m.away)];
        if (!x) return;
        if (Math.abs((x.date || 0) - (m.date || 0)) > 6 * 3600 * 1000) return;
        if (x.hs !== null && x.hs !== undefined && x.as !== null && x.as !== undefined) { m.hs = +x.hs; m.as = +x.as; }
        var sh = x.status || "NS";
        if (/^(FT|AET|PEN)$/.test(sh)) m.status = "ft";
        else if (/^(1H|HT|2H|ET|BT|P|LIVE|INT)$/.test(sh)) { m.status = "live"; m.minute = (sh === "HT") ? "ا" : String(x.minute || ""); }
        else if (/^(PST|CANC|ABD|AWD|WO|SUSP)$/.test(sh)) m.status = "pp";
      });
      return all;
    }).catch(function () { return all; });
  }
  /* لوجوهات الـ56 فريق: ملفات محلية في logos/ بخلفية شفافة */
  var LOGO56 = {
    "AFAD Plateau": "logos/caf-afad-plateau.png",
    "AS Douanes": "logos/caf-as-douanes.png",
    "AS FAR": "logos/caf-as-far.png",
    "AS Maniema Union": "logos/caf-as-maniema-union.png",
    "AS PSI": "logos/caf-as-psi.png",
    "AS Port Louis 2000": "logos/caf-as-port-louis-2000.png",
    "AS Real Bamako": "logos/caf-as-real-bamako.png",
    "AS ZAM": "logos/caf-as-zam.png",
    "ASAS Djibouti Telecom": "logos/caf-asas-djibouti-telecom.png",
    "ASKO de Kara": "logos/caf-asko-de-kara.png",
    "ASPAC FC": "logos/caf-aspac-fc.png",
    "Al Ahli Wad Madani": "logos/caf-al-ahli-wad-madani.png",
    "Al Ahly FC": "logos/caf-al-ahly-fc.png",
    "Al Ahly Tripoli": "logos/caf-al-ahly-tripoli.png",
    "Al Ghazala Wau SC": "logos/caf-al-ghazala-wau-sc.png",
    "Al Hilal Alsahil": "logos/caf-al-hilal-alsahil.png",
    "Atomic Ngome": "logos/caf-atomic-ngome.png",
    "Azam FC": "logos/caf-azam-fc.png",
    "Black Bulls": "logos/caf-black-bulls.png",
    "CO Korhogo": "logos/caf-co-korhogo.png",
    "CR Belouizdad": "logos/caf-cr-belouizdad.png",
    "CS Sfaxien": "logos/caf-cs-sfaxien.png",
    "DC Virunga": "logos/caf-dc-virunga.png",
    "Diambars FC": "logos/caf-diambars-fc.png",
    "Durban City FC": "logos/caf-durban-city-fc.png",
    "ES Zarzis": "logos/caf-es-zarzis.png",
    "East End Lions FC": "logos/caf-east-end-lions-fc.png",
    "El Kanemi Warriors": "logos/caf-el-kanemi-warriors.png",
    "FC Diarra": "logos/caf-fc-diarra.png",
    "FC Rouge": "logos/caf-fc-rouge.png",
    "Green Mamba FC": "logos/caf-green-mamba-fc.png",
    "Hafia FC": "logos/caf-hafia-fc.png",
    "Jwaneng Galaxy FC": "logos/caf-jwaneng-galaxy-fc.png",
    "KMKM SC": "logos/caf-kmkm-sc.png",
    "Kabuscorp de Palanca": "logos/caf-kabuscorp-de-palanca.png",
    "Kaizer Chiefs FC": "logos/caf-kaizer-chiefs-fc.png",
    "Kitara FC": "logos/caf-kitara-fc.png",
    "Mogadishu City Club": "logos/caf-mogadishu-city-club.png",
    "Nations FC": "logos/caf-nations-fc.png",
    "PTL Bazar Brothers": "logos/caf-ptl-bazar-brothers.png",
    "Panthere Sportive du Nde": "logos/caf-panthere-sportive-du-nde.png",
    "Primeiro de Agosto": "logos/caf-primeiro-de-agosto.png",
    "Raja Club Athletic": "logos/caf-raja-club-athletic.png",
    "Rayon Sports FC": "logos/caf-rayon-sports-fc.png",
    "Red Arrows FC": "logos/caf-red-arrows-fc.png",
    "Rukinzo FC": "logos/caf-rukinzo-fc.png",
    "Shooting Stars SC": "logos/caf-shooting-stars-sc.png",
    "Singida Black Stars FC": "logos/caf-singida-black-stars-fc.png",
    "The Panthers FC": "logos/caf-the-panthers-fc.png",
    "Tusker FC": "logos/caf-tusker-fc.png",
    "UDIB": "logos/caf-udib.png",
    "UNAM FC": "logos/caf-unam-fc.png",
    "USM Alger": "logos/caf-usm-alger.png",
    "Vitesse FC": "logos/caf-vitesse-fc.png",
    "Welwalo Adigrat University FC": "logos/caf-welwalo-adigrat-university-fc.png",
    "ZED FC": "logos/caf-zed-fc.png"
,
    "AC Douane": "logos/caf-as-douanes.png",
    "AS Douanes": "logos/caf-as-douanes.png",
    "ASFAR": "logos/caf-as-far.png",
    "ASPAC": "logos/caf-aspac-fc.png",
    "Al Ahli Tripoli": "logos/caf-al-ahly-tripoli.png",
    "Al Ahly Tripoli": "logos/caf-al-ahly-tripoli.png",
    "Al Ghazala Wau": "logos/caf-al-ghazala-wau-sc.png",
    "Diambars": "logos/caf-diambars-fc.png",
    "Durban City": "logos/caf-durban-city-fc.png",
    "East End Lions": "logos/caf-east-end-lions-fc.png",
    "Green Mamba": "logos/caf-green-mamba-fc.png",
    "Hafia": "logos/caf-hafia-fc.png",
    "Jwaneng Galaxy": "logos/caf-jwaneng-galaxy-fc.png",
    "KMKM": "logos/caf-kmkm-sc.png",
    "Kabuscorp": "logos/caf-kabuscorp-de-palanca.png",
    "Kaizer Chiefs": "logos/caf-kaizer-chiefs-fc.png",
    "Kanemi Warriors": "logos/caf-el-kanemi-warriors.png",
    "Kitara": "logos/caf-kitara-fc.png",
    "Mogadishu City": "logos/caf-mogadishu-city-club.png",
    "Raja CA": "logos/caf-raja-club-athletic.png",
    "Raja Casablanca": "logos/caf-raja-club-athletic.png",
    "Rukinzo": "logos/caf-rukinzo-fc.png",
    "Shooting Stars": "logos/caf-shooting-stars-sc.png",
    "The Panthers": "logos/caf-the-panthers-fc.png",
    "Tusker": "logos/caf-tusker-fc.png",
    "UNAM": "logos/caf-unam-fc.png",
    "USM Algiers": "logos/caf-usm-alger.png",
    "Vitesse": "logos/caf-vitesse-fc.png",
    "Welwalo Adigrat University": "logos/caf-welwalo-adigrat-university-fc.png",
    "ZED": "logos/caf-zed-fc.png",
    "ZED FC": "logos/caf-zed-fc.png"
  };
  LOGO56["الأهلي طرابلس"] = "logos/caf-al-ahly-tripoli.png";
  var LOGO56_AR = null;
  /* لوجو مجهول: لأي فريق مالوش لوجو، أو لوجو طلع مش مقروء على الخلفية الغامقة */
  var UNKNOWN_LOGO = "logos/unknown-club.svg";
  var BAD_LOGO = {
    "logos/caf-afad-plateau.png": 1,
    "logos/caf-as-real-bamako.png": 1,
    "logos/caf-black-bulls.png": 1,
    "logos/caf-cs-sfaxien.png": 1
  };
  /* مسارات محدّثة (الرفع على GitHub بيزوّد رقم قبل الاسم) */
  var REPATH = {
    "logos/caf-al-ahly-fc.png": "logos/9-caf-al-ahly-fc.png",
    "logos/caf-confederation-cup.png": "logos/1-caf-confederation-cup.png"
  };
  /* لوجوهات أندية أفريقيا (ملفات شعارات من ويكيبيديا) — بديل قبل الـ placeholder */
  var CAF_REMOTE = {
    "AS Maniema Union": "https://thumb.wikimedia.org/wikipedia/en/thumb/1/1c/AS_Maniema_Union_logo.png/250px-AS_Maniema_Union_logo.png",
    "Al Ahly": "https://thumb.wikimedia.org/wikipedia/en/thumb/7/70/Al_Ahly_SC_logo.svg/250px-Al_Ahly_SC_logo.svg.png",
    "Al Hilal Omdurman": "https://upload.wikimedia.org/wikipedia/en/8/83/Al-Hilal_Club_%28Omdurman%29_logo.png",
    "Al-Masry": "https://thumb.wikimedia.org/wikipedia/en/thumb/5/54/Al_Masry_SC.png/250px-Al_Masry_SC.png",
    "Azam FC": "https://upload.wikimedia.org/wikipedia/en/4/4a/Azam_F.C._logo.png",
    "CR Belouizdad": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/CRB1.png/250px-CRB1.png",
    "Club Africain": "https://thumb.wikimedia.org/wikipedia/en/thumb/f/fe/Club_Africain_logo.svg/250px-Club_Africain_logo.svg.png",
    "Colombe Sportiv Du Dja Et Lobo": "https://upload.wikimedia.org/wikipedia/en/f/f6/Colombe_Sportive_logo.png",
    "Esperance Sportive de Tunis": "https://thumb.wikimedia.org/wikipedia/en/thumb/f/fb/Esp%C3%A9rance_Sportive_de_Tunis_logo.png/250px-Esp%C3%A9rance_Sportive_de_Tunis_logo.png",
    "FC Nouadhibou": "https://upload.wikimedia.org/wikipedia/en/f/f2/FC_Nouadhibou.png",
    "Horoya": "https://upload.wikimedia.org/wikipedia/en/2/2e/HoroyaLogo.png",
    "Kaizer Chiefs": "https://thumb.wikimedia.org/wikipedia/en/thumb/1/16/Kaizer_Chiefs_logo.svg/250px-Kaizer_Chiefs_logo.svg.png",
    "MC Alger": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Mouloudia_logo_2024.png/250px-Mouloudia_logo_2024.png",
    "Maghreb As De Fes": "https://thumb.wikimedia.org/wikipedia/en/thumb/a/aa/Maghreb_Fez_logo.png/250px-Maghreb_Fez_logo.png",
    "Olympic Safi": "https://thumb.wikimedia.org/wikipedia/en/thumb/1/14/Olympic_Club_Safi_logo.svg/250px-Olympic_Club_Safi_logo.svg.png",
    "Orlando Pirates": "https://thumb.wikimedia.org/wikipedia/en/thumb/9/95/Orlando_Pirates_FC_logo.svg/250px-Orlando_Pirates_FC_logo.svg.png",
    "Otoho d'Oyo": "https://thumb.wikimedia.org/wikipedia/en/thumb/0/0b/AS_Ot%C3%B4ho_%28logo%29.png/250px-AS_Ot%C3%B4ho_%28logo%29.png",
    "Petro de Luanda": "https://thumb.wikimedia.org/wikipedia/en/thumb/1/1d/Atletico_Petroleos_Luanda.svg/250px-Atletico_Petroleos_Luanda.svg.png",
    "Pyramids FC": "https://thumb.wikimedia.org/wikipedia/en/thumb/8/87/Pyramids_FC_%282020%29.png/250px-Pyramids_FC_%282020%29.png",
    "RSB Berkane": "https://thumb.wikimedia.org/wikipedia/en/thumb/d/de/RS_Berkane_%28logo%29.png/250px-RS_Berkane_%28logo%29.png",
    "San Pedro": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Dep_san_pedro.jpg/250px-Dep_san_pedro.jpg",
    "San Pédro": "https://thumb.wikimedia.org/wikipedia/en/thumb/a/a4/FCSANPedroLogo.png/250px-FCSANPedroLogo.png",
    "Simba SC": "https://thumb.wikimedia.org/wikipedia/en/thumb/b/bf/Simba_Sports_Club.png/250px-Simba_Sports_Club.png",
    "Singida Black Stars": "https://thumb.wikimedia.org/wikipedia/en/thumb/3/32/Singida_Black_Stars_logo.png/250px-Singida_Black_Stars_logo.png",
    "Stellenbosch": "https://thumb.wikimedia.org/wikipedia/en/thumb/f/ff/Stellenbosch_FC_logo.png/250px-Stellenbosch_FC_logo.png",
    "USM Alger": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/USMAlger4Stars.png/250px-USMAlger4Stars.png",
    "Wiliete SC": "https://upload.wikimedia.org/wikipedia/en/0/04/Wiliete_S.C._logo.png",
    "Wydad AC": "https://thumb.wikimedia.org/wikipedia/en/thumb/1/18/Wydad_AC_crest_%282022%29.svg/250px-Wydad_AC_crest_%282022%29.svg.png",
    "Young Africans": "https://thumb.wikimedia.org/wikipedia/en/thumb/d/d1/Young_Africans_SC_%28logo%29.png/250px-Young_Africans_SC_%28logo%29.png",
    "ZESCO United": "https://upload.wikimedia.org/wikipedia/en/a/a0/NewZescoUtdFClogo.png",
    "Zamalek": "https://thumb.wikimedia.org/wikipedia/en/thumb/e/ef/Zamalek_SC_logo.svg/250px-Zamalek_SC_logo.svg.png"
  };
  function normKey(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }
  var CAF_REMOTE_N = {};
  Object.keys(CAF_REMOTE).forEach(function (k) { CAF_REMOTE_N[normKey(k)] = CAF_REMOTE[k]; });
  function teamLogo(n) {
    if (!LOGO56_AR) {
      LOGO56_AR = {};
      Object.keys(LOGO56).forEach(function (k) { LOGO56_AR[team(k)] = LOGO56[k]; });
    }
    var v = LOGO56_AR[team(n)] || LOGO56[n] || TEAMLOGO[n] || TEAMLOGO[team(n)];
    if (!v) v = CAF_REMOTE[n] || CAF_REMOTE[team(n)] || CAF_REMOTE_N[normKey(n)] || null;
    if (v && REPATH[v]) v = REPATH[v];
    if (!v || BAD_LOGO[v]) return UNKNOWN_LOGO;
    return v;
  }
  function applyLogos56(all) {
    all.forEach(function (m) {
      var h = teamLogo(m.home), a = teamLogo(m.away);
      /* اللوجو المحلي بيكسب، وبعده لوجو المصدر، والـ placeholder آخر حل */
      if (h && h !== UNKNOWN_LOGO) m.homeLogo = h;
      else if (!m.homeLogo) m.homeLogo = UNKNOWN_LOGO;
      if (a && a !== UNKNOWN_LOGO) m.awayLogo = a;
      else if (!m.awayLogo) m.awayLogo = UNKNOWN_LOGO;
    });
    return all;
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
      /* لوجوهات محلية: كأس الكونفدرالية والفرق اللي جورج بعت لوجوهاتها */
      all.forEach(function (m) {
        if (COMPLOGO[m.comp]) m.leagueLogo = COMPLOGO[m.comp];
        var h = teamLogo(m.home), a = teamLogo(m.away);
        if (h && h !== UNKNOWN_LOGO) m.homeLogo = h;
        if (a && a !== UNKNOWN_LOGO) m.awayLogo = a;
      });
      return applyProxy(all).then(function () { applyLogos56(all); }).then(function () {
        var v = { matches: all, errors: errors, at: Date.now() };
        if (errors < COMPS.length) cache[day] = { t: Date.now(), v: v };
        return v;
      });
    });
  }
  return {
    COMPS: COMPS, loadDay: loadDay, dkey: dkey,
    team: team, teamLogo: teamLogo, UNKNOWN_LOGO: UNKNOWN_LOGO,
    compLogo: function (id) { var v = COMPLOGO[id]; return v ? (REPATH[v] || v) : null; }
  };
})();
