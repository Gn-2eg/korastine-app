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
 "San Pedro": "data:image/webp;base64,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",
 "سان بيدرو": "data:image/webp;base64,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",
 "Maghreb As De Fes": "data:image/webp;base64,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",
 "المغرب الفاسي": "data:image/webp;base64,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",
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
  var COMPLOGO = { "caf.confed": "logos/1-caf-confederation-cup.png?v=36" };
  var STAMP = "ks_cache_v1_";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dkey(d) { return d.getFullYear() + "" + pad(d.getMonth() + 1) + pad(d.getDate()); }
Object.assign(TEAMS, {"Abha": "أبها", "Al Faisaly": "الفيصلي", "Al Diriyah": "الدرعية", "Diriyah Club": "الدرعية", "Al Orobah": "العروبة", "Al-Orobah": "العروبة", "Al Hazem": "الحزم", "Al Tai": "الطائي", "Al Adalah": "العدالة", "Al Najma": "النجمة", "Al Akhdoud": "الأخدود", "Al-Faisaly": "الفيصلي", "Al Ettifaq": "الاتفاق", "Al Ahli Jeddah": "الأهلي السعودي", "Al-Ahli Saudi": "الأهلي السعودي", "Al Ahli": "الأهلي السعودي", "Al Fayha": "الفيحاء", "Al Taawon": "التعاون", "Damac FC": "ضمك", "Al Riyadh": "الرياض", "Bayern Munich": "بايرن ميونخ", "FC Bayern Munich": "بايرن ميونخ", "Hamburg SV": "هامبورج", "Hamburger SV": "هامبورج", "Mainz": "ماينز", "Mainz 05": "ماينز", "Augsburg": "أوجسبورج", "FC Augsburg": "أوجسبورج", "Schalke 04": "شالكه", "Union Berlin": "يونيون برلين", "1. FC Köln": "كولن", "FC Koln": "كولن", "Köln": "كولن", "Hoffenheim": "هوفنهايم", "TSG Hoffenheim": "هوفنهايم", "Freiburg": "فرايبورج", "SC Freiburg": "فرايبورج", "Paderborn": "بادربورن", "SC Paderborn": "بادربورن", "Elversberg": "إلفرسبرج", "SV Elversberg": "إلفرسبرج", "Genoa": "جنوى", "Como": "كومو", "Monza": "مونزا", "Frosinone": "فروزينوني", "Sassuolo": "ساسوولو", "Cagliari": "كالياري", "Udinese": "أودينيزي", "Verona": "هيلاس فيرونا", "Lecce": "ليتشي", "Parma": "بارما", "Pisa": "بيزا", "Cremonese": "كريمونيزي", "Stuttgart": "شتوتجارت", "Lille OSC": "ليل", "Sporting CP": "سبورتينج لشبونة", "Sporting Lisbon": "سبورتينج لشبونة", "Shakhtar Donetsk": "شاختار دونيتسك", "Fenerbahce": "فنربخشة", "Viking FK": "فايكينج", "Sabah FK": "سباح", "Slavia Prague": "سلافيا براج", "Club Brugge": "كلوب بروج", "Omonia Nicosia": "أومونيا", "Heart of Midlothian": "هارتس", "CSKA Sofia": "سسكا صوفيا", "Trabzonspor": "طرابزون سبور", "Olympiacos": "أولمبياكوس", "Atletico Madrid": "أتلتيكو مدريد", "Atlético Madrid": "أتلتيكو مدريد"});
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
          comp: comp.id, eid: e.id, date: new Date(e.date).getTime(),
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
  /* أسماء عربي لنفس الأندية (الكروت المصرية بتيجي بالعربي) */
  Object.keys(CAF_REMOTE).slice().forEach(function (k) { var a = TEAMS[k] || TEAMS[k.replace(/ (FC|SC)$/, "")]; if (a && !CAF_REMOTE[a]) CAF_REMOTE[a] = CAF_REMOTE[k]; });
  CAF_REMOTE["الزمالك"] = CAF_REMOTE["الزمالك"] || CAF_REMOTE["Zamalek"];
  CAF_REMOTE["بيراميدز"] = CAF_REMOTE["بيراميدز"] || CAF_REMOTE["Pyramids FC"];
  /* لوجوهات أندية الدوري المصري (ملفات فيلجول) */
  CAF_REMOTE["أبو قير للأسمدة"] = "https://semedia.filgoal.com/Photos/Team/Medium/812.png";
  CAF_REMOTE["الاتحاد السكندري"] = "https://semedia.filgoal.com/Photos/Team/Medium/13.png";
  CAF_REMOTE["المصري"] = "https://semedia.filgoal.com/Photos/Team/Medium/8.png";
  CAF_REMOTE["المقاولون العرب"] = "https://semedia.filgoal.com/Photos/Team/Medium/11.png";
  CAF_REMOTE["بترول أسيوط"] = "https://semedia.filgoal.com/Photos/Team/Medium/610.png";
  CAF_REMOTE["سيراميكا كليوباترا"] = "https://semedia.filgoal.com/Photos/Team/Medium/12723.png";
  CAF_REMOTE["الجونة"] = "https://semedia.filgoal.com/Photos/Team/Medium/617.png";
  CAF_REMOTE["القناة"] = "https://semedia.filgoal.com/Photos/Team/Medium/12.png";
  CAF_REMOTE["إنبي"] = "https://semedia.filgoal.com/Photos/Team/Medium/150.png";
  CAF_REMOTE["سموحة"] = "https://semedia.filgoal.com/Photos/Team/Medium/860.png";
  CAF_REMOTE["غزل المحلة"] = "https://semedia.filgoal.com/Photos/Team/Medium/7.png";
  CAF_REMOTE["بتروجت"] = "https://semedia.filgoal.com/Photos/Team/Medium/653.png";
  CAF_REMOTE["مودرن سبورت"] = "https://semedia.filgoal.com/Photos/Team/Medium/12724.png";
  CAF_REMOTE["وادي دجلة"] = "https://semedia.filgoal.com/Photos/Team/Medium/1016.png";
  CAF_REMOTE["البنك الأهلي"] = "https://semedia.filgoal.com/Photos/Team/Medium/2188.png";
  CAF_REMOTE["طلائع الجيش"] = "https://semedia.filgoal.com/Photos/Team/Medium/304.png";
  function normKey(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }
  var CAF_REMOTE_N = {};
  Object.keys(CAF_REMOTE).forEach(function (k) { CAF_REMOTE_N[normKey(k)] = CAF_REMOTE[k]; });
  var LOGO_ALIAS = {"douanes":"AS Douanes","asko kara":"ASKO de Kara","cd primeiro de agosto":"Primeiro de Agosto","club sportif sfaxien":"CS Sfaxien","associacao black bulls":"Black Bulls","real bamako":"AS Real Bamako","red arrows":"Red Arrows FC"};
  function teamLogo(n) {
    var al = LOGO_ALIAS[normKey(n)]; if (al) n = al;
    if (!LOGO56_AR) {
      LOGO56_AR = {};
      Object.keys(LOGO56).forEach(function (k) { LOGO56_AR[team(k)] = LOGO56[k]; });
    }
    if (normKey(n) === "san pedro" || normKey(n) === "fc san pedro") return TEAMLOGO["San Pedro"];
    if (normKey(n) === "maghreb as de fes") return TEAMLOGO["Maghreb As De Fes"];
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
    COMPS: COMPS, TEAMS: TEAMS, loadDay: loadDay, dkey: dkey,
    team: team, teamLogo: teamLogo, UNKNOWN_LOGO: UNKNOWN_LOGO,
    compLogo: function (id) { return COMPLOGO[id] || null; }
  };
})();
