(function () {
    var SELECT_ID = "theme";
    var KEY = "theme-preference"; // 'system' | 'light' | 'dark' | 'retro'
    var sel = document.getElementById(SELECT_ID);

    // Apply a theme: clear class for system; otherwise set class
    function applyTheme(name) {
        if (name === "system" || !name) {
            document.body.className = ""; // system = let CSS @media decide
        } else {
            document.body.className = name; // light | dark | retro
        }
    }

    // Load saved preference (if available)
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved) applyTheme(saved);
    if (sel && saved) sel.value = saved;

    // Handle user changes
    if (sel) {
        if (sel.addEventListener) {
            sel.addEventListener("change", onChange, false);
        } else {
            // super-legacy fallback
            sel.onchange = onChange;
        }
    }

    function onChange() {
        var value = sel && sel.value ? sel.value : "system";
        applyTheme(value);
        try { localStorage.setItem(KEY, value); } catch (e) {}
    }

    // Respond to OS theme changes live when preference = system (modern only)
    if (window.matchMedia) {
        var mq = window.matchMedia("(prefers-color-scheme: dark)");
        var handler = function () {
            var current = null;
            try { current = localStorage.getItem(KEY); } catch (e) {}
            if (!current || current === "system") applyTheme("system");
        };
        if (mq.addEventListener) mq.addEventListener("change", handler);
        else if (mq.addListener) mq.addListener(handler); // older WebKit/Safari
    }
})();