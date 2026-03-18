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
        var __legacyShowMilliseconds = false;

        function fmtDateTime(d, includeMilliseconds) {
            var yyyy = d.getFullYear();
            var mm = pad2(d.getMonth() + 1);
            var dd = pad2(d.getDate());
            var hh = d.getHours();
            var mi = pad2(d.getMinutes());
            var ss = pad2(d.getSeconds());
            var ms = ("00" + d.getMilliseconds()).slice(-3);
            
            var timeStr;
            if (__legacyHour12) {
              var h12 = hh % 12 || 12; // 0 becomes 12
              var ampm = hh < 12 ? "AM" : "PM";
              timeStr = pad2(h12) + ":" + mi + ":" + ss;
              if (includeMilliseconds) {
                timeStr += "." + ms;
              }
              timeStr += " " + ampm;
            } else {
              timeStr = pad2(hh) + ":" + mi + ":" + ss;
              if (includeMilliseconds) {
                timeStr += "." + ms;
              }
            }
            
            return WDAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + dd + ", " + yyyy + " at " + timeStr;
        }

        function fmtTimeOnly(d, includeMilliseconds) {
          var hh = d.getHours();
          var mi = pad2(d.getMinutes());
          var ss = pad2(d.getSeconds());
          var ms = ("00" + d.getMilliseconds()).slice(-3);

          if (__legacyHour12) {
            var h12 = hh % 12 || 12;
            var ampm = hh < 12 ? "AM" : "PM";
            var t12 = pad2(h12) + ":" + mi + ":" + ss;
            if (includeMilliseconds) t12 += "." + ms;
            return t12 + " " + ampm;
          }

          var t24 = pad2(hh) + ":" + mi + ":" + ss;
          if (includeMilliseconds) t24 += "." + ms;
          return t24;
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
          setTextLegacy("your-time", "Your local time: " + fmtDateTime(now, false));
            setTextLegacy("my-time", "My local time: (Upgrade your browser to view)");
          setTextLegacy("time-display", fmtTimeOnly(now, __legacyShowMilliseconds));
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
            var legacyStoredMs = localStorage.getItem("time-show-milliseconds");
            if (legacyStoredMs === null) {
                legacyStoredMs = localStorage.getItem("time-show-precision");
            }
            __legacyShowMilliseconds = legacyStoredMs === "true";
        } catch(e) {}
        
        return; // stop here for legacy
    }

  // ===== Modern path below =====
  // Consistent formatters for both your local time and LA time
  let __hour12 = false; // false = 24h, true = 12h
  let __userTimezone = (Intl.DateTimeFormat().resolvedOptions().timeZone || null);
  let __showMilliseconds = false;
  let __clockIntervalId = null;
  let __clockRafId = null;
  let __clockSecondTimeoutId = null;

  function initTimeFormat() {
    try {
      const stored = localStorage.getItem("time-format");
      __hour12 = stored === "12h";
      let storedMilliseconds = localStorage.getItem("time-show-milliseconds");
      if (storedMilliseconds === null) {
        storedMilliseconds = localStorage.getItem("time-show-precision");
      }
      __showMilliseconds = storedMilliseconds === "true";
    } catch (e) {
      __hour12 = false;
      __showMilliseconds = false;
    }
  }

  function detectUserTimezone() {
    // Browser-reported timezone is usually the most accurate for display.
    if (__userTimezone) {
      return Promise.resolve(__userTimezone);
    }

    if (!(window.fetch && window.Promise)) {
      return Promise.resolve(null);
    }

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
    const dateTimeParts = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: __hour12
    };

    const displayTimeParts = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: __hour12
    };

    if (__showMilliseconds) {
      displayTimeParts.fractionalSecondDigits = 3;
    }

    const formatters = {
      LA_FOOTER_FMT: new Intl.DateTimeFormat("en-US", Object.assign({
        timeZone: "America/Los_Angeles"
      }, dateTimeParts))
    };

    // If we have user's timezone, use it; otherwise use browser's local time
    if (__userTimezone) {
      formatters.LOCAL_FOOTER_FMT = new Intl.DateTimeFormat("en-US", Object.assign({
        timeZone: __userTimezone
      }, dateTimeParts));

      formatters.LOCAL_DISPLAY_FMT = new Intl.DateTimeFormat("en-US", Object.assign({
        timeZone: __userTimezone
      }, displayTimeParts));
    } else {
      formatters.LOCAL_FOOTER_FMT = new Intl.DateTimeFormat("en-US", dateTimeParts);
      formatters.LOCAL_DISPLAY_FMT = new Intl.DateTimeFormat("en-US", displayTimeParts);
    }

    return formatters;
  }

  let formatters = createFormatters();

  // Website creation moment (in milliseconds since epoch)
  const CREATED_AT_MS = 1757381230000; // adjust if needed

  let __anchorServerMs = 0;
  let __anchorPerfMs = 0;

  // External UTC sources (NIST-like) before falling back to same-origin Date header.
  const EXTERNAL_TIME_SOURCES = [
    "https://worldtimeapi.org/api/timezone/Etc/UTC",
    "https://timeapi.io/api/Time/current/zone?timeZone=UTC"
  ];

  function parseDateString(value, assumeUtcForNaive) {
    if (typeof value !== "string") return NaN;
    const trimmed = value.trim();
    if (!trimmed) return NaN;

    const hasExplicitZone = /(?:Z|[+\-]\d\d:?\d\d)$/i.test(trimmed);
    const normalized = (!hasExplicitZone && assumeUtcForNaive) ? `${trimmed}Z` : trimmed;
    const parsed = Date.parse(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function extractServerUtcMs(payload, assumeUtcForNaive) {
    if (!payload || typeof payload !== "object") return NaN;

    const candidates = [
      payload.utc_datetime,
      payload.datetime,
      payload.currentDateTime,
      payload.dateTime,
      payload.date
    ];

    for (let i = 0; i < candidates.length; i++) {
      const value = candidates[i];
      const parsed = parseDateString(value, assumeUtcForNaive);
      if (Number.isFinite(parsed)) return parsed;
    }

    if (typeof payload.unixtime === "number") return payload.unixtime * 1000;
    if (typeof payload.unixTime === "number") return payload.unixTime * 1000;
    if (typeof payload.epochTime === "number") return payload.epochTime * 1000;

    return NaN;
  }

  function syncFromExternalSource(url) {
    const t0 = performance.now();
    return fetch(url, { cache: "no-store" })
      .then(res => {
        if (!res.ok) throw new Error(`External time source failed (${res.status})`);
        return res.json();
      })
      .then(data => {
        const serverSentMs = extractServerUtcMs(data, true);
        if (!Number.isFinite(serverSentMs)) {
          throw new Error("External time source returned unsupported payload");
        }
        const t1 = performance.now();
        const rtt = t1 - t0;
        const serverAtArrival = serverSentMs + rtt / 2;
        __anchorServerMs = serverAtArrival;
        __anchorPerfMs = t1;
      });
  }

  function syncFromDateHeader() {
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

    return fetch(url, { method: "HEAD", cache: "no-store" })
      .then(res => handle(res, "HEAD"))
      .catch(() => fetch(url, { method: "GET", cache: "no-store" }).then(res => handle(res, "GET")));
  }

  function syncServerTime() {
    let i = 0;

    function tryNextExternal() {
      if (i >= EXTERNAL_TIME_SOURCES.length) {
        return Promise.reject(new Error("No external time source available"));
      }
      const source = EXTERNAL_TIME_SOURCES[i++];
      return syncFromExternalSource(source).catch(tryNextExternal);
    }

    return tryNextExternal()
      .catch(syncFromDateHeader)
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

    const bigTimeEl = document.getElementById("time-display");
    if (bigTimeEl) bigTimeEl.textContent = formatters.LOCAL_DISPLAY_FMT.format(now);

    const yourEl = document.getElementById("your-time");
    if (yourEl) yourEl.textContent = formatters.LOCAL_FOOTER_FMT.format(now);

    const myEl = document.getElementById("my-time");
    if (myEl) myEl.textContent = formatters.LA_FOOTER_FMT.format(now);

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
    update();
  };

    function bindPrecisionToggle(startClock) {
    const precisionToggle = document.getElementById("show-precision");
    if (!precisionToggle) return;

    precisionToggle.checked = __showMilliseconds;
    precisionToggle.addEventListener("change", function () {
      __showMilliseconds = !!precisionToggle.checked;
      try {
        localStorage.setItem("time-show-milliseconds", String(__showMilliseconds));
      } catch (e) {}

      formatters = createFormatters();
      update();
      startClock();
    });
    }

  window.addEventListener("DOMContentLoaded", () => {
      function startClock() {
        const shouldRunAtMillisecondRate = __showMilliseconds && !!document.getElementById("time-display");
        if (__clockIntervalId) {
          clearInterval(__clockIntervalId);
          __clockIntervalId = null;
        }
        if (__clockRafId) {
          cancelAnimationFrame(__clockRafId);
          __clockRafId = null;
        }
        if (__clockSecondTimeoutId) {
          clearTimeout(__clockSecondTimeoutId);
          __clockSecondTimeoutId = null;
        }

        if (shouldRunAtMillisecondRate && window.requestAnimationFrame) {
          const tick = function () {
            update();
            __clockRafId = requestAnimationFrame(tick);
          };
          tick();
          return;
        }

        update();
        const nowMs = getAdjustedNow().getTime();
        const delayToNextSecond = 1000 - (nowMs % 1000);
        __clockSecondTimeoutId = setTimeout(function () {
          update();
          __clockIntervalId = setInterval(update, 1000);
        }, Math.max(1, delayToNextSecond));
      }

      // Initialize time format from localStorage
      initTimeFormat();
      bindPrecisionToggle(startClock);
      
      // Detect user's timezone from IP, then setup formatters
      function afterTimezoneDetection() {
          formatters = createFormatters();

        // If fetch/Promises aren't available, just start the clock without server sync
        if (!(window.fetch && window.Promise)) {
          startClock();
          return;
        }

        // Start after first sync; start even if sync fails
        syncServerTime()
          .then(() => { update(); startClock(); }, startClock);
      }

      detectUserTimezone().then(afterTimezoneDetection, afterTimezoneDetection);

      // Periodic resync (ignore errors)
      setInterval(function () {
          try {
            syncServerTime()
            .then(() => { update(); startClock(); })
            .catch(function () {
            });
          } catch (e) {
          }
      },   60 * 1000);
  });
})();
