// Legacy-safe time script (ES5 syntax) with progressive enhancement
// Shows: "Your local time" (viewer device) and "My local time" (fixed zone: LA)
// Also updates a relative "under construction since" counter.

// =====================
// Config
// =====================
var MY_ZONE = "America/Los_Angeles"; // fixed zone for "my time"
var CREATED_AT_MS = 1757381230000;    // website creation moment (ms since epoch)

// =====================
// Capability detection
// =====================
function supportsIntlTimeZone() {
  try {
    if (!window.Intl || !Intl.DateTimeFormat) return false;
    // Some old engines accept Intl but ignore timeZone; this throws if unsupported
    new Intl.DateTimeFormat("en-US", { timeZone: "Etc/UTC" }).format(new Date());
    return true;
  } catch (e) {
    return false;
  }
}

// =====================
// Shared helpers
// =====================
function pad2(n){ return (n < 10 ? '0' : '') + n; }

function formatRelative(thenMs) {
  var nowMs = new Date().getTime();
  var diffSec = Math.floor((nowMs - thenMs) / 1000);
  if (diffSec < 60) return diffSec + ' seconds ago';
  if (diffSec < 3600) return Math.floor(diffSec / 60) + ' minutes ago';
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + ' hours ago';
  return Math.floor(diffSec / 86400) + ' days ago';
}

function setText(id, text){
  var el = document.getElementById(id);
  if (el) { el.textContent = text; }
}

// =====================
// Modern path (Intl)
// =====================
var YOUR_FMT = null;
var MY_FMT   = null;

function updateModern(){
  if (!YOUR_FMT) {
    YOUR_FMT = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZoneName: 'short'
    });
  }
  if (!MY_FMT) {
    MY_FMT = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZoneName: 'short',
      timeZone: MY_ZONE
    });
  }
  var now = new Date();
  setText('under-construction-since', formatRelative(CREATED_AT_MS));
  setText('your-time', YOUR_FMT.format(now));
  setText('my-time',   MY_FMT.format(now));
}

// =====================
// Legacy path (no Intl): manual formatting
// =====================
function fmtLegacy(dt, label, abbr){
  return label + ': ' +
         dt.getFullYear() + '-' + pad2(dt.getMonth()+1) + '-' + pad2(dt.getDate()) + ' ' +
         pad2(dt.getHours()) + ':' + pad2(dt.getMinutes()) + ':' + pad2(dt.getSeconds()) +
         (abbr ? (' ' + abbr) : '');
}

function dateWithOffset(now, offsetMin){
  // Convert local to UTC, then add offset
  var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + offsetMin * 60000);
}

// US DST: second Sunday in March to first Sunday in November (current rules)
function usDstActive(utcNow){
  var y = utcNow.getUTCFullYear();
  var m1 = new Date(Date.UTC(y,2,1)); var d1 = m1.getUTCDay();
  var secondSunMar = 1 + ((7 - d1) % 7) + 7; // day of month
  var start = Date.UTC(y,2,secondSunMar,10,0,0); // 10:00 UTC ≈ 2am local
  var m2 = new Date(Date.UTC(y,10,1)); var d2 = m2.getUTCDay();
  var firstSunNov = 1 + ((7 - d2) % 7);
  var end = Date.UTC(y,10,firstSunNov,9,0,0); // 09:00 UTC ≈ 2am local
  var t = utcNow.getTime();
  return t >= start && t < end;
}

function updateLegacy(){
  var now = new Date();
  var utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

  // Under construction (relative)
  setText('under-construction-since', formatRelative(CREATED_AT_MS));

  // Your time: just the device local time
  setText('your-time', fmtLegacy(now, 'Your time', 'Local'));

  // My time: LA with manual DST
  var laDst = usDstActive(utcNow);
  var laOffsetMin = laDst ? -420 : -480; // PDT -7h, PST -8h relative to UTC
  var laAbbr = laDst ? 'PDT' : 'PST';
  var laDate = dateWithOffset(now, laOffsetMin);
  setText('my-time', fmtLegacy(laDate, 'My time', laAbbr));
}

// =====================
// Bootstrap
// =====================
var useModern = false;
try { useModern = supportsIntlTimeZone(); } catch (e) { useModern = false; }

function tick(){
  if (useModern) updateModern(); else updateLegacy();
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('DOMContentLoaded', function(){
    tick();
    setInterval(tick, 1000);
  });
} else {
  // If somehow loaded in a super-legacy environment, try to run anyway
  tick();
  setInterval(tick, 1000);
}