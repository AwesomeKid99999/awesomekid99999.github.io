(function () {
    // ===== SELECTORS & KEYS (old-JS friendly) =====
    var THEME_ID = "theme";
    var COLOR_ID = "display-colors";
    var FONT_ID  = "dyslexia-friendly-font";
    var UNDERLINE_ID = "underline-links";
    var OUTLINE_ID = "text-outline";
    var CONTRAST_ID = "contrast";
    var TIME_FORMAT_ID = "time-format";
    var CUSTOM_BG_ID = "custom-bg";
    var CUSTOM_BG2_ID = "custom-bg-2";
    var CUSTOM_BG3_ID = "custom-bg-3";
    var CUSTOM_BG4_ID = "custom-bg-4";
    var CUSTOM_BG5_ID = "custom-bg-5";
    var CUSTOM_TEXT_ID = "custom-text";
    var CUSTOM_LINK_ID = "custom-link";
    var CUSTOM_UNDERLINE_ID = "custom-underline";
    var CUSTOM_OUTLINE_ID = "custom-outline";
    var CUSTOM_ACCENT_ID = "custom-accent";
    var CUSTOM_GRADIENT_ID = "custom-gradient";
    var CUSTOM_GRADIENT_MODE_ID = "custom-gradient-mode";
    var CUSTOM_GRADIENT_COUNT_ID = "custom-gradient-count";
    var CUSTOM_GRADIENT_STOPS_ID = "custom-gradient-stops";
    var CUSTOM_ANGLE_ID = "custom-gradient-angle";
    var CUSTOM_RESET_ID = "custom-theme-reset";
    var CUSTOM_RANDOM_ID = "custom-theme-random";

    var THEME_KEY = "theme-preference";   // 'system' | 'light' | 'dark' | 'custom'
    var COLOR_KEY = "color-mode";         // 'normal' | 'invert-colors' | 'grayscale'
    var FONT_KEY  = "font-dyslexic";      // 'enabled' | 'disabled'
    var UNDERLINE_KEY = "underline-links"; // 'on' | 'off'
    var OUTLINE_KEY = "text-outline";     // 'on' | 'off'
    var CONTRAST_KEY = "a11y-contrast";   // 'on' | 'off'
    var TIME_FORMAT_KEY = "time-format";  // '24h' | '12h'
    var CUSTOM_BG_KEY = "custom-bg";      // hex color
    var CUSTOM_BG2_KEY = "custom-bg-2";   // hex color
    var CUSTOM_BG3_KEY = "custom-bg-3";   // hex color
    var CUSTOM_BG4_KEY = "custom-bg-4";   // hex color
    var CUSTOM_BG5_KEY = "custom-bg-5";   // hex color
    var CUSTOM_TEXT_KEY = "custom-text";  // hex color
    var CUSTOM_LINK_KEY = "custom-link";  // hex color
    var CUSTOM_UNDERLINE_KEY = "custom-underline"; // hex color
    var CUSTOM_OUTLINE_KEY = "custom-outline"; // hex color
    var CUSTOM_ACCENT_KEY = "custom-accent"; // hex color
    var CUSTOM_GRADIENT_KEY = "custom-gradient"; // 'on' | 'off'
    var CUSTOM_GRADIENT_MODE_KEY = "custom-gradient-mode"; // 'basic' | 'advanced'
    var CUSTOM_GRADIENT_COUNT_KEY = "custom-gradient-count"; // 2-5
    var CUSTOM_GRADIENT_STOPS_KEY = "custom-gradient-stops"; // comma-separated
    var CUSTOM_ANGLE_KEY = "custom-gradient-angle"; // degrees

    var themeSel = document.getElementById(THEME_ID);
    var colorSel = document.getElementById(COLOR_ID);
    var fontSel  = document.getElementById(FONT_ID);
    var underlineSel = document.getElementById(UNDERLINE_ID);
    var outlineSel = document.getElementById(OUTLINE_ID);
    var contrastSel = document.getElementById(CONTRAST_ID);
    var timeFormatSel = document.getElementById(TIME_FORMAT_ID);
    var customBgInput = document.getElementById(CUSTOM_BG_ID);
    var customBg2Input = document.getElementById(CUSTOM_BG2_ID);
    var customBg3Input = document.getElementById(CUSTOM_BG3_ID);
    var customBg4Input = document.getElementById(CUSTOM_BG4_ID);
    var customBg5Input = document.getElementById(CUSTOM_BG5_ID);
    var customTextInput = document.getElementById(CUSTOM_TEXT_ID);
    var customLinkInput = document.getElementById(CUSTOM_LINK_ID);
    var customUnderlineInput = document.getElementById(CUSTOM_UNDERLINE_ID);
    var customOutlineInput = document.getElementById(CUSTOM_OUTLINE_ID);
    var customAccentInput = document.getElementById(CUSTOM_ACCENT_ID);
    var customGradientInput = document.getElementById(CUSTOM_GRADIENT_ID);
    var customGradientModeInput = document.getElementById(CUSTOM_GRADIENT_MODE_ID);
    var customGradientCountInput = document.getElementById(CUSTOM_GRADIENT_COUNT_ID);
    var customGradientStopsInput = document.getElementById(CUSTOM_GRADIENT_STOPS_ID);
    var customAngleInput = document.getElementById(CUSTOM_ANGLE_ID);
    var customResetBtn = document.getElementById(CUSTOM_RESET_ID);
    var customRandomBtn = document.getElementById(CUSTOM_RANDOM_ID);
    var body = document.body;
    var root = document.documentElement;

    var DEFAULT_CUSTOM = {
        bg: "#bbffbb",
        bg2: "#bbffff",
        bg3: "#bbffbb",
        bg4: "#bbffdd",
        bg5: "#bbddff",
        text: "#000000",
        link: "#0077cc",
        underline: "#0077cc",
        outline: "#000000",
        accent: "#00cc00",
        gradient: true,
        angle: 135,
        mode: "basic",
        count: 2,
        stops: "#bbffbb, #bbffff"
    };

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

    function normalizeHex(value, fallback) {
        if (!value || typeof value !== "string") return fallback;
        var v = value.toLowerCase();
        if (v.charAt(0) !== "#") v = "#" + v;
        if (v.length === 4) {
            v = "#" + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2) + v.charAt(3) + v.charAt(3);
        }
        if (v.length !== 7) return fallback;
        return v;
    }

    function hexToRgb(hex) {
        var h = normalizeHex(hex, "#000000").replace("#", "");
        var r = parseInt(h.substr(0,2), 16);
        var g = parseInt(h.substr(2,2), 16);
        var b = parseInt(h.substr(4,2), 16);
        return { r: r, g: g, b: b };
    }

    function isDarkColor(hex) {
        var rgb = hexToRgb(hex);
        var lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return lum < 0.5;
    }

    function adjustColor(hex, amount) {
        var rgb = hexToRgb(hex);
        var adj = function(c){
            var v = Math.round(c + amount * 255);
            if (v < 0) v = 0; if (v > 255) v = 255;
            return v;
        };
        var r = adj(rgb.r), g = adj(rgb.g), b = adj(rgb.b);
        var toHex = function(c){
            var s = c.toString(16);
            return s.length === 1 ? "0" + s : s;
        };
        return "#" + toHex(r) + toHex(g) + toHex(b);
    }

    function invertHex(hex) {
        var rgb = hexToRgb(hex);
        var r = 255 - rgb.r;
        var g = 255 - rgb.g;
        var b = 255 - rgb.b;
        var toHex = function(c){
            var s = c.toString(16);
            return s.length === 1 ? "0" + s : s;
        };
        return "#" + toHex(r) + toHex(g) + toHex(b);
    }

    function isGray(hex) {
        var rgb = hexToRgb(hex);
        return rgb.r === rgb.g && rgb.g === rgb.b;
    }

    function randomHexColor() {
        var rand = function(){
            return Math.floor(Math.random() * 256);
        };
        var toHex = function(c){
            var s = c.toString(16);
            return s.length === 1 ? "0" + s : s;
        };
        return "#" + toHex(rand()) + toHex(rand()) + toHex(rand());
    }

    function randomStops(count) {
        var out = [];
        for (var i = 0; i < count; i++) out.push(randomHexColor());
        return out;
    }

    function clampAngle(val) {
        var n = parseInt(val, 10);
        if (isNaN(n)) n = DEFAULT_CUSTOM.angle;
        if (n < 0) n = 0;
        if (n > 360) n = 360;
        return n;
    }

    function clampCount(val) {
        var n = parseInt(val, 10);
        if (isNaN(n)) n = DEFAULT_CUSTOM.count;
        if (n < 2) n = 2;
        if (n > 5) n = 5;
        return n;
    }

    function isPlainHex(value) {
        return /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value);
    }

    function normalizeStopToken(token) {
        var t = token.replace(/^\s+|\s+$/g, "");
        if (!t) return "";
        if (isPlainHex(t)) return normalizeHex(t, t);
        return t;
    }

    function parseStops(str) {
        if (!str || !str.replace(/\s+/g, "")) return [];
        var raw = str.split(",");
        var out = [];
        for (var i = 0; i < raw.length; i++) {
            var tok = normalizeStopToken(raw[i]);
            if (tok) out.push(tok);
        }
        return out;
    }

    function buildBasicStops(count) {
        var colors = [
            normalizeHex(lsGet(CUSTOM_BG_KEY), DEFAULT_CUSTOM.bg),
            normalizeHex(lsGet(CUSTOM_BG2_KEY), DEFAULT_CUSTOM.bg2),
            normalizeHex(lsGet(CUSTOM_BG3_KEY), DEFAULT_CUSTOM.bg3),
            normalizeHex(lsGet(CUSTOM_BG4_KEY), DEFAULT_CUSTOM.bg4),
            normalizeHex(lsGet(CUSTOM_BG5_KEY), DEFAULT_CUSTOM.bg5)
        ];
        return colors.slice(0, count);
    }

    function extractFirstColor(stops) {
        if (!stops || !stops.length) return DEFAULT_CUSTOM.bg;
        var first = stops[0];
        var part = first.split(/\s+/)[0];
        if (isPlainHex(part)) return normalizeHex(part, DEFAULT_CUSTOM.bg);
        return part || DEFAULT_CUSTOM.bg;
    }

    function setCustomVars(stops, text, link, underline, outline, accent, gradientEnabled, angle) {
        var bgVal = extractFirstColor(stops);
        var textVal = normalizeHex(text, DEFAULT_CUSTOM.text);
        var linkVal = normalizeHex(link, DEFAULT_CUSTOM.link);
        var underlineVal = normalizeHex(underline, linkVal);
        var outlineVal = normalizeHex(outline, DEFAULT_CUSTOM.outline);
        var outlineLower = outlineVal.toLowerCase();
        var outlineOpposite = (outlineLower === "#000000" || outlineLower === "#ffffff" || isGray(outlineVal))
            ? invertHex(outlineVal)
            : outlineVal;
        var accentVal = normalizeHex(accent, DEFAULT_CUSTOM.accent);
        var linkHover = adjustColor(linkVal, -0.15);
        var accentHover = adjustColor(accentVal, -0.15);
        var buttonText = isDarkColor(accentVal) ? "#ffffff" : "#000000";
        var buttonTextLower = buttonText.toLowerCase();
        var buttonTextOpposite = (buttonTextLower === "#000000" || buttonTextLower === "#ffffff" || isGray(buttonText))
            ? invertHex(buttonText)
            : buttonText;
        var ang = clampAngle(angle);
        var bgGradient = (gradientEnabled && stops && stops.length >= 2)
            ? "linear-gradient(" + ang + "deg, " + stops.join(", ") + ")"
            : bgVal;

        root.style.setProperty("--custom-bg", bgVal);
        root.style.setProperty("--custom-bg-gradient", bgGradient);
        root.style.setProperty("--custom-text", textVal);
        root.style.setProperty("--custom-link", linkVal);
        root.style.setProperty("--custom-link-hover", linkHover);
        root.style.setProperty("--custom-underline", underlineVal);
        root.style.setProperty("--custom-outline", outlineVal);
        root.style.setProperty("--custom-outline-opposite", outlineOpposite);
        root.style.setProperty("--custom-button-bg", accentVal);
        root.style.setProperty("--custom-button-hover", accentHover);
        root.style.setProperty("--custom-button-text", buttonText);
        root.style.setProperty("--custom-button-text-opposite", buttonTextOpposite);
    }

    function applyCustomThemeFromStorage() {
        var text = normalizeHex(lsGet(CUSTOM_TEXT_KEY), DEFAULT_CUSTOM.text);
        var link = normalizeHex(lsGet(CUSTOM_LINK_KEY), DEFAULT_CUSTOM.link);
        var underline = normalizeHex(lsGet(CUSTOM_UNDERLINE_KEY), DEFAULT_CUSTOM.underline);
        var outline = normalizeHex(lsGet(CUSTOM_OUTLINE_KEY), DEFAULT_CUSTOM.outline);
        var accent = normalizeHex(lsGet(CUSTOM_ACCENT_KEY), DEFAULT_CUSTOM.accent);
        var gradientEnabled = (lsGet(CUSTOM_GRADIENT_KEY) || (DEFAULT_CUSTOM.gradient ? "on" : "off")) === "on";
        var angle = lsGet(CUSTOM_ANGLE_KEY) || DEFAULT_CUSTOM.angle;
        var mode = lsGet(CUSTOM_GRADIENT_MODE_KEY) || DEFAULT_CUSTOM.mode;
        var count = clampCount(lsGet(CUSTOM_GRADIENT_COUNT_KEY) || DEFAULT_CUSTOM.count);
        var stopsStr = lsGet(CUSTOM_GRADIENT_STOPS_KEY) || DEFAULT_CUSTOM.stops;
        var stops = mode === "advanced" ? parseStops(stopsStr) : buildBasicStops(count);
        if (!stops || stops.length < 1) stops = buildBasicStops(1);
        setCustomVars(stops, text, link, underline, outline, accent, gradientEnabled, angle);
    }

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
        if (themePref === "custom") {
            var bg = normalizeHex(lsGet(CUSTOM_BG_KEY), DEFAULT_CUSTOM.bg);
            return isDarkColor(bg) ? "dark" : "light";
        }
        // 'system'
        return prefersDark() ? "dark" : "light";
    }

    // ===== APPLY FUNCTIONS =====
    function applyTheme(value) {
        removeMany(body, ["light","dark","custom-theme"]);
        if (value === "custom") {
            addClass(body, "custom-theme");
            applyCustomThemeFromStorage();
        } else if (value && value !== "system") {
            addClass(body, value);
        }

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

    function applyUnderline(value) {
        if (value === "on") addClass(body, "underline-links");
        else removeClass(body, "underline-links");
    }

    function applyOutline(value) {
        if (value === "on") addClass(body, "text-outline");
        else removeClass(body, "text-outline");
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
    var savedUnderline = lsGet(UNDERLINE_KEY) || "off";
    var savedOutline = lsGet(OUTLINE_KEY) || "off";
    var savedContrast = lsGet(CONTRAST_KEY) || "off";
    var savedTimeFormat = lsGet(TIME_FORMAT_KEY) || "24h";
    var savedCustomBg = normalizeHex(lsGet(CUSTOM_BG_KEY), DEFAULT_CUSTOM.bg);
    var savedCustomBg2 = normalizeHex(lsGet(CUSTOM_BG2_KEY), DEFAULT_CUSTOM.bg2);
    var savedCustomBg3 = normalizeHex(lsGet(CUSTOM_BG3_KEY), DEFAULT_CUSTOM.bg3);
    var savedCustomBg4 = normalizeHex(lsGet(CUSTOM_BG4_KEY), DEFAULT_CUSTOM.bg4);
    var savedCustomBg5 = normalizeHex(lsGet(CUSTOM_BG5_KEY), DEFAULT_CUSTOM.bg5);
    var savedCustomText = normalizeHex(lsGet(CUSTOM_TEXT_KEY), DEFAULT_CUSTOM.text);
    var savedCustomLink = normalizeHex(lsGet(CUSTOM_LINK_KEY), DEFAULT_CUSTOM.link);
    var savedCustomUnderline = normalizeHex(lsGet(CUSTOM_UNDERLINE_KEY), DEFAULT_CUSTOM.underline);
    var savedCustomOutline = normalizeHex(lsGet(CUSTOM_OUTLINE_KEY), DEFAULT_CUSTOM.outline);
    var savedCustomAccent = normalizeHex(lsGet(CUSTOM_ACCENT_KEY), DEFAULT_CUSTOM.accent);
    var savedCustomGradient = (lsGet(CUSTOM_GRADIENT_KEY) || (DEFAULT_CUSTOM.gradient ? "on" : "off")) === "on";
    var savedCustomAngle = clampAngle(lsGet(CUSTOM_ANGLE_KEY) || DEFAULT_CUSTOM.angle);
    var savedCustomMode = lsGet(CUSTOM_GRADIENT_MODE_KEY) || DEFAULT_CUSTOM.mode;
    var savedCustomCount = clampCount(lsGet(CUSTOM_GRADIENT_COUNT_KEY) || DEFAULT_CUSTOM.count);
    var savedCustomStops = lsGet(CUSTOM_GRADIENT_STOPS_KEY);
    if (savedCustomStops === null || savedCustomStops === undefined) savedCustomStops = DEFAULT_CUSTOM.stops;

    applyTheme(savedTheme);
    applyColors(savedColor);
    applyFont(savedFont);
    applyUnderline(savedUnderline);
    applyOutline(savedOutline);
    applyContrast(savedContrast, savedTheme);
    if (savedTheme === "custom") applyCustomThemeFromStorage();

    if (themeSel)    themeSel.value    = savedTheme;
    if (colorSel)    colorSel.value    = savedColor;
    if (fontSel)     fontSel.value     = savedFont;
    if (underlineSel) underlineSel.value = savedUnderline;
    if (outlineSel) outlineSel.value = savedOutline;
    if (contrastSel) contrastSel.value = savedContrast;
    if (timeFormatSel) timeFormatSel.value = savedTimeFormat;
    if (customBgInput) customBgInput.value = savedCustomBg;
    if (customBg2Input) customBg2Input.value = savedCustomBg2;
    if (customBg3Input) customBg3Input.value = savedCustomBg3;
    if (customBg4Input) customBg4Input.value = savedCustomBg4;
    if (customBg5Input) customBg5Input.value = savedCustomBg5;
    if (customTextInput) customTextInput.value = savedCustomText;
    if (customLinkInput) customLinkInput.value = savedCustomLink;
    if (customUnderlineInput) customUnderlineInput.value = savedCustomUnderline;
    if (customOutlineInput) customOutlineInput.value = savedCustomOutline;
    if (customAccentInput) customAccentInput.value = savedCustomAccent;
    if (customGradientInput) customGradientInput.checked = savedCustomGradient;
    if (customAngleInput) customAngleInput.value = savedCustomAngle;
    if (customGradientModeInput) customGradientModeInput.value = savedCustomMode;
    if (customGradientCountInput) customGradientCountInput.value = savedCustomCount;
    if (customGradientStopsInput) customGradientStopsInput.value = savedCustomStops;

    // Initialize time format in time.js if it's loaded
    if (window.setTimeFormat) window.setTimeFormat(savedTimeFormat);

    // ===== EVENT HELPERS (IE8- style) =====
    function onChange(el, fn) {
        if (!el) return;
        if (el.addEventListener) el.addEventListener("change", fn, false);
        else if (el.attachEvent) el.attachEvent("onchange", fn);
        else el.onchange = fn;
    }

    function onClick(el, fn) {
        if (!el) return;
        if (el.addEventListener) el.addEventListener("click", fn, false);
        else if (el.attachEvent) el.attachEvent("onclick", fn);
        else el.onclick = fn;
    }

    function setFieldVisible(el, visible) {
        if (!el || !el.parentNode) return;
        el.parentNode.style.display = visible ? "" : "none";
    }

    function applyGradientModeUI(mode, count) {
        var isAdvanced = mode === "advanced";
        setFieldVisible(customGradientCountInput, !isAdvanced);
        setFieldVisible(customBgInput, !isAdvanced);
        setFieldVisible(customBg2Input, !isAdvanced);
        setFieldVisible(customBg3Input, !isAdvanced && count >= 3);
        setFieldVisible(customBg4Input, !isAdvanced && count >= 4);
        setFieldVisible(customBg5Input, !isAdvanced && count >= 5);
        setFieldVisible(customGradientStopsInput, isAdvanced);
    }

    onChange(themeSel, function(){
        var val = themeSel && themeSel.value ? themeSel.value : "system";
        applyTheme(val);
        lsSet(THEME_KEY, val);
    });

    function updateCustomSetting() {
        var bgVal = customBgInput ? customBgInput.value : DEFAULT_CUSTOM.bg;
        var bg2Val = customBg2Input ? customBg2Input.value : DEFAULT_CUSTOM.bg2;
        var bg3Val = customBg3Input ? customBg3Input.value : DEFAULT_CUSTOM.bg3;
        var bg4Val = customBg4Input ? customBg4Input.value : DEFAULT_CUSTOM.bg4;
        var bg5Val = customBg5Input ? customBg5Input.value : DEFAULT_CUSTOM.bg5;
        var textVal = customTextInput ? customTextInput.value : DEFAULT_CUSTOM.text;
        var linkVal = customLinkInput ? customLinkInput.value : DEFAULT_CUSTOM.link;
        var underlineVal = customUnderlineInput ? customUnderlineInput.value : DEFAULT_CUSTOM.underline;
        var outlineVal = customOutlineInput ? customOutlineInput.value : DEFAULT_CUSTOM.outline;
        var accentVal = customAccentInput ? customAccentInput.value : DEFAULT_CUSTOM.accent;
        var gradientVal = customGradientInput && customGradientInput.checked ? "on" : "off";
        var angleVal = customAngleInput ? customAngleInput.value : DEFAULT_CUSTOM.angle;
        var modeVal = customGradientModeInput ? customGradientModeInput.value : DEFAULT_CUSTOM.mode;
        var countVal = customGradientCountInput ? customGradientCountInput.value : DEFAULT_CUSTOM.count;
        var stopsVal = customGradientStopsInput ? customGradientStopsInput.value : "";
        lsSet(CUSTOM_BG_KEY, bgVal);
        lsSet(CUSTOM_BG2_KEY, bg2Val);
        lsSet(CUSTOM_BG3_KEY, bg3Val);
        lsSet(CUSTOM_BG4_KEY, bg4Val);
        lsSet(CUSTOM_BG5_KEY, bg5Val);
        lsSet(CUSTOM_TEXT_KEY, textVal);
        lsSet(CUSTOM_LINK_KEY, linkVal);
        lsSet(CUSTOM_UNDERLINE_KEY, underlineVal);
        lsSet(CUSTOM_OUTLINE_KEY, outlineVal);
        lsSet(CUSTOM_ACCENT_KEY, accentVal);
        lsSet(CUSTOM_GRADIENT_KEY, gradientVal);
        lsSet(CUSTOM_ANGLE_KEY, angleVal);
        lsSet(CUSTOM_GRADIENT_MODE_KEY, modeVal);
        lsSet(CUSTOM_GRADIENT_COUNT_KEY, countVal);
        lsSet(CUSTOM_GRADIENT_STOPS_KEY, stopsVal);
        applyGradientModeUI(modeVal, clampCount(countVal));
        if ((lsGet(THEME_KEY) || "system") === "custom") {
            applyCustomThemeFromStorage();
            if ((lsGet(CONTRAST_KEY) || "off") === "on") applyContrast("on", "custom");
        }
    }

    onChange(customBgInput, updateCustomSetting);
    onChange(customBg2Input, updateCustomSetting);
    onChange(customBg3Input, updateCustomSetting);
    onChange(customBg4Input, updateCustomSetting);
    onChange(customBg5Input, updateCustomSetting);
    onChange(customTextInput, updateCustomSetting);
    onChange(customLinkInput, updateCustomSetting);
    onChange(customUnderlineInput, updateCustomSetting);
    onChange(customOutlineInput, updateCustomSetting);
    onChange(customAccentInput, updateCustomSetting);
    onChange(customGradientInput, updateCustomSetting);
    onChange(customAngleInput, updateCustomSetting);
    onChange(customGradientModeInput, updateCustomSetting);
    onChange(customGradientCountInput, updateCustomSetting);
    onChange(customGradientStopsInput, updateCustomSetting);

    onClick(customResetBtn, function(){
        if (customBgInput) customBgInput.value = DEFAULT_CUSTOM.bg;
        if (customBg2Input) customBg2Input.value = DEFAULT_CUSTOM.bg2;
        if (customBg3Input) customBg3Input.value = DEFAULT_CUSTOM.bg3;
        if (customBg4Input) customBg4Input.value = DEFAULT_CUSTOM.bg4;
        if (customBg5Input) customBg5Input.value = DEFAULT_CUSTOM.bg5;
        if (customTextInput) customTextInput.value = DEFAULT_CUSTOM.text;
        if (customLinkInput) customLinkInput.value = DEFAULT_CUSTOM.link;
        if (customUnderlineInput) customUnderlineInput.value = DEFAULT_CUSTOM.underline;
        if (customOutlineInput) customOutlineInput.value = DEFAULT_CUSTOM.outline;
        if (customAccentInput) customAccentInput.value = DEFAULT_CUSTOM.accent;
        if (customGradientInput) customGradientInput.checked = !!DEFAULT_CUSTOM.gradient;
        if (customAngleInput) customAngleInput.value = DEFAULT_CUSTOM.angle;
        if (customGradientModeInput) customGradientModeInput.value = DEFAULT_CUSTOM.mode;
        if (customGradientCountInput) customGradientCountInput.value = DEFAULT_CUSTOM.count;
        if (customGradientStopsInput) customGradientStopsInput.value = DEFAULT_CUSTOM.stops;
        updateCustomSetting();
    });

    onClick(customRandomBtn, function(){
        var modeVal = customGradientModeInput ? customGradientModeInput.value : DEFAULT_CUSTOM.mode;
        var countVal = clampCount(customGradientCountInput ? customGradientCountInput.value : DEFAULT_CUSTOM.count);
        var stopCount = countVal < 2 ? 2 : countVal;
        var stopsArr = randomStops(stopCount);
        var stopsStr = stopsArr.join(", ");
        var linkRandom = randomHexColor();

        if (customBgInput) customBgInput.value = stopsArr[0] || randomHexColor();
        if (customBg2Input) customBg2Input.value = stopsArr[1] || randomHexColor();
        if (customBg3Input) customBg3Input.value = stopsArr[2] || randomHexColor();
        if (customBg4Input) customBg4Input.value = stopsArr[3] || randomHexColor();
        if (customBg5Input) customBg5Input.value = stopsArr[4] || randomHexColor();
        if (customTextInput) customTextInput.value = randomHexColor();
        if (customLinkInput) customLinkInput.value = linkRandom;
        if (customUnderlineInput) customUnderlineInput.value = linkRandom;
        if (customOutlineInput) customOutlineInput.value = randomHexColor();
        if (customAccentInput) customAccentInput.value = randomHexColor();
        if (customAngleInput) customAngleInput.value = Math.floor(Math.random() * 361);
        if (customGradientStopsInput && modeVal === "advanced") customGradientStopsInput.value = stopsStr;

        updateCustomSetting();
    });

    applyGradientModeUI(savedCustomMode, savedCustomCount);

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

    onChange(underlineSel, function(){
        var val = underlineSel && underlineSel.value ? underlineSel.value : "off";
        applyUnderline(val);
        lsSet(UNDERLINE_KEY, val);
    });

    onChange(outlineSel, function(){
        var val = outlineSel && outlineSel.value ? outlineSel.value : "off";
        applyOutline(val);
        lsSet(OUTLINE_KEY, val);
    });

    onChange(contrastSel, function(){
        var val = contrastSel && contrastSel.value ? contrastSel.value : "off";
        var themePref = lsGet(THEME_KEY) || "system";
        applyContrast(val, themePref);
        lsSet(CONTRAST_KEY, val);
    });

    onChange(timeFormatSel, function(){
        var val = timeFormatSel && timeFormatSel.value ? timeFormatSel.value : "24h";
        lsSet(TIME_FORMAT_KEY, val);
        // Trigger time format update if available
        if (window.updateTimeFormat) window.updateTimeFormat(val);
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