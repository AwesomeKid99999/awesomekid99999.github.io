// time.js
// Legacy behavior: show ONLY "Your local time" and an upgrade note for "My local time".
// Modern behavior: show both times (visitor local + LA) with server-time anchoring.

(function(){
  var LEGACY = (typeof Intl === "undefined" || !Intl.DateTimeFormat);

    if (LEGACY) {
        // Simple pad function
        function pad2(n){ return (n < 10 ? "0" : "") + n; }
        var WDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        
        var __legacyHour12 = false; // false = 24h, true = 12h

        function fmtDateTime(d) {
            var yyyy = d.getFullYear();
            var mm = pad2(d.getMonth() + 1);
            var dd = pad2(d.getDate());
            var hh = d.getHours();
            var mi = pad2(d.getMinutes());
            var ss = pad2(d.getSeconds());
            
            var timeStr;
            if (__legacyHour12) {
              var h12 = hh % 12 || 12; // 0 becomes 12
              var ampm = hh < 12 ? "AM" : "PM";
              timeStr = pad2(h12) + ":" + mi + ":" + ss + " " + ampm;
            } else {
              timeStr = pad2(hh) + ":" + mi + ":" + ss;
            }
            
            return WDAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + dd + ", " + yyyy + " at " + timeStr;
        }

        function setTextLegacy(id, text){
            var el = document.getElementById(id);
            if (!el) return;
            if ("textContent" in el) el.textContent = text;
            else if ("innerText" in el) el.innerText = text;
            else el.innerHTML = text;
        }

        function legacyRender(){
            var now = new Date();
            setTextLegacy("your-time", "Your local time: " + fmtDateTime(now));
            setTextLegacy("my-time", "My local time: (Upgrade your browser to view)");
            setTextLegacy("under-construction-since",
                "UNDER CONSTRUCTION SINCE (Relative time unavailable on this browser)");
            setTextLegacy("last-updated-since",
                "Last updated since (Relative time unavailable on this browser)");
            setTextLegacy("copyright-year", now.getFullYear());
        }

        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", legacyRender);
        } else if (document.attachEvent) {
            document.attachEvent("onreadystatechange", function(){
                if (document.readyState === "complete") legacyRender();
            });
        }
        window.onload = legacyRender;
        
        // Legacy support for time format toggle
        window.setTimeFormat = function(format) {
            __legacyHour12 = format === "12h";
            legacyRender();
        };
        
        window.updateTimeFormat = function(format) {
            __legacyHour12 = format === "12h";
            legacyRender();
        };
        
        // Initialize from localStorage on load
        try {
            var stored = localStorage.getItem("time-format");
            if (stored === "12h") {
                __legacyHour12 = true;
            }
        } catch(e) {}
        
        return; // stop here for legacy
    }

  // ===== Modern path below =====
  // Consistent formatters for both your local time and LA time
  let __hour12 = false; // false = 24h, true = 12h
  let __userTimezone = null; // will be set from IP geolocation

  function initTimeFormat() {
    try {
      const stored = localStorage.getItem("time-format");
      __hour12 = stored === "12h";
    } catch (e) {
      __hour12 = false;
    }
  }

  function detectUserTimezone() {
    return fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        __userTimezone = data.timezone || null;
        return __userTimezone;
      })
      .catch(err => {
        console.warn("Failed to detect timezone from IP:", err);
        return null;
      });
  }

  function createFormatters() {
    const formatters = {
      LA_FMT: new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: __hour12
      })
    };

    // If we have user's timezone, use it; otherwise use browser's local time
    if (__userTimezone) {
      formatters.LOCAL_FMT = new Intl.DateTimeFormat("en-US", {
        timeZone: __userTimezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: __hour12
      });
    } else {
      formatters.LOCAL_FMT = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: __hour12
      });
    }

    return formatters;
  }

  let formatters = createFormatters();

  // Website creation moment (in milliseconds since epoch)
  const CREATED_AT_MS = 1757381230000; // adjust if needed

  let __anchorServerMs = 0;
  let __anchorPerfMs = 0;

  function syncServerTime() {
    const url = `/time-ping.txt?nocache=${Math.random()}`;
    const t0 = performance.now();

    function handle(res, note) {
      const dateHdr = res.headers.get("Date");
      if (!dateHdr) throw new Error(`No Date header (${note})`);
      const serverSentMs = Date.parse(dateHdr);
      const t1 = performance.now();
      const rtt = t1 - t0;
      const serverAtArrival = serverSentMs + rtt / 2;
      __anchorServerMs = serverAtArrival;
      __anchorPerfMs = t1;
    }

    // try HEAD first, then GET
    return fetch(url, { method: "HEAD", cache: "no-store" })
      .then(res => handle(res, "HEAD"))
      .catch(() => fetch(url, { method: "GET", cache: "no-store" }).then(res => handle(res, "GET")))
      .catch(err => console.error("Time sync failed:", err));
  }

  function getAdjustedNow() {
    if (!__anchorServerMs) return new Date();
    const est = __anchorServerMs + (performance.now() - __anchorPerfMs);
    return new Date(est);
  }

  function formatRelative(thenMs) {
    const nowMs = getAdjustedNow().getTime(); // fixed: use ms number
    const diffSec = Math.floor((nowMs - thenMs) / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  }

  function update() {
    const now = getAdjustedNow();

    const underEl = document.getElementById("under-construction-since");
    if (underEl) underEl.textContent = formatRelative(CREATED_AT_MS);

    const updatedEl = document.getElementById("last-updated-since");
    if (updatedEl) updatedEl.textContent = document.lastModified;

    const yourEl = document.getElementById("your-time");
    if (yourEl) yourEl.textContent = formatters.LOCAL_FMT.format(now);

    const myEl = document.getElementById("my-time");
    if (myEl) myEl.textContent = formatters.LA_FMT.format(now);

    const copyrightEl = document.getElementById("copyright-year");
    if (copyrightEl) copyrightEl.textContent = now.getFullYear();
  }
  window.updateTimeFormat = function(format) {
    __hour12 = format === "12h";
    formatters = createFormatters();
    update();
  };

  window.setTimeFormat = function(format) {
    __hour12 = format === "12h";
    formatters = createFormatters();
  };

  window.addEventListener("DOMContentLoaded", () => {
      function startClock() {
          update();
          setInterval(update, 1000);
      }

      // Initialize time format from localStorage
      initTimeFormat();
      
      // Detect user's timezone from IP, then setup formatters
      detectUserTimezone().then(() => {
          formatters = createFormatters();
          startClock();
      }).catch(() => {
          // Fallback: just start without timezone detection
          formatters = createFormatters();
          startClock();
      });

      // If fetch/Promises aren't available, just start the clock without server sync
      if (!(window.fetch && window.Promise)) {
          formatters = createFormatters();
          startClock();
          return;
      }

      // Start after first sync; start even if sync fails
      syncServerTime()
          .then(startClock, startClock);

      // Periodic resync (ignore errors)
      setInterval(function () {
          try {
              syncServerTime().catch(function () {
              });
          } catch (e) {
          }
      },   60 * 1000);
  });
})();
