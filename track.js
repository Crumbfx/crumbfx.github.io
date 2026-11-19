/* Crumb's own visit counter. No cookies, no IP address stored, nothing that identifies a person.
 * Sends small events (a visit, which sections were reached, button clicks) to Crumb's private stats page.
 * Skipped when the browser says Do Not Track / Global Privacy Control, or when you visit ?notrack once to exclude yourself. */
(function () {
  "use strict";
  var URL = "https://crumbfx-private-reports.netlify.app/.netlify/functions/hit";
  try {
    if (/[?&]notrack\b/.test(location.search)) localStorage.setItem("crumb.notrack", "1");
    if (/[?&]track\b/.test(location.search)) localStorage.removeItem("crumb.notrack");
    if (localStorage.getItem("crumb.notrack")) return;
  } catch (e) {}
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl || !/^https:/.test(location.protocol)) return;

  function send(e, extra) {
    var body = { e: e }; for (var k in extra) body[k] = extra[k];
    try { fetch(URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true, mode: "cors", credentials: "omit" }).catch(function () {}); } catch (x) {}
  }
  var ref = ""; try { ref = document.referrer ? new window.URL(document.referrer).hostname : ""; } catch (e) {}
  send("view", { r: ref, w: window.innerWidth });
  window.crumbTrack = send;

  // which sections people actually reach, once each
  if ("IntersectionObserver" in window) {
    var seen = {}, io = new IntersectionObserver(function (list) {
      list.forEach(function (en) { if (en.isIntersecting && !seen[en.target.id]) { seen[en.target.id] = 1; send("sec", { s: en.target.id }); } });
    }, { threshold: 0.35 });
    ["new", "more", "community", "download", "support", "faq"].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }
  // clicks that matter
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest && ev.target.closest("[data-download],[data-support-link],[data-discord],[data-tiktok]");
    if (!t) return;
    if (t.hasAttribute("data-support-link")) send("support", {});
    else if (t.hasAttribute("data-discord")) send("discord", {});
    else if (t.hasAttribute("data-tiktok")) send("tiktok", {});
    else if (t.hasAttribute("data-download") && !t.closest("dialog")) send("dlopen", {});
  }, true);
})();
