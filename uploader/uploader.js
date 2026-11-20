/* Crumb Uploader page: connect TikTok, choose a video, send it to the TikTok inbox. Talks only to the Crumb relay. */
(() => {
  "use strict";
  const RELAY = "https://crumbfx-private-reports.netlify.app/api/tiktok";
  const $ = id => document.getElementById(id);
  const KEY = "crumb.tiktok";
  let blob = ""; try { blob = localStorage.getItem(KEY) || ""; } catch (e) { /* storage blocked: connect each visit */ }
  const save = b => { blob = b || ""; try { b ? localStorage.setItem(KEY, b) : localStorage.removeItem(KEY); } catch (e) { /* ignore */ } };
  const say = (t, bad) => { $("msg").textContent = t; $("msg").className = bad ? "bad" : ""; };

  // Back from TikTok through the relay: the sealed connection (or the reason it failed) arrives in the address after #.
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("tt")) save(h.get("tt"));
  const problem = h.get("tt-error");
  if (location.hash) history.replaceState(null, "", location.pathname);

  async function api(act, body) {
    const res = await fetch(RELAY + "?a=" + act, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({blob, ...body})});
    const data = await res.json().catch(() => ({}));
    if (data.blob) save(data.blob);
    if (!res.ok) { const e = Error(data.error?.message || "Something went wrong. Try again."); e.status = res.status; throw e; }
    return data;
  }

  function show(profile) {
    const on = !!profile;
    $("connect").hidden = on; $("disconnect").hidden = !on;
    $("who").textContent = on ? "Connected as " + profile.displayName + "." : "Log in with TikTok once. Crumb only sees your display name and avatar, and can only put drafts in your inbox.";
    $("send").disabled = !on || !$("file").files[0];
  }
  async function refresh() {
    if (!blob) return show(null);
    try { show(await api("me", {})); } catch (e) { save(""); show(null); say(e.status === 401 ? "Connect TikTok again." : e.message, true); }
  }

  $("connect").addEventListener("click", () => { location.href = RELAY + "?a=start"; });
  $("disconnect").addEventListener("click", async () => { try { await api("revoke", {}); } catch (e) { /* best effort */ } save(""); show(null); say("TikTok disconnected."); });
  $("file").addEventListener("change", () => { $("send").disabled = !blob || !$("file").files[0]; });

  function put(url, headers, body, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest(); x.open("PUT", url);
      for (const [k, v] of Object.entries(headers)) x.setRequestHeader(k, v);
      x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded);
      x.onload = () => resolve(x.status); x.onerror = () => reject(Object.assign(Error("blocked"), {blocked: true}));
      x.send(body);
    });
  }

  $("send").addEventListener("click", async () => {
    const f = $("file").files[0]; if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase(), mime = {mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm"}[ext];
    if (!mime) return say("TikTok accepts MP4, MOV and WebM files.", true);
    $("send").disabled = true; $("bar").hidden = false; $("bar").value = 0; say("Opening an upload with TikTok…");
    try {
      const init = await api("init", {size: f.size, mime});
      say("Sending to TikTok…");
      let direct = true, sent = 0;
      for (let i = 0; i < init.total; i++) {
        const start = i * init.chunkSize, end = i === init.total - 1 ? f.size : start + init.chunkSize, part = f.slice(start, end), base = sent;
        const range = `bytes ${start}-${end - 1}/${f.size}`, progress = n => { $("bar").value = Math.min(0.97, (base + n) / f.size); };
        let done = false;
        if (direct) {
          try { const st = await put(init.uploadUrl, {"Content-Type": mime, "Content-Range": range}, part, progress); if (st >= 200 && st < 300) done = true; else throw Error("TikTok did not accept the video."); }
          catch (e) { if (e.blocked && i === 0) direct = false; else throw e; }   // the browser may not be allowed to talk to TikTok directly: use the relay
        }
        if (!done) {
          const r = await fetch(RELAY + "?a=chunk", {method: "POST", headers: {"X-Upload-Url": init.uploadUrl, "X-Content-Range": range, "X-Mime": mime}, body: part});
          if (!r.ok) throw Error((await r.json().catch(() => ({}))).error?.message || "The upload was interrupted. Try again.");
        }
        sent += part.size;
      }
      $("bar").value = 0.98; say("TikTok is processing it…");
      for (let n = 0; n < 40; n++) {
        const s = await api("status", {publishId: init.publishId});
        if (s.status === "SEND_TO_USER_INBOX") { $("bar").value = 1; say("Sent to your TikTok inbox. Open TikTok on your phone to add a caption and post."); $("send").disabled = false; return; }
        if (s.status === "FAILED") throw Error(s.failReason ? "TikTok could not process this video (" + s.failReason + ")." : "TikTok could not process this video.");
        await new Promise(r => setTimeout(r, 1500));
      }
      say("TikTok is taking a while. Check your TikTok inbox in a few minutes.");
    } catch (e) { say(e.message, true); }
    $("send").disabled = !blob;
  });

  if (problem) say(problem === "denied" ? "TikTok was not connected. You can try again any time." : "Crumb could not connect TikTok. Try again.", true);
  refresh();
})();
