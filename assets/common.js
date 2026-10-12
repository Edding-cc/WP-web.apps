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
  var settings = assign({ theme: "system", oled: false, accent: "#1F3A5F" }, store.get("settings", {}));
  var T = {};
  function isDark() {
    if (settings.theme === "dark") { return true; }
    if (settings.theme === "light") { return false; }
    try { return !!(w.matchMedia && w.matchMedia("(prefers-color-scheme: dark)").matches); } catch (e) { return false; }
  }
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
      ".search,input[type=text],input[type=url],input[type=search],select,textarea{background:" + t.sf + ";border:1px solid " + t.bd + ";color:" + t.tx + "}" +
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
      ".pos-grid button{border:1px solid " + t.bd + ";background:" + t.sf + ";color:" + t.tx + "}" +
      ".pos-grid button[aria-pressed=\"true\"]{background:" + t.ac + ";color:" + t.onac + ";border-color:" + t.ac + "}";
    var el = d.getElementById("theme");
    if (!el) { el = d.createElement("style"); el.id = "theme"; d.getElementsByTagName("head")[0].appendChild(el); }
    if (el.styleSheet) { el.styleSheet.cssText = css; } else { el.textContent = css; }
    var m = $('meta[name="theme-color"]'); if (m) { m.setAttribute("content", settings.accent); }
  }
  function saveSettings() { store.set("settings", settings); applyTheme(); }

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

  /* ---------- Werkzeugliste (für Verknüpfungen) ---------- */
  var TOOLS = [
    { id: "rechner", title: "Rechner" },
    { id: "fps", title: "Bildrate (FPS)" },
    { id: "geraeteinfo", title: "Geräteinfo" },
    { id: "palette", title: "Farbe & Palette" },
    { id: "verknuepfungen", title: "Verknüpfungen" }
  ];

  w.$ = $; w.$$ = $$; w.closest = closest; w.esc = esc; w.assign = assign; w.store = store;
  w.toast = toast; w.copy = copy; w.nf = nf; w.kv = kv;
  w.hexToRgb = hexToRgb; w.rgbToHex = rgbToHex; w.rgbToHsl = rgbToHsl; w.hslToHex = hslToHex;
  w.settings = settings; w.saveSettings = saveSettings; w.applyTheme = applyTheme;
  w.getTheme = function () { return T; };
  w.POS = POS; w.fpsCfg = fpsCfg; w.fpsMeter = fpsMeter; w.applyOverlay = applyOverlay;
  w.TOOLS = TOOLS;

  applyTheme();
  if (d.addEventListener) { d.addEventListener("DOMContentLoaded", applyOverlay, false); }
})(window, document);
