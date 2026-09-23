(() => {
  "use strict";

  const scenes = Array.from(document.querySelectorAll(".scene"));
  const progress = document.getElementById("experience-progress");
  const progressBar = progress?.querySelector(".experience-progress__bar");
  const progressLabel = progress?.querySelector(".experience-progress__label");
  const soundToggle = document.getElementById("sound-toggle");
  const lightbox = document.getElementById("photo-lightbox");
  const lightboxImg = lightbox?.querySelector(".photo-lightbox__img");
  const lightboxCaption = lightbox?.querySelector(".photo-lightbox__caption");
  const lightboxClose = lightbox?.querySelector(".photo-lightbox__close");

  const sceneOrder = ["lock","boot","hero","story","chaos","game-intro","game","vault","cake","finale"];
  const sceneLabels = {
    lock:"PRIVATE ARCHIVE", boot:"PREPARING SURPRISE", hero:"HAPPY BIRTHDAY",
    story:"OUR STORY", chaos:"CLASSIFIED FILES", "game-intro":"BONUS LEVEL",
    game:"ESCAPE FROM KIM", vault:"SECRET VAULT", cake:"MAKE A WISH", finale:"FOR SOFIA"
  };

  let audioEnabled = false;
  let audioCtx = null;
  let lastScene = "lock";

  const vibrate = (pattern = 10) => {
    if ("vibrate" in navigator) {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  };

  function ensureAudio() {
    if (!audioEnabled) return null;
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function tone(freq = 520, duration = .08, volume = .025, delay = 0) {
    const ac = ensureAudio();
    if (!ac) return;
    const t = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + .012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration + .02);
  }

  function chime(kind = "tap") {
    if (!audioEnabled) return;
    if (kind === "unlock") {
      tone(440,.12,.022,0); tone(660,.15,.020,.08); tone(880,.2,.018,.16);
    } else if (kind === "finale") {
      tone(523,.18,.018,0); tone(659,.18,.018,.08); tone(784,.26,.018,.16);
    } else {
      tone(620,.055,.012,0);
    }
  }

  const songSheet = document.getElementById("song-sheet");
  const songClose = document.getElementById("song-close");
  const songHide = document.getElementById("song-hide");
  const songStop = document.getElementById("song-stop");
  const palagiPlayer = document.getElementById("palagi-player");
  const palagiEmbed = "https://www.youtube-nocookie.com/embed/v82VtUUGFqk?autoplay=1&playsinline=1&rel=0&enablejsapi=1";
  let palagiLoaded = false;

  function markSongReady(ready) {
    palagiLoaded = ready;
    soundToggle?.classList.toggle("song-ready", ready);
    songSheet?.classList.toggle("song-loaded", ready);
    if (soundToggle) {
      soundToggle.setAttribute("aria-label", ready ? "Open Palagi player" : "Play Palagi");
      soundToggle.querySelector(".sound-toggle__icon").textContent = ready ? "♫" : "♪";
    }
  }

  function ensurePalagiPlayer() {
    if (!palagiPlayer || palagiLoaded) return;
    palagiPlayer.src = palagiEmbed;
    markSongReady(true);
  }

  function openSongSheet() {
    if (!songSheet || !soundToggle) return;
    ensurePalagiPlayer();
    songSheet.classList.add("open");
    songSheet.setAttribute("aria-hidden", "false");
    soundToggle.setAttribute("aria-pressed", "true");
    vibrate(12);
  }

  function hideSongSheet() {
    if (!songSheet || !soundToggle) return;
    songSheet.classList.remove("open");
    songSheet.setAttribute("aria-hidden", "true");
    soundToggle.setAttribute("aria-pressed", "false");
    // Important: do NOT clear iframe src here.
    // Keeping the iframe mounted allows Palagi to continue while scenes change.
  }

  function stopPalagi() {
    if (palagiPlayer) palagiPlayer.src = "";
    markSongReady(false);
    hideSongSheet();
    vibrate([10,30,10]);
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      if (songSheet?.classList.contains("open")) hideSongSheet();
      else openSongSheet();
    });
  }
  songClose?.addEventListener("click", hideSongSheet);
  songHide?.addEventListener("click", hideSongSheet);
  songStop?.addEventListener("click", stopPalagi);

  document.addEventListener("pointerdown", (e) => {
    if (!songSheet?.classList.contains("open")) return;
    if (e.target.closest("#song-sheet") || e.target.closest("#sound-toggle")) return;
    hideSongSheet();
  }, {passive:true});

  function updateSceneChrome() {
    const active = document.querySelector(".scene.active");
    if (!active) return;
    const name = active.dataset.scene || "lock";\n    document.body.dataset.scene = name;
    const idx = Math.max(0, sceneOrder.indexOf(name));
    if (progressBar) progressBar.style.width = `${(idx / (sceneOrder.length - 1)) * 100}%`;
    if (progressLabel) progressLabel.textContent = sceneLabels[name] || "FOR SOFIA";
    progress?.classList.toggle("visible", name !== "lock" && name !== "boot");

    if (name !== lastScene) {
      if (name === "hero") chime("unlock");
      else if (name === "finale") { chime("finale"); vibrate([16,40,16]); }
      else chime("tap");
      lastScene = name;
    }
  }

  const sceneObserver = new MutationObserver(updateSceneChrome);
  scenes.forEach(scene => sceneObserver.observe(scene,{attributes:true,attributeFilter:["class"]}));
  updateSceneChrome();

  document.addEventListener("pointerdown", (e) => {
    const actionable = e.target.closest("button");
    if (!actionable) return;
    vibrate(7);
    const dot = document.createElement("i");
    dot.className = "ripple-dot";
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 600);
  }, {passive:true});

  // Premium ambient backplates for portrait photos, keeping the full image visible.
  document.querySelectorAll(".story-media:not(.phone-frame)").forEach(frame => {
    const img = frame.querySelector("img");
    if (!img) return;
    frame.style.setProperty("--media-bg", `url("${img.getAttribute("src")}")`);
  });

  document.querySelectorAll("img").forEach(img => {
    if (img.closest(".avatar-chip") || img.classList.contains("hero-bg") || img.classList.contains("finale-photo")) return;
    img.classList.add("premium-ready");
    const ready = () => requestAnimationFrame(() => img.classList.add("premium-loaded"));
    if (img.complete) ready(); else img.addEventListener("load",ready,{once:true});
  });

  const zoomableSelector = ".story-media img,.story-collage img,.proposal-stills img,.chaos-card img,.vault-reveal img";
  document.addEventListener("click", e => {
    const img = e.target.closest(zoomableSelector);
    if (!img || !lightbox || !lightboxImg) return;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || "";
    if (lightboxCaption) lightboxCaption.textContent = img.alt || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden","false");
    document.body.classList.add("lightbox-open");
    vibrate(9);
  });

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden","true");
    document.body.classList.remove("lightbox-open");
  }
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
  window.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

  const score = document.getElementById("game-score");
  if (score) {
    let prev = score.textContent;
    new MutationObserver(() => {
      if (score.textContent === prev) return;
      prev = score.textContent;
      const box = score.closest(".score-box");
      box?.classList.remove("score-pulse");
      void box?.offsetWidth;
      box?.classList.add("score-pulse");
      vibrate(11);
      if (audioEnabled) tone(720 + Number(score.textContent || 0) * 45,.07,.013);
    }).observe(score,{childList:true,characterData:true,subtree:true});
  }

  const candles = Array.from(document.querySelectorAll(".candle"));
  if (candles.length) {
    candles.forEach(candle => new MutationObserver(() => {
      if (candle.classList.contains("out")) {
        document.getElementById("scene-cake")?.classList.add("wish-received");
        vibrate(8);
      }
    }).observe(candle,{attributes:true,attributeFilter:["class"]}));
  }

  // Gentle gyroscope/parallax on hero and finale, bounded for comfort.
  let raf = 0;
  window.addEventListener("deviceorientation", e => {
    if (raf || e.gamma == null || e.beta == null) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const active = document.querySelector(".scene.active");
      const img = active?.querySelector(".hero-bg,.finale-photo");
      if (!img || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const x = Math.max(-1,Math.min(1,e.gamma / 35)) * 5;
      const y = Math.max(-1,Math.min(1,(e.beta - 45) / 55)) * 4;
      img.style.translate = `${x}px ${y}px`;
    });
  }, {passive:true});

  // Add a discreet tap-to-view cue to image-heavy cards on touch devices.
  if (matchMedia("(hover:none)").matches) {
    document.querySelectorAll(".chaos-card,.story-media,.story-collage").forEach(el => {
      el.setAttribute("data-touch-photo","true");
    });
  }
})();