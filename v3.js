/* Crumb site v3: hero reel and the six interactive demos. Every demo works without the others. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  // play videos only while on screen (saves battery and bandwidth)
  function whileVisible(el, on, off) {
    if (!hasIO) { on(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) on(); else off(); }); }, { threshold: 0.2 }).observe(el);
  }

  /* ---------------------------------------------------- hero reel */
  var reel = $(".x-reel");
  if (reel) {
    var tiles = $$("video", reel);
    if (hasIO) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { reel.classList.add("in"); o.disconnect(); } }, { threshold: 0.08 }).observe(reel);
    else reel.classList.add("in");
    if (!reduce) tiles.forEach(function (v) { whileVisible(v, function () { play(v); }, function () { v.pause(); }); });
  }

  /* ---------------------------------------------------- 01 repeated frames */
  var dead = $("[data-dead]");
  if (dead) {
    var dv = $("video", dead), strip = $(".x-strip", dead), tag = $("[data-dead-tag]", dead), readout = $("[data-dead-readout]", dead);
    var FPS = 24000 / 1001, KEEP = [0, 2, 5, 8, 11, 14, 17, 20, 22, 23];
    var isKeep = function (i) { return KEEP.indexOf(i) >= 0; };
    var mode = "orig", btns = [];
    for (var i = 0; i < 24; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = isKeep(i) ? "keep" : "dup";
      b.innerHTML = '<img src="assets/v3/strip/' + (i < 10 ? "0" : "") + i + '.webp" alt="" width="192" height="108">';
      b.setAttribute("aria-label", "Frame " + i + (isKeep(i) ? ", new drawing" : ", repeat"));
      (function (n) { b.addEventListener("click", function () { jump(n); }); })(i);
      strip.appendChild(b); btns.push(b);
    }
    function tc(f) { var s = Math.floor(f / 24); return "00:00:" + (s < 10 ? "0" : "") + s + ":" + (f % 24 < 10 ? "0" : "") + (f % 24); }
    // like the panel: a repeat jumps to where its hold ends (the next new drawing)
    function jump(n) {
      if (mode !== "orig") setMode("orig");
      var target = n, held = 0;
      if (!isKeep(n)) { while (target < 23 && !isKeep(target)) target++; }
      var start = target; while (start > 0 && !isKeep(start - 1)) start--;
      var prev = target - 1; while (prev > 0 && !isKeep(prev)) prev--;
      held = target - prev - 1;
      dv.pause();
      dv.currentTime = (target + 0.5) / FPS;
      btns.forEach(function (x, k) { x.classList.toggle("on", k === target); });
      readout.hidden = false;
      readout.textContent = "Frame " + target + " · " + tc(target) + (n !== target ? " · hold ended" : held ? " · held " + (held + 1) + " frames before" : "");
      clearTimeout(jump.t);
      jump.t = setTimeout(function () { readout.hidden = true; btns.forEach(function (x) { x.classList.remove("on"); }); if (!reduce) play(dv); }, 2600);
    }
    function setMode(m) {
      mode = m;
      $$("[data-dead-mode]", dead).forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-dead-mode") === m)); });
      strip.classList.toggle("cut", m === "cut");
      dv.src = m === "cut" ? dv.getAttribute("data-src-cut") : dv.getAttribute("data-src-orig");
      dv.setAttribute("aria-label", m === "cut" ? "Koe no Katachi, repeats cut by Crumb" : "Koe no Katachi, original");
      tag.textContent = m === "cut" ? "Crumb cut · 2.5 s, 59 frames" : "Original · 5.5 s, 133 frames";
      tag.classList.toggle("hot", m === "cut");
      if (!reduce) play(dv);
    }
    $$("[data-dead-mode]", dead).forEach(function (x) { x.addEventListener("click", function () { setMode(x.getAttribute("data-dead-mode")); }); });
    tag.textContent = "Original · 5.5 s, 133 frames";
    if (!reduce) whileVisible(dv, function () { if (readout.hidden) play(dv); }, function () { dv.pause(); });
  }

  /* ---------------------------------------------------- 02 compare slider */
  var cmp = $("[data-compare]");
  if (cmp) {
    var range = $("input", cmp);
    var set = function () { cmp.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", set); set();
    if (!reduce && hasIO) new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      var t0 = performance.now();
      (function tick(t) { var k = Math.min(1, (t - t0) / 2200); range.value = 50 + 40 * Math.sin(k * Math.PI * 2) * (1 - k); set(); if (k < 1) requestAnimationFrame(tick); else { range.value = 50; set(); } })(t0);
    }, { threshold: 0.6 }).observe(cmp);
  }

  /* ---------------------------------------------------- 03 smooth: both clips start together on every loop */
  var sm = $("[data-smooth]");
  if (sm) {
    var pair = $$("video", sm);
    var restart = function () { pair.forEach(function (v) { v.currentTime = 0; play(v); }); };
    pair[0].addEventListener("ended", restart);
    pair[1].addEventListener("ended", function () { if (pair[0].ended || pair[0].paused) restart(); });
    if (!reduce) whileVisible(sm, restart, function () { pair.forEach(function (v) { v.pause(); }); });
  }

  /* ---------------------------------------------------- 04 clip library */
  var lib = $("[data-lib]");
  if (lib) {
    var clips = $$(".x-clip", lib), status = $(".x-lib-status", lib), current = clips[0];
    clips.forEach(function (c) {
      var img = $("img", c), v = $("video", c);
      $(".x-thumb", c).style.setProperty("--poster", "url(" + img.getAttribute("src") + ")");
      function on() { if (!v) return; if (!v.src) v.src = v.getAttribute("data-src"); c.classList.add("playing"); play(v); }
      function off() { if (!v) return; c.classList.remove("playing"); v.pause(); }
      c.addEventListener("mouseenter", on); c.addEventListener("mouseleave", off);
      c.addEventListener("focus", on); c.addEventListener("blur", off);
      c.addEventListener("click", function () {
        current = c;
        clips.forEach(function (x) { x.setAttribute("aria-pressed", String(x === c)); });
        status.classList.remove("ok");
        status.textContent = c.getAttribute("data-name") + " selected";
        if (!c.classList.contains("playing")) on();
      });
    });
    $$("[data-folder]", $(".x-lib-folders", lib)).forEach(function (f) {
      f.addEventListener("click", function () {
        var want = f.getAttribute("data-folder"), n = 0;
        $$("[data-folder]", $(".x-lib-folders", lib)).forEach(function (x) { x.setAttribute("aria-pressed", String(x === f)); });
        clips.forEach(function (c) { var show = want === "all" || c.getAttribute("data-folder") === want; c.hidden = !show; if (show) n++; });
        status.classList.remove("ok");
        status.textContent = n + " clips · hover to preview";
      });
    });
    var stamps = ["00:00:12:04", "00:00:18:11", "00:00:24:02", "00:00:31:20"], si = 0;
    $("[data-insert]", lib).addEventListener("click", function () {
      if (current.hidden) current = clips.filter(function (c) { return !c.hidden; })[0];
      status.textContent = "✓ Inserted “" + current.getAttribute("data-name") + "” at " + stamps[si++ % stamps.length];
      status.classList.add("ok");
    });
  }

  /* ---------------------------------------------------- 05 themes */
  var th = $("[data-themes]");
  if (th) {
    var frame = $(".x-ae", th), base = $("[data-ae-base]", th), next = $("[data-ae-next]", th), name = $("[data-ae-name]", th);
    var sw = $$("[data-theme]", th);
    sw.forEach(function (b) { var pre = new Image(); pre.src = "assets/v3/ae/" + b.getAttribute("data-theme") + ".webp"; });
    sw.forEach(function (b) {
      b.addEventListener("click", function () {
        var src = "assets/v3/ae/" + b.getAttribute("data-theme") + ".webp";
        sw.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        name.textContent = b.textContent.trim();
        base.alt = "After Effects workspace, " + b.textContent.trim() + " theme";
        if (reduce) { base.src = src; return; }
        next.hidden = false; next.classList.remove("go"); next.src = src;
        next.offsetWidth; // restart the reveal
        next.classList.add("go");
        clearTimeout(b.t);
        b.t = setTimeout(function () { base.src = src; next.hidden = true; next.classList.remove("go"); }, 720);
      });
    });
    $("[data-ae-wall-toggle]", th).addEventListener("change", function (e) { frame.classList.toggle("wall", e.target.checked); });
  }

  /* ---------------------------------------------------- 06 timer: counts while on screen */
  var tm = $("[data-timer]");
  if (tm) {
    var clock = $("[data-timer-clock]", tm), active = $("[data-timer-active]", tm), secs = 1 * 3600 + 24 * 60 + 37, iv = null;
    var two = function (n) { return (n < 10 ? "0" : "") + n; };
    var draw = function () { var t = two(Math.floor(secs / 3600)) + ":" + two(Math.floor(secs / 60) % 60) + ":" + two(secs % 60); clock.textContent = t; active.textContent = t; };
    whileVisible(tm, function () { if (!iv) iv = setInterval(function () { secs++; draw(); }, 1000); }, function () { clearInterval(iv); iv = null; });
  }

  /* ---------------------------------------------------- download form: name + TikTok go to Discord, then the file starts */
  var dlg = $("#dl-form");
  if (dlg && typeof dlg.showModal === "function") {
    var RELAY = "https://crumbfx-private-reports.netlify.app/.netlify/functions/download";
    var cfg = window.CRUMB_SITE || {};
    var form = $("form", dlg), status = $("[data-dl-status]", dlg), submit = $("[data-dl-submit]", dlg), again = $(".x-again", dlg);
    var fileUrl = function () { return cfg.downloadUrl || again.href; };
    var remembered = function (k, v) { try { if (v === undefined) return localStorage.getItem("crumb.dl." + k) || ""; localStorage.setItem("crumb.dl." + k, v); } catch (e) { return ""; } };
    function start() {
      // counts a started download as an event; nothing about the person is sent
      try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "download-" + (cfg.version || "latest"), title: "Download", event: true }); } catch (e) {}
      var a =document.createElement("a"); a.href = fileUrl(); a.rel = "noopener"; a.download = ""; document.body.appendChild(a); a.click(); a.remove();
    }
    // every download button on the page opens the form; without JavaScript they still link straight to the file
    $$("[data-download]").forEach(function (b) {
      if (dlg.contains(b)) return;
      b.addEventListener("click", function (e) {
        e.preventDefault();
        status.textContent = ""; status.className = "x-status"; again.hidden = true; submit.disabled = false;
        $$(".x-field", form).forEach(function (f) { f.classList.remove("bad"); $(".x-err", f).hidden = true; });
        form.elements.name.value = remembered("name"); form.elements.tiktok.value = remembered("tiktok");
        dlg.showModal();
        (form.elements.name.value ? form.elements.tiktok : form.elements.name).focus();
      });
    });
    $("[data-dl-close]", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    function bad(field, on) { var f = form.elements[field].closest(".x-field"); f.classList.toggle("bad", on); $(".x-err", f).hidden = !on; }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim(), tiktok = form.elements.tiktok.value.trim();
      var shortTikTok = tiktok.replace(/^@/, "").length < 2;
      bad("name", !name); bad("tiktok", shortTikTok);
      if (!name || shortTikTok) { (!name ? form.elements.name : form.elements.tiktok).focus(); return; }
      submit.disabled = true; status.className = "x-status"; status.textContent = "Sending…";
      var done = function (ok, why) {
        remembered("name", name); remembered("tiktok", tiktok);
        if (!ok && (why === "name" || why === "tiktok")) { bad(why, true); submit.disabled = false; status.textContent = ""; form.elements[why].focus(); return; }
        // If our message service is down the person still gets the file. Nobody is locked out.
        status.className = "x-status" + (ok ? "" : " warn");
        status.textContent = ok ? "Thanks " + name + "! Your download is starting." : "Your download is starting.";
        start(); again.hidden = false; submit.disabled = false;
        setTimeout(function () { if (dlg.open) dlg.close(); }, 3200);
      };
      var ctl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
      fetch(RELAY, { method: "POST", headers: { "content-type": "application/json" }, signal: ctl ? ctl.signal : undefined,
        body: JSON.stringify({ name: name, tiktok: tiktok, website: form.elements.website.value, version: cfg.version || "" }) })
        .then(function (r) { clearTimeout(timer); return r.json().catch(function () { return {}; }).then(function (b) { return { status: r.status, body: b }; }); })
        .then(function (r) { if (r.status === 400) done(false, r.body.error); else done(r.status === 200); })
        .catch(function () { clearTimeout(timer); done(false); });
    });
  }
})();
