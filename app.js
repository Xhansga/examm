(() => {
  "use strict";
  const C = window.EXAM_CONFIG, $ = id => document.getElementById(id);
  const KEY = "cbt_state_v1";
  let S = null, running = false, busy = false, lastV = 0, loads = 0, tick = null;

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const screen = id => ["screenLogin", "screenExam", "screenDone"].forEach(s => $(s).hidden = s !== id);
  const pad = n => String(n).padStart(2, "0");

  function send(event, detail) {
    if (!C.logEndpoint || !S) return;
    const body = JSON.stringify({ time: new Date().toISOString(), event, detail: detail || "",
      name: S.name, id: S.id, violations: S.count, ua: navigator.userAgent });
    fetch(C.logEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body }).catch(() => {});
  }

  // ---------- Login ----------
  $("examTitle").textContent = C.title; $("examSchool").textContent = C.school;
  $("maxV").textContent = C.maxViolations; $("dur").textContent = C.durationMinutes;
  $("barTitle").textContent = C.title;

  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!document.documentElement.requestFullscreen) {
      $("loginErr").textContent = "Browser ini tidak mendukung layar penuh. Gunakan Chrome, Edge, atau Firefox di komputer."; return;
    }
    if ($("inToken").value.trim().toUpperCase() !== C.examToken.toUpperCase()) {
      $("loginErr").textContent = "Token salah. Minta token yang benar kepada pengawas."; return;
    }
    S = { name: $("inName").value.trim(), id: $("inId").value.trim(), count: 0, log: [],
      locked: false, finished: false, endAt: Date.now() + C.durationMinutes * 60000 };
    save(); send("start");
    await enterFS(); startExam();
  });

  // ---------- Fullscreen ----------
  async function enterFS() {
    try { await document.documentElement.requestFullscreen({ navigationUI: "hide" }); } catch {}
    try { await navigator.keyboard?.lock?.(["Escape"]); } catch {}
  }

  // ---------- Ujian ----------
  function startExam() {
    screen("screenExam");
    $("barUser").textContent = `${S.name} (${S.id})`;
    const wm = $("watermark"); wm.innerHTML = "";
    for (let i = 0; i < 60; i++) { const s = document.createElement("span"); s.textContent = `${S.name} · ${S.id}`; wm.appendChild(s); }
    const url = C.formUrl + (C.formUrl.includes("?") ? "&" : "?") + "embedded=true";
    const f = document.createElement("iframe");
    // sandbox tanpa allow-popups: form tidak bisa membuka tab baru
    f.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin");
    f.referrerPolicy = "no-referrer"; f.title = "Soal ujian"; f.src = url;
    f.addEventListener("load", () => {
      loads++;
      if (loads >= 2 && C.autoFinishOnSubmit) { send("submitted"); setTimeout(() => finish("Jawaban terkirim."), 1500); }
    });
    $("frameWrap").replaceChildren(f);
    running = true; updateV(); clearInterval(tick); tick = setInterval(onTick, 1000); onTick();
    if (S.locked) lockUI(); else if (!document.fullscreenElement) overlay("Ujian sedang berjalan", "Klik tombol untuk masuk layar penuh dan melanjutkan.", "Lanjutkan ujian");
  }

  function onTick() {
    const left = Math.max(0, S.endAt - Date.now());
    const t = Math.ceil(left / 1000);
    $("timer").textContent = `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t % 3600 / 60))}:${pad(t % 60)}`;
    $("timer").classList.toggle("low", left < 300000);
    if (left <= 0) finish("Waktu habis, jawaban otomatis ditutup.");
    // deteksi alat pengembang (perbedaan ukuran jendela)
    if (running && !S.locked && (outerWidth - innerWidth > 200 || outerHeight - innerHeight > 200) && !document.fullscreenElement === false)
      violation("Alat pengembang terdeteksi");
  }

  function updateV() {
    $("vCount").textContent = `Pelanggaran ${S.count}/${C.maxViolations}`;
    $("vCount").classList.toggle("bad", S.count > 0);
  }

  // ---------- Pelanggaran ----------
  function violation(type) {
    if (!running || !S || S.finished || busy) return;
    S.log.push({ t: new Date().toISOString(), type });
    const now = Date.now();
    if (now - lastV < 2000) { save(); return; }   // satu kejadian = satu hitungan
    lastV = now; S.count++; save(); updateV(); send("violation", type);
    if (S.count >= C.maxViolations) { S.locked = true; save(); lockUI(); }
    else overlay("Peringatan pelanggaran", `${type}. Pelanggaran ${S.count} dari ${C.maxViolations}.`, "Kembali ke ujian");
  }

  function overlay(title, msg, btn) {
    $("ovTitle").textContent = title; $("ovMsg").textContent = msg; $("ovBtn").textContent = btn;
    $("pinBox").hidden = true; $("overlay").hidden = false; $("ovBtn").focus();
  }
  function lockUI() {
    overlay("Layar terkunci", "Batas pelanggaran tercapai. Panggil pengawas untuk membuka kunci.", "Buka kunci");
    $("pinBox").hidden = false; $("pinIn").value = ""; $("pinErr").textContent = "";
  }

  $("ovBtn").addEventListener("click", async () => {
    if (S.locked) {
      if ($("pinIn").value !== C.adminPin) { $("pinErr").textContent = "PIN salah."; return; }
      S.locked = false; S.count = 0; S.log.push({ t: new Date().toISOString(), type: "Dibuka pengawas" });
      save(); updateV(); send("unlocked");
    }
    await enterFS(); $("overlay").hidden = true;
  });

  // ---------- Pendeteksi ----------
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && running && !busy) {
      violation("Keluar dari layar penuh");
      if ($("overlay").hidden) overlay("Layar penuh diperlukan", "Klik tombol untuk kembali ke layar penuh.", "Kembali ke ujian");
    }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) violation("Berpindah tab"); });
  window.addEventListener("blur", () => setTimeout(() => { if (!document.hasFocus()) violation("Berpindah jendela"); }, 150));
  ["contextmenu", "copy", "cut", "paste", "dragstart", "selectstart"].forEach(ev =>
    document.addEventListener(ev, e => { if (running && e.target.tagName !== "INPUT") e.preventDefault(); }));
  document.addEventListener("keydown", e => {
    if (!running) return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    const bad = k === "f12" || k === "printscreen" || k === "f5" || k === "f11" ||
      (mod && ["c", "v", "x", "p", "s", "u", "a", "r", "t", "n", "w", "l", "f"].includes(k)) ||
      (mod && e.shiftKey && ["i", "j", "c", "n", "t"].includes(k)) || (e.altKey && ["arrowleft", "arrowright"].includes(k));
    if (bad) { e.preventDefault(); if (k === "printscreen") navigator.clipboard?.writeText("").catch(() => {}); violation("Pintasan terlarang: " + e.key); }
  }, true);
  window.addEventListener("beforeunload", e => { if (running && !S.finished) { e.preventDefault(); e.returnValue = ""; } });
  history.pushState(null, "", location.href);
  window.addEventListener("popstate", () => history.pushState(null, "", location.href));

  // ---------- Selesai ----------
  function finish(msg) {
    if (!S || S.finished) return;
    S.finished = true; running = false; save(); clearInterval(tick);
    send("finish", `${msg} total log: ${S.log.length}`);
    $("frameWrap").replaceChildren();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    $("doneMsg").textContent = `${msg} Peserta: ${S.name} (${S.id}).`;
    screen("screenDone");
  }
  $("btnFinish").addEventListener("click", () => {
    busy = true;
    const ok = confirm("Yakin ingin menyelesaikan ujian? Pastikan Anda sudah menekan Kirim di Google Form.");
    setTimeout(() => busy = false, 500);
    if (ok) finish("Ujian diselesaikan peserta.");
  });

  // ---------- Pulihkan sesi setelah refresh ----------
  const prev = load();
  if (prev && !prev.finished && prev.endAt > Date.now()) {
    S = prev; running = false; S.log.push({ t: new Date().toISOString(), type: "Halaman dimuat ulang" });
    S.count++; if (S.count >= C.maxViolations) S.locked = true; save(); startExam(); send("reload");
  } else if (prev && prev.finished) {
    S = prev; $("doneMsg").textContent = `Ujian sudah diselesaikan oleh ${S.name} (${S.id}).`; screen("screenDone");
  }
})();
