/* Gemeinsame Funktionen. Reines ES5 für IE11 Mobile (Windows Phone 8.1). */
(function (w, d) {
  "use strict";
  var PREFIX = "wp.";

  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function closest(el, sel) {
    var m = Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    while (el && el.nodeType === 1) { if (m.call(el, sel)) { return el; } el = el.parentNode; }
    return null;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function assign(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i];
      for (var k in s) { if (Object.prototype.hasOwnProperty.call(s, k)) { t[k] = s[k]; } }
    }
    return t;
  }
  var store = {
    get: function (k, def) {
      try { var v = w.localStorage.getItem(PREFIX + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
    },
    set: function (k, v) { try { w.localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} },
    wipe: function () {
      try {
        var del = [], i, k;
        for (i = 0; i < w.localStorage.length; i++) { k = w.localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) { del.push(k); } }
        for (i = 0; i < del.length; i++) { w.localStorage.removeItem(del[i]); }
      } catch (e) {}
    }
  };

  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); if (!t) { return; }
    t.firstChild.textContent = msg;
    t.className = "toast show";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 2200);
  }
  function copy(text) {
    var ok = false;
    try { if (w.clipboardData && w.clipboardData.setData) { ok = !!w.clipboardData.setData("Text", text); } } catch (e) {}
    if (!ok) {
      try {
        var ta = d.createElement("textarea");
        ta.value = text; ta.style.cssText = "position:fixed;left:0;top:0;opacity:0";
        d.body.appendChild(ta); ta.focus(); ta.select();
        if (ta.setSelectionRange) { ta.setSelectionRange(0, text.length); }
        ok = d.execCommand("copy");
        d.body.removeChild(ta);
      } catch (e2) { ok = false; }
    }
    toast(ok ? "Kopiert" : "Kopieren nicht möglich");
  }

  /* Zahl deutsch formatieren: 1.234,5 */
  function nf(n, dec) {
    n = Number(n);
    if (!isFinite(n)) { return "–"; }
    dec = dec == null ? 1 : dec;
    var a = Math.abs(n).toFixed(dec);
    var neg = n < 0 && parseFloat(a) > 0;
    var p = a.split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "-" : "") + p.join(",");
  }
  function kv(pairs) {
    var h = "<dl class='kv'>";
    for (var i = 0; i < pairs.length; i++) {
      var v = pairs[i][1];
      h += "<dt>" + esc(pairs[i][0]) + "</dt><dd>" + (v == null || v === "" ? "–" : esc(v)) + "</dd>";
    }
    return h + "</dl>";
  }

  /* ---------- Farben ---------- */
  function hexToRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) { h = h.replace(/(.)/g, "$1$1"); }
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    function x(v) { v = Math.round(Math.max(0, Math.min(255, v))); return (v < 16 ? "0" : "") + v.toString(16); }
    return "#" + x(r) + x(g) + x(b);
  }
  function luminance(hex) {
    var c = hexToRgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  }
  /* p = Anteil von a (0..1), Rest b */
  function mix(a, b, p) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A[0] * p + B[0] * (1 - p), A[1] * p + B[1] * (1 - p), A[2] * p + B[2] * (1 - p));
  }
  function rgbToHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0;
    if (mx !== mn) {
      var dd = mx - mn;
      s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    function f(n) {
      var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    }
    return rgbToHex(f(0), f(8), f(4));
  }

  /* ---------- Theme (Hell/Dunkel/Akzent) ---------- */
  var settings = assign({ theme: "dark", oled: false, accent: "#1F3A5F" }, store.get("settings", {}));
  var T = {};
  var extraCss = [];
  settings.theme = settings.theme === "light" ? "light" : "dark";
  function isDark() { return settings.theme === "dark"; }
  function applyTheme() {
    var dark = isDark(), t;
    if (dark) {
      t = { bg: "#111316", sf: "#1b1e22", sf2: "#24282d", tx: "#e6e8eb", mu: "#9aa1aa", bd: "#30353b", ok: "#7bc47f", err: "#f08a80" };
      if (settings.oled) { t.bg = "#000000"; t.sf = "#0b0b0c"; t.sf2 = "#151618"; t.bd = "#26292d"; }
    } else {
      t = { bg: "#f5f6f8", sf: "#ffffff", sf2: "#eef0f3", tx: "#1a1c1f", mu: "#5d636b", bd: "#dde1e6", ok: "#2E7D32", err: "#C0362C" };
    }
    var ac = settings.accent;
    if (dark && luminance(ac) < 0.18) { var hs = rgbToHsl(hexToRgb(ac)); ac = hslToHex(hs[0], Math.min(hs[1], 70), 72); }
    t.ac = ac;
    t.onac = luminance(ac) > 0.4 ? "#111111" : "#ffffff";
    t.acs = mix(ac, t.bg, dark ? 0.30 : 0.14);
    t.link = dark ? mix(ac, "#ffffff", 0.45) : ac;
    t.dark = dark;
    T = t;
    var css =
      "body{background:" + t.bg + ";color:" + t.tx + "}" +
      "a{color:" + t.link + "}" +
      ".iconbtn{color:" + t.tx + "}.iconbtn:active{background:" + t.sf2 + "}" +
      ".sub,.muted,.tool .d,h2,.kv dt,.badge,label.fld,.list-item small,.nope li{color:" + t.mu + "}" +
      ".nope b{color:" + t.tx + "}" +
      ".search,input[type=text],input[type=url],input[type=search],input[type=number],input[type=tel],input[type=password],select,textarea{background:" + t.sf + ";border:1px solid " + t.bd + ";color:" + t.tx + "}" +
      ".search:focus,input:focus,select:focus,textarea:focus{border-color:" + t.ac + "}" +
      ".tool{background:" + t.sf + ";border:1px solid " + t.bd + ";color:" + t.tx + "}.tool:active{border-color:" + t.ac + "}" +
      ".tool .ic{background:" + t.acs + ";color:" + t.tx + "}" +
      ".card{background:" + t.sf + ";border:1px solid " + t.bd + "}" +
      ".hint{background:" + t.sf2 + ";color:" + t.mu + "}" +
      ".btn{background:" + t.ac + ";color:" + t.onac + "}.btn.tonal{background:" + t.acs + ";color:" + t.tx + "}" +
      ".btn.text{background:none;color:" + t.tx + "}.btn.danger{background:" + t.err + ";color:#fff}.btn[disabled]{opacity:.5}" +
      ".seg{border:1px solid " + t.bd + ";background:" + t.sf + "}.seg button{color:" + t.tx + "}.seg button[aria-pressed=\"true\"]{background:" + t.acs + ";font-weight:600}" +
      ".list-item{border-top:1px solid " + t.bd + "}" +
      ".badge{background:" + t.sf2 + "}.badge.ok{color:" + t.ok + "}.badge.err,.err{color:" + t.err + "}" +
      ".tg{background:" + t.bd + "}.tg:after{background:#fff}.tg[aria-pressed=\"true\"]{background:" + t.ac + "}" +
      ".toast span{background:" + t.tx + ";color:" + t.bg + "}" +
      ".calc-display{background:" + t.sf2 + "}.calc-display input{color:" + t.tx + "}" +
      ".keys button{background:" + t.sf2 + ";color:" + t.tx + "}.keys button.op{background:" + t.acs + "}.keys button.eq{background:" + t.ac + ";color:" + t.onac + ";font-weight:700}" +
      ".hist .h{border-top:1px solid " + t.bd + "}.hist .h:first-child{border-top:0}" +
      ".sw{border:2px solid " + t.bd + "}.sw[aria-pressed=\"true\"]{outline:3px solid " + t.tx + ";outline-offset:2px}" +
      ".tone{box-shadow:inset 0 0 0 1px " + t.bd + "}" +
      "canvas.chart{background:" + t.sf2 + "}" +
      "#iconOv{background:" + settings.accent + ";color:" + (luminance(settings.accent) > 0.4 ? "#111111" : "#ffffff") + "}" +
      ".pos-grid button{border:1px solid " + t.bd + ";background:" + t.sf + ";color:" + t.tx + "}" +
      ".pos-grid button[aria-pressed=\"true\"]{background:" + t.ac + ";color:" + t.onac + ";border-color:" + t.ac + "}" +
      ".stats>div,.result{background:" + t.sf2 + "}.stats span{color:" + t.mu + "}" +
      ".ctl button{background:" + t.sf2 + ";color:" + t.tx + "}.ctl button.ac{background:" + t.ac + ";color:" + t.onac + "}.ctl button.tonal{background:" + t.acs + "}" +
      ".ctl button:active,.ctl button.down{background:" + t.acs + "}" +
      ".chips button{border:1px solid " + t.bd + ";background:" + t.sf + ";color:" + t.tx + "}.chips button[aria-pressed=\"true\"]{background:" + t.acs + ";border-color:" + t.ac + "}" +
      ".cb{border:2px solid " + t.mu + ";background:none;color:" + t.onac + "}.cb[aria-pressed=\"true\"]{background:" + t.ac + ";border-color:" + t.ac + "}" +
      ".tbl td,.tbl th{border-top:1px solid " + t.bd + "}.tbl th{color:" + t.mu + "}" +
      ".ok{color:" + t.ok + "}.bg-sf2{background:" + t.sf2 + "}.bg-acs{background:" + t.acs + "}" +
      "body.alarm{background:" + t.ac + "}" +
      "#fsExit{background:" + t.sf2 + ";color:" + t.tx + ";box-shadow:0 0 0 1px " + t.bd + "}";
    for (var xi = 0; xi < extraCss.length; xi++) { css += extraCss[xi](t); }
    var el = d.getElementById("themecss");
    if (!el) { el = d.createElement("style"); el.id = "themecss"; d.getElementsByTagName("head")[0].appendChild(el); }
    if (el.styleSheet) { el.styleSheet.cssText = css; } else { el.textContent = css; }
    var m = $('meta[name="theme-color"]'); if (m) { m.setAttribute("content", settings.accent); }
  }
  function saveSettings() { store.set("settings", settings); applyTheme(); }
  /* Seiten können eigene Farbregeln ergänzen: themeCss(function (t) { return "..."; }) */
  function themeCss(fn) { extraCss.push(fn); applyTheme(); }

  /* ---------- Zufall: crypto.getRandomValues, im IE11 msCrypto ---------- */
  var cryptoObj = w.crypto || w.msCrypto;
  var secureRandom = !!(cryptoObj && cryptoObj.getRandomValues);
  function randU32() {
    if (secureRandom) {
      try { var a = new Uint32Array(1); cryptoObj.getRandomValues(a); return a[0]; } catch (e) {}
    }
    return Math.floor(Math.random() * 4294967296);
  }
  /* gleichverteilte Ganzzahl 0 … n-1 (Ablehnungsverfahren gegen Modulo-Verzerrung) */
  function rnd(n) {
    var lim = 4294967296 - (4294967296 % n), x;
    do { x = randU32(); } while (x >= lim);
    return x % n;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- Touch: Pointer Events (IE11), MSPointer (IE10), Touch/Maus ---------- */
  var PE = w.PointerEvent ? ["pointerdown", "pointerup", "pointercancel"] :
    w.MSPointerEvent ? ["MSPointerDown", "MSPointerUp", "MSPointerCancel"] : null;
  function on(el, ev, fn) { el.addEventListener(ev, fn, false); }
  /* löst sofort beim Antippen aus; mit repeat (ms) wiederholt beim Halten */
  function onPress(el, fn, repeat) {
    var t1, t2;
    function stop() { clearTimeout(t1); clearInterval(t2); }
    function start(e) {
      if (e.preventDefault) { e.preventDefault(); }
      stop(); fn(e);
      if (repeat) { t1 = setTimeout(function () { t2 = setInterval(fn, repeat); }, 280); }
    }
    el.style.msTouchAction = "none"; el.style.touchAction = "none";
    if (PE) { on(el, PE[0], start); on(d, PE[1], stop); on(d, PE[2], stop); }
    else { on(el, "touchstart", start); on(d, "touchend", stop); on(d, "touchcancel", stop); on(el, "mousedown", start); on(d, "mouseup", stop); }
  }
  /* Wischgeste: fn("left" | "right" | "up" | "down") */
  function onSwipe(el, fn, minDist) {
    var sx = 0, sy = 0, active = false;
    minDist = minDist || 24;
    function start(x, y) { sx = x; sy = y; active = true; }
    function end(x, y) {
      if (!active) { return; }
      active = false;
      var dx = x - sx, dy = y - sy, ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < minDist) { return; }
      fn(ax > ay ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    }
    el.style.msTouchAction = "none"; el.style.touchAction = "none";
    if (PE) {
      on(el, PE[0], function (e) { start(e.clientX, e.clientY); });
      on(d, PE[1], function (e) { end(e.clientX, e.clientY); });
      on(d, PE[2], function () { active = false; });
    } else {
      on(el, "touchstart", function (e) { var p = e.touches[0]; start(p.clientX, p.clientY); });
      on(el, "touchmove", function (e) { if (active) { e.preventDefault(); } });
      on(d, "touchend", function (e) { var p = e.changedTouches[0]; end(p.clientX, p.clientY); });
      on(el, "mousedown", function (e) { start(e.clientX, e.clientY); });
      on(d, "mouseup", function (e) { end(e.clientX, e.clientY); });
    }
  }
  /* Pfeiltasten und WASD: fn("left" | ...) – für Tastatur und Emulator */
  function onArrows(fn) {
    var K = { 37: "left", 38: "up", 39: "right", 40: "down", 65: "left", 87: "up", 68: "right", 83: "down" };
    on(d, "keydown", function (e) {
      var t = e.target && e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") { return; }
      if (K[e.keyCode]) { e.preventDefault(); fn(K[e.keyCode], e); }
    });
  }

  /* Nutzbare Inhaltsbreite für Spielfelder (Breite von <main> ohne Innenabstand).
     Fallback auf die Fensterbreite, falls <main> wie im alten IE 0 meldet. */
  function contentWidth() {
    var m = d.getElementsByTagName("main")[0], cw = m ? m.clientWidth : 0;
    if (!cw) { cw = Math.min(d.documentElement.clientWidth || w.innerWidth || 352, 760); }
    return Math.max(160, cw - 32);
  }

  /* ---------- Vollbild ----------
     Auf App-Seiten blendet der Vollbildmodus Kopfzeile und Hilfetexte (.help) aus; Spiele passen ihr
     Feld mit fitWidth/availHeight an die Fensterhöhe an. Wo der Browser es kann, zusätzlich echtes Vollbild. */
  var isApp = w.ROOT === "../../", fsOn = isApp && !!store.get("fs", false);
  var FS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>';
  var FS_EXIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5"/></svg>';
  function isFs() { return fsOn; }
  function setFsClass() {
    var el = d.documentElement;
    el.className = el.className.replace(/\s*\bfs\b/g, "") + (fsOn ? " fs" : "");
  }
  /* Höhe, die ein Spielfeld bekommen darf: Fensterhöhe minus alles andere auf der Seite */
  function availHeight(board) {
    var vh = w.innerHeight || d.documentElement.clientHeight || 640;
    if (!board || !d.body) { return vh; }
    /* Bereiche mit .fsx (z. B. Einstellungen unter dem Spiel) dürfen unterhalb des Bildschirms liegen */
    var other = d.body.offsetHeight - board.offsetHeight, xs = $$(".fsx"), k, cs;
    for (k = 0; k < xs.length; k++) {
      cs = w.getComputedStyle ? w.getComputedStyle(xs[k], null) : null;
      other -= xs[k].offsetHeight + (cs ? (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0) : 0);
    }
    return Math.max(120, vh - other - 4);
  }
  /* Breite eines Spielfelds mit Seitenverhältnis aspect (Höhe/Breite); im Vollbild zusätzlich höhenbegrenzt */
  function fitWidth(maxW, aspect, board) {
    var W = Math.min(contentWidth(), maxW || 100000);
    if (!fsOn || !board) { return W; }
    return Math.max(160, Math.min(W, Math.floor(availHeight(board) / aspect)));
  }
  function relayout() { if (typeof w.onresize === "function") { try { w.onresize(); } catch (e) {} } }
  function toggleFs() {
    var el = d.documentElement;
    fsOn = !fsOn; store.set("fs", fsOn); setFsClass();
    try {
      if (fsOn) { if (el.requestFullscreen) { el.requestFullscreen(); } else if (el.msRequestFullscreen) { el.msRequestFullscreen(); } else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); } }
      else if (d.fullscreenElement && d.exitFullscreen) { d.exitFullscreen(); }
      else if (d.msFullscreenElement && d.msExitFullscreen) { d.msExitFullscreen(); }
      else if (d.webkitFullscreenElement && d.webkitExitFullscreen) { d.webkitExitFullscreen(); }
    } catch (e) {}
    w.scrollTo(0, 0); relayout(); setTimeout(relayout, 350);
  }
  function initFs() {
    var hd = $("header.top .wrap"), set, b, x;
    if (!isApp || !hd) { return; }
    set = hd.querySelector('a[href$="einstellungen/"]');
    b = d.createElement("button"); b.className = "iconbtn"; b.id = "fsBtn"; b.setAttribute("aria-label", "Vollbild"); b.innerHTML = FS_ICON;
    hd.insertBefore(b, set || null);
    x = d.createElement("button"); x.id = "fsExit"; x.setAttribute("aria-label", "Vollbild beenden"); x.innerHTML = FS_EXIT;
    d.body.appendChild(x);
    b.onclick = toggleFs; x.onclick = toggleFs;
    if (fsOn) { relayout(); }
  }
  if (isApp) { setFsClass(); }

  /* ---------- Hilfen für Zahlen und Zeiten ---------- */
  function pad(n, len) { n = String(n); while (n.length < (len || 2)) { n = "0" + n; } return n; }
  /* ms → "1:02:03" bzw. "02:03", mit tenths ",4" */
  function fmtDur(ms, tenths) {
    if (ms < 0) { ms = 0; }
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
    var out = (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s % 60);
    return tenths ? out + "," + Math.floor(ms % 1000 / 100) : out;
  }
  /* "1.234,5" oder "1234.5" → Zahl, sonst NaN */
  function parseNum(v) {
    v = String(v == null ? "" : v).replace(/[\s\u00a0']/g, "");
    if (v.indexOf(",") >= 0) { v = v.replace(/\./g, "").replace(",", "."); }
    return /^[+\-]?(\d+\.?\d*|\.\d+)(e[+\-]?\d+)?$/i.test(v) ? parseFloat(v) : NaN;
  }
  /* Zahl mit bis zu sig signifikanten Stellen, deutsch formatiert (sehr groß/klein: 1,23e-9) */
  function fmtG(v, sig) {
    v = Number(v);
    if (!isFinite(v)) { return "–"; }
    if (v === 0) { return "0"; }
    var a = Math.abs(v);
    if (a >= 1e15 || a < 1e-6) { return v.toExponential((sig || 10) - 1).replace(/\.?0+e/, "e").replace(".", ","); }
    var str = String(Number(v.toPrecision(sig || 10)));
    if (/e/i.test(str)) { str = Number(str).toFixed(12).replace(/0+$/, ""); }
    var p = str.replace("-", "").split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (v < 0 ? "-" : "") + p[0] + (p[1] ? "," + p[1] : "");
  }
  /* Signal am Ende eines Timers: Vibration, Ton (wenn der Browser es kann), Blinken */
  var audioCtx = null;
  function beep(times) {
    times = times || 3;
    try { if (navigator.vibrate) { navigator.vibrate([300, 150, 300, 150, 300]); } } catch (e) {}
    try {
      var AC = w.AudioContext || w.webkitAudioContext;
      if (AC) {
        audioCtx = audioCtx || new AC();
        for (var i = 0; i < times; i++) {
          var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime + i * 0.45;
          o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
          g.gain.setValueAtTime(0.25, t0); g.gain.setValueAtTime(0, t0 + 0.3);
          o.start(t0); o.stop(t0 + 0.32);
        }
      }
    } catch (e2) {}
    var n = 0, b = d.body;
    var iv = setInterval(function () {
      b.className = n % 2 ? b.className.replace(/\s*alarm/g, "") : b.className + " alarm";
      if (++n >= times * 2) { clearInterval(iv); b.className = b.className.replace(/\s*alarm/g, ""); }
    }, 350);
  }

  /* ---------- FPS-Messung und Overlay ---------- */
  var POS = ["Oben links", "Oben Mitte", "Oben rechts", "Mitte links", "Mitte", "Mitte rechts", "Unten links", "Unten Mitte", "Unten rechts"];
  var fpsCfg = assign({ on: false, pos: 2, color: "#ffffff", bg: "#000000", bgOn: true, bgAlpha: 60, size: 16, radius: 8 }, store.get("fps", {}));
  var raf = w.requestAnimationFrame || w.msRequestAnimationFrame || w.webkitRequestAnimationFrame || function (fn) { return w.setTimeout(function () { fn(+new Date()); }, 16); };
  var caf = w.cancelAnimationFrame || w.msCancelAnimationFrame || w.webkitCancelAnimationFrame || w.clearTimeout;
  var fpsMeter = {
    frames: [], subs: [], id: 0, fps: 0,
    tick: function (t) {
      var f = fpsMeter.frames; f.push(t);
      while (f.length && t - f[0] > 1000) { f.shift(); }
      fpsMeter.fps = f.length;
      for (var i = 0; i < fpsMeter.subs.length; i++) { fpsMeter.subs[i](t); }
      fpsMeter.id = raf(fpsMeter.tick);
    },
    sub: function (fn) {
      fpsMeter.subs.push(fn);
      if (!fpsMeter.id) { fpsMeter.id = raf(fpsMeter.tick); }
      return function () {
        var i = fpsMeter.subs.indexOf(fn); if (i >= 0) { fpsMeter.subs.splice(i, 1); }
        if (!fpsMeter.subs.length) { caf(fpsMeter.id); fpsMeter.id = 0; fpsMeter.frames = []; }
      };
    }
  };
  var overlayUnsub = null;
  function applyOverlay() {
    var o = $("#fpsOverlay"); if (!o) { return; }
    store.set("fps", fpsCfg);
    if (!fpsCfg.on) { o.style.display = "none"; if (overlayUnsub) { overlayUnsub(); overlayUnsub = null; } return; }
    var col = fpsCfg.pos % 3, row = Math.floor(fpsCfg.pos / 3), rgb = hexToRgb(fpsCfg.bg), s = o.style;
    s.display = "block"; s.color = fpsCfg.color; s.fontSize = fpsCfg.size + "px"; s.borderRadius = fpsCfg.radius + "px";
    s.background = fpsCfg.bgOn ? "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + (fpsCfg.bgAlpha / 100) + ")" : "transparent";
    s.top = row === 0 ? "8px" : row === 1 ? "50%" : "auto";
    s.bottom = row === 2 ? "8px" : "auto";
    s.left = col === 0 ? "8px" : col === 1 ? "50%" : "auto";
    s.right = col === 2 ? "8px" : "auto";
    s.transform = "translate(" + (col === 1 ? "-50%" : "0") + "," + (row === 1 ? "-50%" : "0") + ")";
    s.msTransform = s.transform;
    if (!overlayUnsub) {
      var last = 0;
      overlayUnsub = fpsMeter.sub(function (t) { if (t - last > 250) { last = t; o.textContent = fpsMeter.fps + " FPS"; } });
    }
  }

  /* ---------- Werkzeugliste (Startseite, Verknüpfungen) ---------- */
  var TOOLS = [
    { id: "rechner", dir: "tools", title: "Rechner" },
    { id: "fps", dir: "tools", title: "Bildrate (FPS)" },
    { id: "geraeteinfo", dir: "tools", title: "Geräteinfo" },
    { id: "netzwerk", dir: "tools", title: "Netzwerk" },
    { id: "speedtest", dir: "tools", title: "Speedtest" },
    { id: "datenvolumen", dir: "tools", title: "Datenvolumen" },
    { id: "licht", dir: "tools", title: "Bildschirmlicht" },
    { id: "palette", dir: "tools", title: "Farbe & Palette" },
    { id: "verknuepfungen", dir: "tools", title: "Verknüpfungen" },
    { id: "minesweeper", dir: "apps", title: "Minesweeper" },
    { id: "2048", dir: "apps", title: "2048" },
    { id: "snake", dir: "apps", title: "Snake" },
    { id: "tetris", dir: "apps", title: "Tetris" },
    { id: "sudoku", dir: "apps", title: "Sudoku" },
    { id: "memory", dir: "apps", title: "Memory" },
    { id: "schiebepuzzle", dir: "apps", title: "Schiebepuzzle" },
    { id: "tictactoe", dir: "apps", title: "Tic-Tac-Toe" },
    { id: "vierreihe", dir: "apps", title: "Vier in einer Reihe" },
    { id: "reversi", dir: "apps", title: "Reversi" },
    { id: "codeknacken", dir: "apps", title: "Code knacken" },
    { id: "galgen", dir: "apps", title: "Galgenmännchen" },
    { id: "mauerbrecher", dir: "apps", title: "Mauerbrecher" },
    { id: "flattervogel", dir: "apps", title: "Flattervogel" },
    { id: "farbfolge", dir: "apps", title: "Farbfolge" },
    { id: "lichteraus", dir: "apps", title: "Lichter aus" },
    { id: "reaktion", dir: "apps", title: "Reaktionstest" },
    { id: "solitaer", dir: "apps", title: "Solitär" },
    { id: "kopfrechnen", dir: "apps", title: "Kopfrechnen-Duell" },
    { id: "fuenfwuerfel", dir: "apps", title: "Fünf Würfel" },
    { id: "pingpong", dir: "apps", title: "Ping-Pong" },
    { id: "zeichnen", dir: "apps", title: "Zeichenblock" },
    { id: "gluecksrad", dir: "apps", title: "Glücksrad" },
    { id: "laufschrift", dir: "apps", title: "Laufschrift" },
    { id: "social", dir: "apps", title: "Social" },
    { id: "notizen", dir: "apps", title: "Notizen" },
    { id: "todo", dir: "apps", title: "To-do-Liste" },
    { id: "stoppuhr", dir: "apps", title: "Stoppuhr" },
    { id: "timer", dir: "apps", title: "Timer & Pomodoro" },
    { id: "wuerfel", dir: "apps", title: "Würfel & Münze" },
    { id: "passwort", dir: "apps", title: "Passwortgenerator" },
    { id: "einheiten", dir: "apps", title: "Einheitenrechner" },
    { id: "prozent", dir: "apps", title: "Prozentrechner" },
    { id: "trinkgeld", dir: "apps", title: "Trinkgeldrechner" },
    { id: "zaehler", dir: "apps", title: "Zähler" },
    { id: "datum", dir: "apps", title: "Datum & Fristen" },
    { id: "text", dir: "apps", title: "Textwerkzeuge" },
    { id: "subnetz", dir: "apps", title: "Subnetzrechner" },
    { id: "zahlensysteme", dir: "apps", title: "Zahlensysteme" },
    { id: "ports", dir: "apps", title: "Ports" },
    { id: "lernkarten", dir: "apps", title: "Lernkarten Netzwerk" },
    { id: "befehle", dir: "apps", title: "Befehle" },
    { id: "buchstabieren", dir: "apps", title: "Buchstabieren & Morse" }
  ];
  function toolUrl(t) { return (w.ROOT || "") + (t.dir || "tools") + "/" + t.id + "/"; }

  /* Offline (Application Cache, IE10/IE11). Die Liste steht in offline.appcache. */
  var offlineSubs = [];
  var offline = {
    // "none" | "checking" | "downloading" | "ready" | "update" | "error" | "obsolete"
    state: "none", loaded: 0, total: 0,
    sub: function (fn) { offlineSubs.push(fn); },
    update: function () { var ac = w.applicationCache; if (!ac) { return false; } try { ac.update(); return true; } catch (e) { return false; } }
  };
  function offlineSet(st) {
    offline.state = st;
    for (var i = 0; i < offlineSubs.length; i++) { try { offlineSubs[i](offline); } catch (e) {} }
  }
  (function () {
    var ac = w.applicationCache; if (!ac || !ac.addEventListener) { return; }
    var S = { 1: "ready", 2: "checking", 3: "downloading", 4: "update", 5: "obsolete" };
    offline.state = S[ac.status] || "none";
    ac.addEventListener("checking", function () { offlineSet("checking"); }, false);
    ac.addEventListener("downloading", function () { offline.loaded = 0; offline.total = 0; offlineSet("downloading"); }, false);
    ac.addEventListener("progress", function (e) { if (e && e.lengthComputable) { offline.loaded = e.loaded; offline.total = e.total; } offlineSet("downloading"); }, false);
    ac.addEventListener("noupdate", function () { offlineSet("ready"); }, false);
    ac.addEventListener("cached", function () { offlineSet("ready"); toast("Alle Apps sind jetzt offline verfügbar"); }, false);
    ac.addEventListener("updateready", function () {
      try { ac.swapCache(); } catch (e) {}
      offlineSet("update"); toast("Neue Version geladen – beim nächsten Öffnen aktiv");
    }, false);
    ac.addEventListener("obsolete", function () { offlineSet("obsolete"); }, false);
    ac.addEventListener("error", function () { offlineSet(w.navigator.onLine === false && ac.status === 1 ? "ready" : "error"); }, false);
  })();

  w.$ = $; w.$$ = $$; w.closest = closest; w.esc = esc; w.assign = assign; w.store = store;
  w.toast = toast; w.copy = copy; w.nf = nf; w.kv = kv;
  w.hexToRgb = hexToRgb; w.rgbToHex = rgbToHex; w.mix = mix; w.rgbToHsl = rgbToHsl; w.hslToHex = hslToHex;
  w.settings = settings; w.saveSettings = saveSettings; w.applyTheme = applyTheme;
  w.getTheme = function () { return T; };
  w.POS = POS; w.fpsCfg = fpsCfg; w.fpsMeter = fpsMeter; w.applyOverlay = applyOverlay;
  w.TOOLS = TOOLS; w.toolUrl = toolUrl;
  w.offline = offline;
  w.themeCss = themeCss; w.rnd = rnd; w.shuffle = shuffle; w.secureRandom = secureRandom; w.randU32 = randU32;
  w.onPress = onPress; w.onSwipe = onSwipe; w.onArrows = onArrows; w.contentWidth = contentWidth;
  w.isFs = isFs; w.availHeight = availHeight; w.fitWidth = fitWidth;
  w.pad = pad; w.fmtDur = fmtDur; w.parseNum = parseNum; w.fmtG = fmtG; w.beep = beep;

  applyTheme();
  if (d.addEventListener) { d.addEventListener("DOMContentLoaded", function () { applyOverlay(); initFs(); }, false); }
})(window, document);
