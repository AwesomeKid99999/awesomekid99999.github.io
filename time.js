
// ---- server-time sync (modern browsers only) ----
let __anchorServerMs = 0;     // server UTC ms at last sync
let __anchorPerfMs   = 0;     // performance.now() at last sync

function syncServerTime() {
    const url = `/time-ping.txt?nocache=${Math.random()}`;
    const t0 = performance.now();
    return fetch(url, { method: "HEAD", cache: "no-store" })
        .then(res => {
            const dateHdr = res.headers.get("Date");
            if (!dateHdr) throw new Error("No Date header");
            const serverSentMs = Date.parse(dateHdr); // server UTC (approx at send time)
            const t1 = performance.now();
            const rtt = t1 - t0;
            // Estimate server time at response arrival:
            const serverAtArrival = serverSentMs + rtt / 2;
            __anchorServerMs = serverAtArrival;
            __anchorPerfMs = t1;
        });
}

function update() {
    const now = getAdjustedNow();
    setText("your-time", YOUR_FMT.format(now));
    setText("my-time",   MY_FMT.format(now));
    setText("under-construction-since", formatRelative(CREATED_AT_MS));
}

function getAdjustedNow() {
    if (!__anchorServerMs) return new Date(); // before first sync, fall back
    // Monotonic: serverAnchor + (performance.now - anchorPerf)
    const est = __anchorServerMs + (performance.now() - __anchorPerfMs);
    return new Date(est);
}


if (typeof Intl === "undefined" || !Intl.DateTimeFormat) {
  document.addEventListener("DOMContentLoaded", () => {
    const msg = "Your browser is too old to display the live clock. Please upgrade to view local times.";
    const el = document.createElement("div");
    el.style.cssText = "color: red; font-weight: bold; margin: 1em 0;";
    el.textContent = msg;
    document.body.insertBefore(el, document.body.firstChild);
    const yt = document.getElementById("your-time"); if (yt) yt.textContent = msg;
    const mt = document.getElementById("my-time"); if (mt) mt.textContent = msg;
    const uc = document.getElementById("under-construction-since"); if (uc) uc.textContent = msg;
  });
  throw new Error("Intl not supported");
}


const MY_ZONE = "America/Los_Angeles"; // your fixed zone for "my time"
const CREATED_AT_MS = 1757381230000;    // website creation moment (ms since epoch)

const YOUR_FMT = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",

    timeStyle: "long",
});

const MY_FMT = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "full",
    timeStyle: "long",
});
function formatRelative(thenMs) {
  const nowMs = Date.now();
  const diffSec = Math.floor((nowMs - thenMs) / 1000);
  if (diffSec <= 0) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}



document.addEventListener("DOMContentLoaded", () => {
    // initial sync, then start ticking
    syncServerTime().finally(() => {
        update();
        setInterval(update, 1000);
    });
    // resync every 5 minutes to correct drift / network variance
    setInterval(() => {
        syncServerTime().catch(() => {});
    }, 5 * 60 * 1000);
});