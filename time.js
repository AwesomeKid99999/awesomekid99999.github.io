// time.js
// Legacy behavior: show ONLY "Your local time" and an upgrade note for "My local time".
// Modern behavior: show both times (visitor local + LA) with server-time anchoring.

(function(){
  var LEGACY = (typeof Intl === "undefined" || !Intl.DateTimeFormat);

    if (LEGACY) {
        // Simple pad function
        function pad2(n){ return (n < 10 ? "0" : "") + n; }

        function fmtDateTime(d) {
            var yyyy = d.getFullYear();
            var mm = pad2(d.getMonth() + 1);
            var dd = pad2(d.getDate());
            var hh = d.getHours();
            var mi = pad2(d.getMinutes());
            var ss = pad2(d.getSeconds());
            var ampm = "";
            // optional 12h format
            if (hh >= 12) { ampm = " PM"; if (hh > 12) hh -= 12; }
            else { ampm = " AM"; if (hh === 0) hh = 12; }
            return mm + "/" + dd + "/" + yyyy + " " + hh + ":" + mi + ":" + ss + ampm;
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
                "Under construction since: (Relative time unavailable on this browser)");
        }

        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", legacyRender);
        } else if (document.attachEvent) {
            document.attachEvent("onreadystatechange", function(){
                if (document.readyState === "complete") legacyRender();
            });
        }
        window.onload = legacyRender;
        return; // stop here for legacy
    }

  // ===== Modern path below =====
  // Consistent formatters for both your local time and LA time
    const LOCAL_FMT = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    const LA_FMT = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

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

    const yourEl = document.getElementById("your-time");
    if (yourEl) yourEl.textContent = LOCAL_FMT.format(now);

    const myEl = document.getElementById("my-time");
    if (myEl) myEl.textContent = LA_FMT.format(now);
  }

  window.addEventListener("DOMContentLoaded", () => {
      function startClock() {
          update();
          setInterval(update, 1000);
      }

      // If fetch/Promises aren’t available, just start the clock without server sync
      if (!(window.fetch && window.Promise)) {
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
      }, 5 * 60 * 1000);
  });
})();