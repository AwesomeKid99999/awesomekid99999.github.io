(function () {
    // ===== SELECTORS & KEYS (old-JS friendly) =====
    var THEME_ID = "theme";
    var COLOR_ID = "display-colors";
    var FONT_ID  = "dyslexia-friendly-font";
    var CONTRAST_ID = "contrast";

    var THEME_KEY = "theme-preference";   // 'system' | 'light' | 'dark'
    var COLOR_KEY = "color-mode";         // 'normal' | 'invert-colors' | 'grayscale'
    var FONT_KEY  = "font-dyslexic";      // 'enabled' | 'disabled'
    var CONTRAST_KEY = "a11y-contrast";   // 'on' | 'off'

    var themeSel = document.getElementById(THEME_ID);
    var colorSel = document.getElementById(COLOR_ID);
    var fontSel  = document.getElementById(FONT_ID);
    var contrastSel = document.getElementById(CONTRAST_ID);
    var body = document.body;
    var root = document.documentElement;

    // ===== Small class helpers (no classList) =====
    function hasClass(el, cls) {
        return new RegExp("(\\s|^)" + cls + "(\\s|$)").test(el.className);
    }
    function addClass(el, cls) {
        if (!hasClass(el, cls)) el.className = (el.className ? el.className + " " : "") + cls;
    }
    function removeClass(el, cls) {
        el.className = el.className.replace(new RegExp("(\\s|^)" + cls + "(\\s|$)","g"), " ").replace(/\s+/g," ").replace(/^\s+|\s+$/g,"");
    }
    function removeMany(el, arr) { for (var i=0;i<arr.length;i++) removeClass(el, arr[i]); }

    // ===== localStorage guards =====
    function lsGet(k) { try { return window.localStorage ? localStorage.getItem(k) : null; } catch(e){ return null; } }
    function lsSet(k,v){ try { if (window.localStorage) localStorage.setItem(k,v); } catch(e){} }

    // ===== Effective theme (fallback if no matchMedia) =====
    function supportsMatchMedia() {
        return !!(window.matchMedia && typeof window.matchMedia === "function");
    }
    function prefersDark() {
        return supportsMatchMedia() && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    function effectiveTheme(themePref) {
        if (themePref === "light") return "light";
        if (themePref === "dark")  return "dark";
        // 'system'
        return prefersDark() ? "dark" : "light";
    }

    // ===== APPLY FUNCTIONS =====
    function applyTheme(value) {
        removeMany(body, ["light","dark"]);
        if (value && value !== "system") addClass(body, value);

        // keep HC variant synced
        var hc = lsGet(CONTRAST_KEY) || "off";
        if (hc === "on") applyContrast("on", value);
    }

    function applyColors(value) {
        removeMany(root, ["invert","grayscale"]);
        if (value === "invert-colors") addClass(root, "invert");
        else if (value === "grayscale") addClass(root, "grayscale");
    }

    function applyFont(value) {
        if (value === "enabled") addClass(body, "font-dyslexic");
        else removeClass(body, "font-dyslexic");
    }

    // value: 'on' | 'off', themePref: 'system' | 'light' | 'dark'
    function applyContrast(value, themePref) {
        removeMany(body, ["high-contrast","hc-dark","hc-light"]);
        if (value !== "on") return;
        var pref = themePref || (lsGet(THEME_KEY) || "system");
        var eff = effectiveTheme(pref); // 'light' | 'dark'
        addClass(body, "high-contrast");
        addClass(body, eff === "dark" ? "hc-dark" : "hc-light");
    }

    // ===== LOAD SAVED SETTINGS =====
    var savedTheme    = lsGet(THEME_KEY)    || "system";
    var savedColor    = lsGet(COLOR_KEY)    || "normal";
    var savedFont     = lsGet(FONT_KEY)     || "disabled";
    var savedContrast = lsGet(CONTRAST_KEY) || "off";

    applyTheme(savedTheme);
    applyColors(savedColor);
    applyFont(savedFont);
    applyContrast(savedContrast, savedTheme);

    if (themeSel)    themeSel.value    = savedTheme;
    if (colorSel)    colorSel.value    = savedColor;
    if (fontSel)     fontSel.value     = savedFont;
    if (contrastSel) contrastSel.value = savedContrast;

    // ===== EVENT HELPERS (IE8- style) =====
    function onChange(el, fn) {
        if (!el) return;
        if (el.addEventListener) el.addEventListener("change", fn, false);
        else if (el.attachEvent) el.attachEvent("onchange", fn);
        else el.onchange = fn;
    }

    onChange(themeSel, function(){
        var val = themeSel && themeSel.value ? themeSel.value : "system";
        applyTheme(val);
        lsSet(THEME_KEY, val);
    });

    onChange(colorSel, function(){
        var val = colorSel && colorSel.value ? colorSel.value : "normal";
        applyColors(val);
        lsSet(COLOR_KEY, val);
    });

    onChange(fontSel, function(){
        var val = fontSel && fontSel.value ? fontSel.value : "disabled";
        applyFont(val);
        lsSet(FONT_KEY, val);
    });

    onChange(contrastSel, function(){
        var val = contrastSel && contrastSel.value ? contrastSel.value : "off";
        var themePref = lsGet(THEME_KEY) || "system";
        applyContrast(val, themePref);
        lsSet(CONTRAST_KEY, val);
    });

    // ===== SYSTEM THEME LISTENER (no-ops on XP/IE) =====
    if (supportsMatchMedia()) {
        var mq = window.matchMedia("(prefers-color-scheme: dark)");
        var handler = function(){
            var themePref = lsGet(THEME_KEY) || "system";
            if (themePref === "system") {
                applyTheme("system");
                var hc = lsGet(CONTRAST_KEY) || "off";
                if (hc === "on") applyContrast("on", "system");
            }
        };
        if (mq.addEventListener) mq.addEventListener("change", handler, false);
        else if (mq.addListener) mq.addListener(handler); // legacy WebKit
    }
})();