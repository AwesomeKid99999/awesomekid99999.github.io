(function () {
    // ====== SELECTORS & STORAGE KEYS ======
    const THEME_ID = "theme";
    const COLOR_ID = "display-colors";
    const FONT_ID  = "dyslexia-friendly-font";
    const CONTRAST_ID = "contrast";

    const THEME_KEY = "theme-preference";   // 'system' | 'light' | 'dark'
    const COLOR_KEY = "color-mode";         // 'normal' | 'invert-colors' | 'grayscale'
    const FONT_KEY  = "font-dyslexic";      // 'enabled' | 'disabled'
    const CONTRAST_KEY = "a11y-contrast";   // 'on' | 'off'

    const themeSel = document.getElementById(THEME_ID);
    const colorSel = document.getElementById(COLOR_ID);
    const fontSel  = document.getElementById(FONT_ID);
    const contrastSel = document.getElementById(CONTRAST_ID);

    const body = document.body;

    // --- helpers ---
    const prefersDark = () =>
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    function effectiveTheme(themePref) {
        if (themePref === "light") return "light";
        if (themePref === "dark")  return "dark";
        // system
        return prefersDark() ? "dark" : "light";
    }

    // ====== APPLY FUNCTIONS ======
    function applyTheme(value) {
        body.classList.remove("light","dark");
        if (value && value !== "system") body.classList.add(value);
        // keep HC in sync with theme choice
        const hc = localStorage.getItem(CONTRAST_KEY) || "off";
        if (hc === "on") applyContrast("on", value);
    }

    function applyColors(value) {
        document.documentElement.classList.remove("invert","grayscale");
        if (value === "invert-colors") document.documentElement.classList.add("invert");
        else if (value === "grayscale") document.documentElement.classList.add("grayscale");
    }

    function applyFont(value) {
        body.classList.toggle("font-dyslexic", value === "enabled");
    }

    // value: 'on' | 'off'
    // themePref: 'system' | 'light' | 'dark'  (optional; will read saved if omitted)
    function applyContrast(value, themePref) {
        body.classList.remove("high-contrast","hc-dark","hc-light");
        if (value !== "on") return;

        const pref = themePref ?? (localStorage.getItem(THEME_KEY) || "system");
        const eff = effectiveTheme(pref); // 'light' | 'dark'
        body.classList.add("high-contrast", eff === "dark" ? "hc-dark" : "hc-light");
    }

    // ====== LOAD SAVED SETTINGS ======
    const savedTheme    = localStorage.getItem(THEME_KEY)    || "system";
    const savedColor    = localStorage.getItem(COLOR_KEY)    || "normal";
    const savedFont     = localStorage.getItem(FONT_KEY)     || "disabled";
    const savedContrast = localStorage.getItem(CONTRAST_KEY) || "off";

    applyTheme(savedTheme);
    applyColors(savedColor);
    applyFont(savedFont);
    applyContrast(savedContrast, savedTheme);

    if (themeSel)    themeSel.value    = savedTheme;
    if (colorSel)    colorSel.value    = savedColor;
    if (fontSel)     fontSel.value     = savedFont;
    if (contrastSel) contrastSel.value = savedContrast;

    // ====== EVENT HANDLERS ======
    function handleChange(sel, key, applyFn) {
        const val = sel && sel.value ? sel.value : "";
        applyFn(val);
        try { localStorage.setItem(key, val); } catch {}
    }

    if (themeSel) themeSel.addEventListener("change", () => {
        const val = themeSel.value;
        applyTheme(val);
        try { localStorage.setItem(THEME_KEY, val); } catch {}
    });

    if (colorSel) colorSel.addEventListener("change", () =>
        handleChange(colorSel, COLOR_KEY, applyColors)
    );
    if (fontSel)  fontSel.addEventListener("change", () =>
        handleChange(fontSel,  FONT_KEY,  applyFont)
    );
    if (contrastSel) contrastSel.addEventListener("change", () => {
        const val = contrastSel.value; // 'on' | 'off'
        const themePref = localStorage.getItem(THEME_KEY) || "system";
        applyContrast(val, themePref);
        try { localStorage.setItem(CONTRAST_KEY, val); } catch {}
    });

    // ====== SYSTEM THEME LISTENER ======
    if (window.matchMedia) {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            const themePref = localStorage.getItem(THEME_KEY) || "system";
            if (themePref === "system") {
                applyTheme("system"); // flips body light/dark
                // if HC is on, re-evaluate dark vs light variant
                const hc = localStorage.getItem(CONTRAST_KEY) || "off";
                if (hc === "on") applyContrast("on", "system");
            }
        };
        if (mq.addEventListener) mq.addEventListener("change", handler);
        else if (mq.addListener) mq.addListener(handler); // legacy Safari
    }
})();