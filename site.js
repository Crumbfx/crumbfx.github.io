/* Crumb site: settings, scroll reveals, sliding nav pill, the animated panel mock. */
(function () {
  "use strict";
  var cfg = window.CRUMB_SITE || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------- settings -> page */
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  if (cfg.version) each("[data-version]", function (n) { n.textContent = cfg.version; });
  if (cfg.aeVersions) each("[data-ae]", function (n) { n.textContent = cfg.aeVersions; });
  if (cfg.tiktok) each("[data-tiktok]", function (n) { n.href = cfg.tiktok; });
  if (cfg.downloadUrl) each("[data-download]", function (n) { n.href = cfg.downloadUrl; });
  if (cfg.supportUrl) {
    each("[data-support-link]", function (n) { n.href = cfg.supportUrl; });
    each("[data-support-option]", function (n) { n.hidden = false; });
    each("[data-support-feedback]", function (n) { n.hidden = true; });
  }
  if (cfg.discord) each("[data-discord]", function (n) { n.href = cfg.discord; });

  /* ---------------------------------------------------- Discord section: live counts from the public invite; the HTML numbers stay if this fails */
  var com = document.querySelector(".com-card");
  var counted = false; // the count-up runs once, when the card scrolls into view
  function countTo(el, to) {
    var from = parseInt(el.textContent, 10) || 0;
    el.setAttribute("data-count", to);
    if (reduce || !counted || from === to) { el.textContent = to; return; }
    var t0 = null, dur = 1400;
    (function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  function runCounts() { counted = true; each("[data-dc-members], [data-dc-online]", function (n) { n.textContent = "0"; countTo(n, parseInt(n.getAttribute("data-count"), 10) || 0); }); }
  if (com && "IntersectionObserver" in window && !reduce) {
    var cio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { cio.disconnect(); runCounts(); } }, { threshold: 0.35 });
    cio.observe(com);
  } else counted = false;
  var invite = (cfg.discord || "").split("/").pop();
  if (invite) {
    fetch("https://discord.com/api/v10/invites/" + invite + "?with_counts=true")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.guild) return;
        if (d.approximate_member_count) each("[data-dc-members]", function (n) { if (counted) countTo(n, d.approximate_member_count); else { n.setAttribute("data-count", d.approximate_member_count); n.textContent = d.approximate_member_count; } });
        if (d.approximate_presence_count) each("[data-dc-online]", function (n) { if (counted) countTo(n, d.approximate_presence_count); else { n.setAttribute("data-count", d.approximate_presence_count); n.textContent = d.approximate_presence_count; } });
        if (d.guild.icon) each("[data-dc-icon]", function (i) { i.src = "https://cdn.discordapp.com/icons/" + d.guild.id + "/" + d.guild.icon + ".png?size=128"; });
      })
      .catch(function () {});
  }

  /* parallax: the cookie and chips lean toward the pointer */
  var stage = document.querySelector(".com-stage");
  if (stage && com && !reduce && window.matchMedia("(pointer: fine)").matches) {
    com.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      stage.style.setProperty("--mx", Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2))).toFixed(3));
      stage.style.setProperty("--my", Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2))).toFixed(3));
    });
    com.addEventListener("pointerleave", function () { stage.style.setProperty("--mx", 0); stage.style.setProperty("--my", 0); });
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

  /* Use a still until the visitor plays the release recording. Native video
     controls take over during playback and also work when JavaScript is off. */
  var film = document.getElementById("release-film"), playFilm = document.querySelector(".release-play");
  if (film && playFilm && film.canPlayType("video/mp4")) {
    function showFilmPoster() { film.controls = false; playFilm.hidden = false; }
    showFilmPoster();
    playFilm.addEventListener("click", function () {
      playFilm.hidden = true;
      film.controls = true;
      film.focus({ preventScroll: true });
      film.play().catch(function () { film.controls = true; });
    });
    film.addEventListener("ended", function () {
      var wasFocused = document.activeElement === film;
      film.currentTime = 0;
      showFilmPoster();
      if (wasFocused) playFilm.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------- panel mock */
  var mock = document.querySelector(".mock");
  if (!mock) return;
  var tabs = Array.prototype.slice.call(mock.querySelectorAll(".mock-tabs button"));
  var pill = mock.querySelector(".mock-pill"), screens = mock.querySelectorAll(".screen");
  var wave = document.getElementById("mock-wave"), waveTimer, selectedTab = tabs[0];
  var library = mock.querySelector(".m-library"), folder = library.querySelector("select");
  var clips = Array.prototype.slice.call(library.querySelectorAll(".m-lib-strip button"));
  var preview = library.querySelector("figure img");
  var clipCount = library.querySelector(".m-lib-count");
  var selectedClip = clips[0], previewMotion;
  var libraryFilm = document.getElementById("library-film");
  var playClip = library.querySelector(".m-lib-play");
  var playLabel = playClip.querySelector("span");
  var clipMessage = library.querySelector(".m-lib-message");
  var playAttempt = 0;

  function resetClip() {
    playAttempt++;
    libraryFilm.pause();
    if (libraryFilm.readyState) libraryFilm.currentTime = 0;
    libraryFilm.hidden = true;
    playClip.classList.remove("is-playing");
    playLabel.textContent = "Play clip";
  }

  playClip.hidden = !libraryFilm.canPlayType("video/mp4");
  playClip.addEventListener("click", function () {
    if (!libraryFilm.hidden) {
      resetClip();
      return;
    }
    clipMessage.textContent = "";
    var src = selectedClip.dataset.video;
    if (libraryFilm.getAttribute("src") !== src) libraryFilm.src = src;
    libraryFilm.hidden = false;
    playClip.classList.add("is-playing");
    playLabel.textContent = "Stop clip";
    var attempt = ++playAttempt;
    libraryFilm.play().catch(function () {
      if (attempt !== playAttempt) return;
      resetClip();
      clipMessage.textContent = "This preview couldn’t play. Try again.";
    });
  });
  libraryFilm.addEventListener("ended", resetClip);

  function selectClip(clip) {
    resetClip();
    clipMessage.textContent = "";
    selectedClip = clip;
    clips.forEach(function (item) { item.setAttribute("aria-pressed", String(item === clip)); });
    var src = clip.querySelector("img").getAttribute("src");
    if (preview.getAttribute("src") !== src) {
      preview.src = src;
      preview.alt = clip.dataset.description;
      if (previewMotion) previewMotion.cancel();
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && preview.animate)
        previewMotion = preview.animate([{ opacity: 0.65 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    }
    library.querySelector("figcaption strong").textContent = clip.dataset.name;
  }
  clips.forEach(function (clip) {
    clip.addEventListener("click", function () { selectClip(clip); });
  });
  folder.addEventListener("change", function () {
    var visible = clips.filter(function (clip) {
      clip.hidden = folder.value !== "all" && folder.value !== clip.dataset.folder;
      return !clip.hidden;
    });
    if (selectedClip.hidden) selectClip(visible[0]);
    clipCount.textContent = visible.length + (visible.length === 1 ? " clip" : " clips");
  });

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

  function alignPill() {
    pill.style.width = selectedTab.offsetWidth + "px";
    pill.style.transform = "translateX(" + selectedTab.offsetLeft + "px)";
  }
  function show(tab) {
    selectedTab = tab;
    var name = tab.dataset.screen;
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    Array.prototype.forEach.call(screens, function (screen) {
      var on = screen.dataset.screen === name;
      screen.classList.toggle("on", on);
      screen.setAttribute("aria-hidden", String(!on));
    });
    [folder, playClip].concat(clips).forEach(function (control) { control.tabIndex = name === "library" ? 0 : -1; });
    if (name !== "library") resetClip();
    alignPill();
    clearTimeout(waveTimer);
    wave.classList.remove("grown");
    if (name === "beats") waveTimer = setTimeout(function () { wave.classList.add("grown"); }, reduce ? 0 : 120);
  }
  tabs.forEach(function (tab, index) {
    var name = tab.dataset.screen, screen = mock.querySelector('.screen[data-screen="' + name + '"]');
    tab.id = "demo-tab-" + name;
    screen.id = "demo-panel-" + name;
    screen.setAttribute("role", "tabpanel");
    screen.setAttribute("aria-labelledby", tab.id);
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", screen.id);
    tab.addEventListener("click", function () { show(tab); });
    tab.addEventListener("keydown", function (event) {
      var next;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      else return;
      event.preventDefault(); show(tabs[next]); tabs[next].focus();
    });
  });
  show(selectedTab);
  window.addEventListener("resize", alignPill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignPill);
})();

/* real-footage demos: upscale compare slider, dead-frame cut toggle, looping smooth demo */
(function () {
  var cmp = document.querySelector("[data-compare]");
  if (cmp) {
    var range = cmp.querySelector("input");
    var set = function () { cmp.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", set); set();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) {
        if (!e.isIntersecting) return; io.disconnect();
        var t0 = performance.now();
        (function tick(t) { var k = Math.min(1, (t - t0) / 1600); range.value = 50 + 38 * Math.sin(k * Math.PI * 2) * (1 - k); set(); if (k < 1) requestAnimationFrame(tick); else { range.value = 50; set(); } })(t0);
      }); }, { threshold: .6 });
      io.observe(cmp);
    }
  }
  var strip = document.querySelector("[data-strip]"), btn = document.querySelector("[data-cut]");
  if (strip && btn) {
    var note = document.querySelector(".strip-note");
    btn.addEventListener("click", function () {
      var on = strip.classList.toggle("is-cut");
      btn.setAttribute("aria-pressed", on); btn.textContent = on ? "Bring them back" : "Remove repeated frames";
      note.textContent = on ? "12 → 5 frames · 7 repeats cut" : "12 frames · 7 repeats found";
    });
  }
  var vids = document.querySelectorAll(".pair video");
  if ("IntersectionObserver" in window) {
    var vo = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (e.isIntersecting) { e.target.preload = "auto"; e.target.play().catch(function () {}); } else e.target.pause();
    }); }, { threshold: .25 });
    vids.forEach(function (v) { vo.observe(v); });
  }
})();
