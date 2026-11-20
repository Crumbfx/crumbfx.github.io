/* Crumb site sound effects. Everything is synthesized in the browser with Web Audio: no audio files, nothing is sent anywhere.
 * Quiet by design. Browsers only allow sound after the visitor has clicked or pressed a key once, so hover sounds start
 * after the first interaction. A speaker button (bottom right) turns them off; the choice is remembered on this device. */
(function () {
  "use strict";
  var KEY = "crumb.sfx";
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  var on = true;
  try { on = localStorage.getItem(KEY) !== "off"; } catch (e) { /* storage blocked: stay on for this visit */ }
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var ctx = null, master = null, last = 0;

  function unlock() {
    if (!ctx) {
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx.state === "running";
  }

  /* one note: a soft attack, a quick decay, a little lowpass so nothing is harsh */
  function tone(freq, start, dur, peak, type, glideTo) {
    var t = ctx.currentTime + start;
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    f.type = "lowpass"; f.frequency.value = 5200; f.Q.value = 0.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  var jitter = function () { return 1 + (Math.random() - 0.5) * 0.05; };   // a few cents of drift so repeats do not sound robotic

  var sounds = {
    tick:  function () { tone(1180 * jitter(), 0, 0.07, 0.10, "sine"); },                                   // nav links, small things
    soft:  function () { tone(520 * jitter(), 0, 0.11, 0.12, "triangle"); },                                // cards, thumbnails, FAQ rows
    blip:  function () { tone(660 * jitter(), 0, 0.09, 0.12, "sine"); tone(990 * jitter(), 0.05, 0.12, 0.10, "sine"); }, // buttons
    chime: function () { var b = 784 * jitter(); tone(b, 0, 0.22, 0.13, "sine"); tone(b * 1.26, 0.07, 0.22, 0.11, "sine"); tone(b * 1.5, 0.14, 0.3, 0.10, "sine"); }, // download
    pop:   function () { tone(300, 0, 0.09, 0.2, "sine", 120); },                                          // click
    open:  function () { tone(420, 0, 0.12, 0.12, "triangle", 640); },                                      // FAQ opens
    shut:  function () { tone(640, 0, 0.12, 0.10, "triangle", 420); },                                      // FAQ closes
    hello: function () { tone(660, 0, 0.14, 0.12, "sine"); tone(880, 0.08, 0.2, 0.12, "sine"); },           // sound turned on
    mute:  function () { tone(520, 0, 0.12, 0.10, "sine", 330); }
  };

  function play(name) {
    if (!on || !ctx || ctx.state !== "running") return;
    var now = performance.now();
    if (now - last < 45) return;                                   // never a machine-gun burst while the mouse sweeps across things
    last = now;
    try { sounds[name](); } catch (e) { /* audio is optional */ }
  }

  /* which sound belongs to which part of the page */
  var HOVER = [
    ["a[href*='releases/download'], [data-dl-submit]", "chime"],
    [".btn", "blip"],
    ["[data-pill], .brand, .foot-link, .x-tag, .chip", "tick"],
    ["summary, .x-tile, .x-thumb, .x-clip, .com-stat, .x-field", "soft"]
  ];
  function kind(el) {
    for (var i = 0; i < HOVER.length; i++) { var hit = el.closest(HOVER[i][0]); if (hit) return { el: hit, name: HOVER[i][1] }; }
    return null;
  }

  if (canHover) {
    document.addEventListener("mouseover", function (e) {
      var k = kind(e.target);
      if (!k) return;
      var from = e.relatedTarget;
      if (from && k.el.contains(from)) return;                     // moving around inside the same thing: stay quiet
      play(k.name);
    }, { passive: true });
  }

  document.addEventListener("click", function (e) {
    var summary = e.target.closest && e.target.closest("summary");
    if (summary) { var d = summary.parentNode; play(d && d.open ? "open" : "shut"); return; } // state flips right after this event
    var k = kind(e.target);
    if (k && k.name !== "soft") play(k.name === "chime" ? "chime" : "pop");
  }, { passive: true });

  /* the first click, tap or key press is what lets the browser play sound at all */
  function arm() { unlock(); }
  ["pointerdown", "keydown", "touchstart"].forEach(function (n) { document.addEventListener(n, arm, { once: true, passive: true }); });

  /* the speaker button */
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "sfx-toggle"; btn.id = "sfx-toggle";
  var icon = function (muted) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 9.5v5h3.6L12 18.5v-13L7.6 9.5H4z" fill="currentColor" stroke="none"/>' +
      (muted ? '<path d="M16 9.5l5 5M21 9.5l-5 5"/>' : '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>') + "</svg>";
  };
  function paint() {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Sound effects on. Turn off" : "Sound effects off. Turn on");
    btn.title = on ? "Sound effects: on" : "Sound effects: off";
    btn.innerHTML = icon(!on);
    btn.classList.toggle("is-off", !on);
  }
  btn.addEventListener("click", function () {
    unlock();
    on = !on;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) { /* ignore */ }
    paint();
    if (on) { last = 0; play("hello"); } else { var was = on; on = true; play("mute"); on = was; }
  });
  paint();
  document.body.appendChild(btn);
})();
