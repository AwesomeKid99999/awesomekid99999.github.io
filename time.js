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

function formatRelative(thenMs) {
    const nowMs = Date.now();
    const diffSec = Math.floor((nowMs - thenMs) / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
}

function update() {
    const now = new Date();

    const underEl = document.getElementById("under-construction-since");
    if (underEl) underEl.textContent = formatRelative(CREATED_AT_MS);

    const yourEl = document.getElementById("your-time");
    if (yourEl) yourEl.textContent = LOCAL_FMT.format(now);

    const myEl = document.getElementById("my-time");
    if (myEl) myEl.textContent = LA_FMT.format(now);
}

window.addEventListener("DOMContentLoaded", () => {
    update();
    setInterval(update, 1000);
});