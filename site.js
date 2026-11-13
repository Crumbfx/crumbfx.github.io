/* Crumb site: settings, scroll reveals, sliding nav pill, the animated panel mock. */
(function () {
  "use strict";
  var cfg = window.CRUMB_SITE || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------- settings -> page */
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  if (cfg.price) each("[data-price]", function (n) { n.textContent = cfg.price; });
  if (cfg.version) each("[data-version]", function (n) { n.textContent = cfg.version; });
  if (cfg.aeVersions) each("[data-ae]", function (n) { n.textContent = cfg.aeVersions; });
  if (cfg.tiktok) each("[data-tiktok]", function (n) { n.href = cfg.tiktok; });
  each("[data-checkout]", function (n) {
    if (cfg.checkoutUrl) { n.href = cfg.checkoutUrl; n.target = "_blank"; n.rel = "noopener"; }
    else {
      n.href = "#pricing";
      n.addEventListener("click", function (e) {
        e.preventDefault();
        var note = document.querySelector("[data-checkout-note]");
        if (note) note.textContent = "Checkout opens soon. Follow celo.vfx on TikTok for the launch.";
      });
    }
  });
  if (cfg.discord) each("[data-discord]", function (n) { n.href = cfg.discord; });

  /* ---------------------------------------------------- free-launch window (switches itself off at cfg.launch.endsAt) */
  var L = cfg.launch, endMs = L && Date.parse(L.endsAt);
  function launchActive() { return !!(L && endMs && Date.now() < endMs); }
  var banner = document.getElementById("launch");
  if (banner && launchActive()) {
    banner.hidden = false;
    document.body.classList.add("has-launch");
    each("[data-launch-code], #launch-code", function (n) { n.textContent = L.code; });
    each("[data-launch-ends]", function (n) { n.textContent = new Date(endMs).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); });
    var note = document.getElementById("launch-note"); if (note) note.hidden = false;
    each("[data-buy]", function (n) { if (/Get Crumb/.test(n.textContent) || n.classList.contains("launch-go")) { n.classList.add("is-free"); } });
    each("[data-price]", function (n) { n.classList.add("was-price"); });
    var tEl = document.getElementById("launch-time");
    var pad = function (v) { return v < 10 ? "0" + v : "" + v; };
    (function tick() {
      var left = endMs - Date.now();
      if (left <= 0) { banner.hidden = true; document.body.classList.remove("has-launch"); if (note) note.hidden = true; each("[data-price]", function (n) { n.classList.remove("was-price"); }); return; }
      var h = Math.floor(left / 3600000), m = Math.floor(left / 60000) % 60, s = Math.floor(left / 1000) % 60;
      tEl.textContent = "Ends in " + pad(h) + ":" + pad(m) + ":" + pad(s);
      setTimeout(tick, 1000);
    })();
    var copy = document.getElementById("launch-copy");
    copy.addEventListener("click", function () {
      var done = function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy code"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(L.code).then(done, done);
      else { var t = document.createElement("textarea"); t.value = L.code; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(t); done(); }
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------- reveals */
  each("[data-stagger]", function (list) { Array.prototype.forEach.call(list.children, function (c, i) { c.style.setProperty("--i", Math.min(i, 8)); }); });
  var targets = document.querySelectorAll(".reveal, [data-stagger]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
  } else Array.prototype.forEach.call(targets, function (t) { t.classList.add("in"); });

  /* ---------------------------------------------------- nav: solid on scroll + sliding pill on the current section */
  var nav = document.getElementById("nav"), pills = document.querySelector(".pills"), pillBg = document.querySelector(".pill-bg");
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-pill]"));
  function setPill(a) {
    links.forEach(function (l) { l.classList.toggle("on", l === a); });
    if (!a) { pillBg.style.opacity = "0"; return; }
    pillBg.style.opacity = "1";
    pillBg.style.width = a.offsetWidth + "px";
    pillBg.style.transform = "translateX(" + a.offsetLeft + "px)";
  }
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 8);
    var mid = window.innerHeight * 0.35, current = null;
    links.forEach(function (l) {
      var s = document.querySelector(l.getAttribute("href"));
      if (s) { var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) current = l; }
    });
    setPill(current);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------------------------------------------------- panel mock */
  var mock = document.querySelector(".mock");
  if (!mock) return;
  var tabs = Array.prototype.slice.call(mock.querySelectorAll(".mock-tabs button"));
  var pill = mock.querySelector(".mock-pill"), screens = mock.querySelectorAll(".screen");
  var wave = document.getElementById("mock-wave"), order = ["tools", "beats", "captions", "presets"], idx = 0, timer = null;

  // waveform bars (deterministic pseudo-random so it looks the same every time)
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  for (var i = 0; i < 46; i++) {
    var b = document.createElement("i");
    var beat = i % 4 === 0;
    b.style.height = Math.round((beat ? 70 : 18) + rnd() * (beat ? 26 : 40)) + "%";
    b.style.transitionDelay = (i * 14) + "ms";
    if (beat) b.className = "beat";
    wave.appendChild(b);
  }

  function show(name) {
    tabs.forEach(function (t) { t.classList.toggle("on", t.getAttribute("data-screen") === name); });
    Array.prototype.forEach.call(screens, function (s) { s.classList.toggle("on", s.getAttribute("data-screen") === name); });
    var on = mock.querySelector(".mock-tabs button.on");
    pill.style.width = on.offsetWidth + "px";
    pill.style.transform = "translateX(" + on.offsetLeft + "px)";
    wave.classList.remove("grown");
    if (name === "beats") setTimeout(function () { wave.classList.add("grown"); }, reduce ? 0 : 120);
  }
  function next() { idx = (idx + 1) % order.length; show(order[idx]); }
  function play() { if (!reduce) { clearInterval(timer); timer = setInterval(next, 3400); } }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { idx = order.indexOf(t.getAttribute("data-screen")); show(order[idx]); play(); });
  });
  mock.addEventListener("mouseenter", function () { clearInterval(timer); });
  mock.addEventListener("mouseleave", play);
  show(order[0]);
  play();
  window.addEventListener("resize", function () { show(order[idx]); });
})();
