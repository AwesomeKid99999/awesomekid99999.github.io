if (typeof Intl === "undefined" || !Intl.DateTimeFormat) {
    alert("Your browser is too old to display the live clock. Please upgrade to view times correctly.");
    throw new Error("Intl not supported");
}
// Consistent formatters for both your local time and LA time
const LOCAL_FMT = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",

    timeStyle: "long",
});

const LA_FMT = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "full",
    timeStyle: "long",
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
    const nowMs = getAdjustedNow();
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
    syncServerTime().finally(() => {
        update();
        setInterval(update, 1000);
    });
    setInterval(syncServerTime, 5 * 60 * 1000);
});