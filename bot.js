/* crumb.bot for the Crumb website: answers install and fix questions, and sends bug reports to the Crumb team.
 * Your question is sent to Crumb's helper server and a free AI service. Nothing is stored in your browser. */
(function () {
  "use strict";
  var API = "https://crumb-studio.de.deplexo.com/api/site";
  var PROMPTS = ["How do I install Crumb?", "ZXP Installer says to sign in to Adobe", "Crumb isn’t in my Extensions menu", "How do I update Crumb?"];
  var history = [], busy = false, cfg = null, key = null;
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }
  var launcher = el("button", {"class": "cb-launcher", type: "button", "aria-haspopup": "dialog", "aria-controls": "cb-panel"});
  var logo = el("img", {src: "assets/crumb-cookie.webp", alt: "", width: "30", height: "30"});
  launcher.append(logo, document.createTextNode("crumb.bot"));
  var panel = el("section", {"class": "cb-panel", id: "cb-panel", role: "dialog", "aria-label": "crumb.bot help", "aria-modal": "false"});
  panel.innerHTML =
    '<header class="cb-head"><img src="assets/crumb-cookie.webp" alt="" width="38" height="38"><div><strong>crumb.bot</strong><small>Install help, fixes and reports</small></div><button type="button" class="cb-close" aria-label="Close crumb.bot">×</button></header>' +
    '<div class="cb-tabs" role="tablist"><button type="button" role="tab" id="cb-t-ask" aria-selected="true" aria-controls="cb-ask">Ask</button><button type="button" role="tab" id="cb-t-report" aria-selected="false" aria-controls="cb-report">Report a problem</button></div>' +
    '<div class="cb-pane" id="cb-ask" role="tabpanel" aria-labelledby="cb-t-ask"><div class="cb-scroll" id="cb-log" aria-live="polite"><p class="cb-intro">Hi, I’m crumb.bot. I can help you download, install and update Crumb, fix problems, or point you to the Discord.</p><div class="cb-prompts" id="cb-prompts"></div></div>' +
    '<p class="cb-fine">I’m an AI helper and can be wrong. Don’t share passwords. Your question is sent to a free AI service.</p><form class="cb-form" id="cb-form"><input id="cb-input" type="text" maxlength="1200" autocomplete="off" placeholder="Ask a question" aria-label="Your question"><button class="cb-send" id="cb-send" type="submit">Send</button></form></div>' +
    '<div class="cb-pane" id="cb-report" role="tabpanel" aria-labelledby="cb-t-report" hidden><form class="cb-scroll" id="cb-rform" novalidate>' +
    '<p class="cb-intro">Something wrong? Tell us and we’ll message you when it’s fixed.</p>' +
    '<label class="cb-field">What went wrong?<textarea id="cb-desc" rows="4" maxlength="1500" placeholder="What did you try, and what happened?"></textarea></label>' +
    '<div class="cb-field">How can we reach you?<small>Add your Discord username, your TikTok username, or both. We only use it to tell you about this report.</small><div class="cb-two"><input id="cb-discord" type="text" maxlength="33" autocomplete="off" spellcheck="false" placeholder="Discord username" aria-label="Discord username"><input id="cb-tiktok" type="text" maxlength="33" autocomplete="off" spellcheck="false" placeholder="TikTok username" aria-label="TikTok username"></div></div>' +
    '<label class="cb-check"><input id="cb-ok" type="checkbox"><span>I’ve read this and want to send it to the Crumb team.</span></label>' +
    '<p class="cb-status" id="cb-rstatus" role="status"></p><button class="cb-primary" id="cb-rsend" type="submit">Send report</button></form></div>';
  document.body.append(launcher, panel);
  var log = $("#cb-log", panel), input = $("#cb-input", panel), send = $("#cb-send", panel), prompts = $("#cb-prompts", panel);
  PROMPTS.forEach(function (text) {
    var b = el("button", {type: "button"}, text);
    b.addEventListener("click", function () { ask(text); });
    prompts.append(b);
  });
  function sectionName() {
    var map = {"new": "features", more: "features", community: "community", download: "download", support: "support", faq: "faq"}, mid = innerHeight * .4, found = "top";
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) { var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) found = map[id]; } });
    return found;
  }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function say(role, text) { var m = el("div", {"class": "cb-msg " + role}, text); log.append(m); scroll(); return m; }
  function linkRow(links) {
    if (!links || !links.length) return;
    var row = el("div", {"class": "cb-links"});
    links.forEach(function (l) { var a = el("a", {href: l.href, target: "_blank", rel: "noopener"}, l.label); row.append(a); });
    log.append(row); scroll();
  }
  async function call(path, body) {
    var res = await fetch(API + path, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body), mode: "cors", credentials: "omit"});
    var data = null; try { data = await res.json(); } catch (e) {}
    if (!res.ok) { var err = new Error(data && data.error && data.error.message || "crumb.bot couldn’t answer right now. Try the Discord."); err.status = res.status; throw err; }
    return data;
  }
  async function ask(text) {
    text = String(text || "").trim();
    if (!text || busy) return;
    busy = true; send.disabled = true; input.value = ""; if (prompts.isConnected) prompts.remove();
    say("user", text);
    var dots = el("div", {"class": "cb-dots", "aria-label": "crumb.bot is typing"}); dots.innerHTML = "<i></i><i></i><i></i>"; log.append(dots); scroll();
    try {
      var data = await call("/chat", {message: text, history: history.slice(-6), page: sectionName(), consent: true});
      dots.remove(); say("bot", data.message); linkRow(data.links);
      history.push({role: "user", content: text}, {role: "assistant", content: data.message}); history = history.slice(-6);
    } catch (error) {
      dots.remove(); say("err", error.message || "crumb.bot couldn’t answer right now.");
      linkRow([{label: "Join the Crumb Discord", href: "https://discord.gg/6KCEgNSDnc"}]);
    } finally { busy = false; send.disabled = false; input.focus(); }
  }
  $("#cb-form", panel).addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });

  // tabs
  function tab(which) {
    var report = which === "report";
    $("#cb-t-ask", panel).setAttribute("aria-selected", String(!report)); $("#cb-t-report", panel).setAttribute("aria-selected", String(report));
    $("#cb-ask", panel).hidden = report; $("#cb-report", panel).hidden = !report;
    (report ? $("#cb-desc", panel) : input).focus();
  }
  $("#cb-t-ask", panel).addEventListener("click", function () { tab("ask"); });
  $("#cb-t-report", panel).addEventListener("click", function () { tab("report"); });

  // reports
  var rstatus = $("#cb-rstatus", panel), rsend = $("#cb-rsend", panel);
  function note(text, kind) { rstatus.textContent = text; rstatus.className = "cb-status" + (kind ? " " + kind : ""); }
  var handle = /^[A-Za-z0-9._]{2,32}$/;
  function clean(v) { return String(v || "").trim().replace(/^@/, ""); }
  $("#cb-rform", panel).addEventListener("submit", async function (e) {
    e.preventDefault();
    if (rsend.disabled) return;
    var desc = $("#cb-desc", panel).value.trim(), d = clean($("#cb-discord", panel).value), t = clean($("#cb-tiktok", panel).value);
    if (desc.length < 10) return note("Describe the problem in at least 10 characters.", "bad");
    if (!d && !t) return note("Add your Discord or TikTok username so we can tell you when it’s fixed.", "bad");
    if ((d && !handle.test(d)) || (t && !handle.test(t))) return note("Usernames can only use letters, numbers, dots and underscores.", "bad");
    if (!$("#cb-ok", panel).checked) return note("Tick the box to confirm you want to send this.", "bad");
    key = key || (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, function () { return (Math.random() * 16 | 0).toString(16); }));
    rsend.disabled = true; note("Sending…");
    try {
      var data = await call("/report", {idempotencyKey: key, description: desc, discord: d || undefined, tiktok: t || undefined, page: sectionName(), consent: true});
      note(data.message + " Reference " + data.reference + ".", data.status === "sent" ? "good" : "bad");
      if (data.status === "sent") { key = null; $("#cb-desc", panel).value = ""; $("#cb-ok", panel).checked = false; }
    } catch (error) { note(error.message, "bad"); }
    finally { rsend.disabled = false; }
  });
  ["#cb-desc", "#cb-discord", "#cb-tiktok"].forEach(function (sel) { $(sel, panel).addEventListener("input", function () { key = null; }); });

  // open / close
  function open() {
    panel.classList.add("open"); launcher.setAttribute("aria-expanded", "true");
    if (!cfg) fetch(API + "/config", {mode: "cors", credentials: "omit"}).then(function (r) { return r.json(); }).then(function (c) {
      cfg = c; if (!c.enabled) { input.disabled = send.disabled = true; input.placeholder = "Chat is offline. Try the Discord."; say("err", "crumb.bot is offline right now. The Crumb Discord can help in the meantime."); linkRow([{label: "Join the Crumb Discord", href: "https://discord.gg/6KCEgNSDnc"}]); }
    }).catch(function () { cfg = {}; });
    setTimeout(function () { input.focus(); }, 60);
  }
  function close() { panel.classList.remove("open"); launcher.setAttribute("aria-expanded", "false"); launcher.focus(); }
  launcher.addEventListener("click", function () { panel.classList.contains("open") ? close() : open(); });
  $(".cb-close", panel).addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("open")) close(); });
  // let other buttons open it: <a href="#help" data-open-bot>
  document.addEventListener("click", function (e) { var t = e.target.closest && e.target.closest("[data-open-bot]"); if (t) { e.preventDefault(); open(); } });
})();
