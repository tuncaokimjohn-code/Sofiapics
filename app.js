(() => {
  "use strict";

  const cfg = window.BIRTHDAY_CONFIG || {};
  const scenes = Array.from(document.querySelectorAll(".scene"));
  let currentScene = "lock";

  const sceneByName = (name) => document.querySelector(`[data-scene="${name}"]`);

  function showScene(name) {
    const next = sceneByName(name);
    const current = sceneByName(currentScene);
    if (!next || next === current) return;
    if (current) {
      current.classList.add("exiting");
      setTimeout(() => {
        current.classList.remove("active", "exiting");
        next.classList.add("active");
        currentScene = name;
        window.scrollTo({ top: 0, behavior: "auto" });
        onSceneEnter(name);
      }, 260);
    } else {
      next.classList.add("active");
      currentScene = name;
      onSceneEnter(name);
    }
  }

  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => showScene(btn.dataset.next));
  });

  const passcodeForm = document.getElementById("passcode-form");
  const passcodeInput = document.getElementById("passcode");
  const passcodeHint = document.getElementById("passcode-hint");
  const passcodeError = document.getElementById("passcode-error");
  passcodeHint.textContent = cfg.passcodeHint || "";

  const heroDate = document.getElementById("hero-date");
  const heroTitle = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const finaleEyebrow = document.getElementById("finale-eyebrow");
  if (heroDate) heroDate.textContent = `FOR ${String(cfg.recipient || "SOFIA").toUpperCase()} • ${String(cfg.birthdayMonthDay || "SEPTEMBER 27").toUpperCase()}`;
  if (heroTitle) heroTitle.innerHTML = `Happy ${cfg.age || 27}th Birthday,<br><em>${escapeHtml(cfg.recipient || "Sofia")}.</em>`;
  if (heroSubtitle) heroSubtitle.textContent = `${cfg.birthdayDate || "September 27, 2026"}. This little corner of the internet exists only because you do.`;
  if (finaleEyebrow) finaleEyebrow.textContent = `HAPPY ${cfg.age || 27}TH BIRTHDAY • ${String(cfg.birthdayMonthDay || "SEPTEMBER 27").toUpperCase()}`;

  passcodeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = passcodeInput.value.trim();
    if (value === String(cfg.passcode || "0610")) {
      passcodeError.textContent = "Access granted. Birthday girl detected. ♡";
      setTimeout(() => showScene("boot"), 500);
    } else {
      const errors = [
        "Nope. Suspicious visitor detected. 😂",
        "Wrong code. Sofia would know this one.",
        "Access denied. Try the beginning of the story.",
      ];
      passcodeError.textContent = errors[Math.floor(Math.random() * errors.length)];
      passcodeInput.select();
    }
  });

  const bootLinesEl = document.getElementById("boot-lines");
  const bootProgress = document.getElementById("boot-progress");
  let bootPlayed = false;

  const bootLines = [
    "IDENTIFYING VISITOR... <span class='ok'>SOFIA DETECTED ✓</span>",
    "RETRIEVING MEMORIES... <span class='ok'>FOUND TOO MANY ✓</span>",
    "CHECKING FIRST MOVE... <span class='ok'>SHE SAID HI FIRST ✓</span>",
    "LOADING EMBARRASSING PHOTOS... <span class='ok'>EXTENSIVE ARCHIVE ✓</span>",
    `VERIFYING BIRTHDAY... <span class='ok'>${cfg.birthdayMonthDay || "SEPTEMBER 27"} ✓</span>`,
    `VERIFYING AGE... <span class='ok'>LEVEL ${cfg.age || 27} UNLOCKED 🎂</span>`,
    `CHECKING ANNIVERSARY... <span class='ok'>${cfg.anniversary || "JULY 08"} SAVED ♡</span>`,
    "PREPARING SURPRISE... <span class='ok'>READY ✓</span>",
  ];

  function runBoot() {
    if (bootPlayed) return;
    bootPlayed = true;
    bootLinesEl.innerHTML = "";
    bootProgress.style.width = "0%";
    bootLines.forEach((line, i) => {
      setTimeout(() => {
        const p = document.createElement("div");
        p.className = "boot-line";
        p.innerHTML = `> ${line}`;
        bootLinesEl.appendChild(p);
        bootProgress.style.width = `${Math.round(((i + 1) / bootLines.length) * 100)}%`;
        if (i === bootLines.length - 1) setTimeout(() => showScene("hero"), 950);
      }, 520 * i);
    });
  }

  // Story carousel
  const storyCards = Array.from(document.querySelectorAll(".story-card"));
  const storyDots = document.getElementById("story-dots");
  const storyIndex = document.getElementById("story-index");
  const storyTotal = document.getElementById("story-total");
  const storyNext = document.getElementById("story-next");
  const storyPrev = document.getElementById("story-prev");
  let storyPos = 0;

  storyTotal.textContent = String(storyCards.length);
  storyCards.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "story-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Go to memory ${i + 1}`);
    dot.addEventListener("click", () => setStory(i));
    storyDots.appendChild(dot);
  });

  function setStory(i) {
    storyPos = Math.max(0, Math.min(storyCards.length - 1, i));
    storyCards.forEach((card, index) => card.classList.toggle("active", index === storyPos));
    Array.from(storyDots.children).forEach((dot, index) => dot.classList.toggle("active", index === storyPos));
    storyIndex.textContent = String(storyPos + 1);
    storyPrev.disabled = storyPos === 0;
    storyPrev.style.opacity = storyPos === 0 ? ".35" : "1";
    storyNext.textContent = storyPos === storyCards.length - 1 ? "Enter classified files" : "Next memory";
  }

  storyPrev.addEventListener("click", () => setStory(storyPos - 1));
  storyNext.addEventListener("click", () => {
    if (storyPos >= storyCards.length - 1) showScene("chaos");
    else setStory(storyPos + 1);
  });
  setStory(0);

  // Game
  const gameCanvas = document.getElementById("game-canvas");
  const gameShell = document.getElementById("game-shell");
  const gameScoreEl = document.getElementById("game-score");
  const gameMessage = document.getElementById("game-message");
  const startGameBtn = document.getElementById("start-game");
  const ctx = gameCanvas.getContext("2d");
  const sofiaImg = new Image();
  const kimImg = new Image();
  sofiaImg.src = "assets/images/game-sofia.webp";
  kimImg.src = "assets/images/game-kim.webp";

  let gameRunning = false;
  let gameAnimation = null;
  let lastTime = 0;
  let gameTime = 0;
  let score = 0;
  let endingTriggered = false;
  let player = null;
  let obstacles = [];

  function resizeCanvas() {
    const rect = gameShell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    gameCanvas.width = Math.max(320, Math.floor(rect.width * dpr));
    gameCanvas.height = Math.max(360, Math.floor(rect.height * dpr));
    gameCanvas.style.width = `${rect.width}px`;
    gameCanvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initGame() {
    resizeCanvas();
    const w = gameShell.clientWidth;
    const h = gameShell.clientHeight;
    const groundY = h - Math.max(58, h * 0.14);
    player = {
      x: Math.max(58, w * 0.12),
      y: groundY - 64,
      size: Math.max(54, Math.min(74, w * 0.075)),
      vy: 0,
      grounded: true,
      rotation: 0,
    };
    const baseX = w + 140;
    const spacing = Math.max(250, w * 0.38);
    obstacles = [0, 1, 2, 3].map((i) => ({
      type: "normal",
      x: baseX + i * spacing,
      size: Math.max(58, Math.min(82, w * 0.085)),
      passed: false,
    }));
    obstacles.push({
      type: "wall",
      x: baseX + 4 * spacing + 150,
      width: Math.max(240, w * 0.36),
      passed: false,
    });
    gameTime = 0;
    score = 0;
    endingTriggered = false;
    gameScoreEl.textContent = "0";
    gameMessage.classList.remove("show");
    gameMessage.innerHTML = "";
    gameRunning = true;
    lastTime = performance.now();
    cancelAnimationFrame(gameAnimation);
    gameAnimation = requestAnimationFrame(gameLoop);
  }

  function jump() {
    if (!gameRunning || !player) return;
    if (player.grounded) {
      const h = gameShell.clientHeight;
      player.vy = -Math.max(650, h * 1.05);
      player.grounded = false;
    }
  }

  function drawCircleImage(image, x, y, size, rotation = 0, border = "#f3b2c2") {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = border;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function circleRectCollision(px, py, pr, rx, ry, rw, rh) {
    const cx = Math.max(rx, Math.min(px, rx + rw));
    const cy = Math.max(ry, Math.min(py, ry + rh));
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy < pr * pr;
  }

  function triggerFinalWall() {
    if (endingTriggered) return;
    endingTriggered = true;
    gameRunning = false;
    gameShell.classList.add("ending");
    gameMessage.innerHTML = `
      <div class="game-result-card">
        <div class="game-result-kicker">ESCAPE FAILED ❤️</div>
        <div class="game-result-title">FINAL SCORE</div>
        <div class="game-result-score">4</div>
        <div class="game-result-label">KIMS AVOIDED</div>
        <div class="game-result-sub">1 KIM ACCEPTED FOREVER</div>
      </div>`;
    gameMessage.classList.add("show");
    setTimeout(() => {
      gameMessage.innerHTML = `
        <div class="game-result-card">
          <div class="game-result-kicker success">UNEXPECTED DATA FOUND</div>
          <div class="game-result-unlocked">SECRET VAULT<span>UNLOCKED</span></div>
        </div>`;
    }, 1900);
    setTimeout(() => showScene("vault"), 3900);
  }

  function gameLoop(now) {
    if (!gameRunning || !player) return;
    const dt = Math.min((now - lastTime) / 1000, 0.03);
    lastTime = now;
    gameTime += dt;

    const w = gameShell.clientWidth;
    const h = gameShell.clientHeight;
    const groundY = h - Math.max(58, h * 0.14);
    const speed = Math.max(260, w * 0.33);

    player.vy += 1700 * dt;
    player.y += player.vy * dt;
    if (player.y + player.size >= groundY) {
      player.y = groundY - player.size;
      player.vy = 0;
      player.grounded = true;
    }
    player.rotation += speed * dt / Math.max(player.size / 2, 1);

    obstacles.forEach((o) => {
      o.x -= speed * dt;
      if (o.type === "normal" && !o.passed && o.x + o.size < player.x) {
        o.passed = true;
        score += 1;
        gameScoreEl.textContent = String(score);
      }
    });

    // Draw background
    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#262a42");
    sky.addColorStop(1, "#10121b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // moving stars / streaks
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#f0d19a";
    for (let i = 0; i < 34; i++) {
      const sx = (i * 97 - (gameTime * 45) % (w + 100)) % (w + 100);
      const sy = 35 + ((i * 61) % Math.max(90, groundY - 100));
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#2e2740";
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = "rgba(255,255,255,.10)";
    for (let x = -((gameTime * speed) % 60); x < w; x += 60) ctx.fillRect(x, groundY + 20, 34, 4);

    // Obstacles
    for (const o of obstacles) {
      if (o.type === "normal") {
        const y = groundY - o.size;
        drawCircleImage(kimImg, o.x, y, o.size, 0, "#ff6d78");
        const pcx = player.x + player.size / 2;
        const pcy = player.y + player.size / 2;
        const hit = circleRectCollision(pcx, pcy, player.size * 0.38, o.x + 8, y + 8, o.size - 16, o.size - 16);
        if (hit) {
          // Secret forgiveness. The first four are intentionally impossible to truly lose on.
          o.passed = true;
          if (score < 4) {
            score = Math.max(score + 1, obstacles.filter(x => x.type === "normal" && x.passed).length);
            gameScoreEl.textContent = String(Math.min(score, 4));
          }
          player.vy = -320;
        }
      } else {
        const wallX = o.x;
        const wallW = o.width;
        const tile = Math.max(62, Math.min(88, w * .085));
        const cols = Math.ceil(wallW / tile);
        const rows = Math.ceil((groundY + tile) / tile);
        ctx.save();
        ctx.beginPath();
        ctx.rect(wallX, 0, wallW, groundY);
        ctx.clip();
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            drawCircleImage(kimImg, wallX + c * tile, groundY - (r + 1) * tile, tile - 4, 0, "#ff6d78");
          }
        }
        ctx.restore();
        ctx.fillStyle = "rgba(255,109,120,.12)";
        ctx.fillRect(wallX, 0, wallW, groundY);

        const pcx = player.x + player.size / 2;
        const pcy = player.y + player.size / 2;
        if (circleRectCollision(pcx, pcy, player.size * .4, wallX, 0, wallW, groundY)) {
          score = 4;
          gameScoreEl.textContent = "4";
          triggerFinalWall();
        }
      }
    }

    drawCircleImage(sofiaImg, player.x, player.y, player.size, player.rotation, "#f0d19a");
    if (gameRunning) gameAnimation = requestAnimationFrame(gameLoop);
  }

  startGameBtn.addEventListener("click", () => {
    showScene("game");
    setTimeout(initGame, 380);
  });
  gameShell.addEventListener("pointerdown", jump);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && currentScene === "game") {
      e.preventDefault();
      jump();
    }
  });
  window.addEventListener("resize", () => {
    if (currentScene === "game") resizeCanvas();
  });

  // Vault
  const vaultPanel = document.getElementById("vault-panel");
  const vaultButtons = Array.from(document.querySelectorAll("[data-vault]"));
  vaultButtons.forEach((btn) => {
    btn.addEventListener("click", () => openVault(btn.dataset.vault));
  });

  function openVault(type) {
    if (type === "childhood") {
      vaultPanel.innerHTML = `
        <div class="vault-reveal">
          <img src="assets/images/childhood-sofia.webp" alt="Sofia as a child" />
          <div>
            <div class="eyebrow">SPECIAL FILE 01</div>
            <h3>One of my favorite photos of you.</h3>
            <p>Every time I look at this photo, I catch myself imagining our future and hoping that one day our little girl might have that same smile.</p>
          </div>
        </div>`;
      return;
    }
    if (type === "letter") {
      const letter = (cfg.letterText || "").trim();
      if (!letter) {
        vaultPanel.innerHTML = `<div class="vault-placeholder"><div class="eyebrow">SEALED FOR NOW</div><h3>${cfg.letterTitle || "One last letter"}</h3><p>Kim is still writing this part. The envelope is already waiting for it.</p></div>`;
      } else {
        vaultPanel.innerHTML = `<div class="vault-reveal"><div style="grid-column:1/-1"><div class="eyebrow">LETTER FROM KIM</div><h3>${cfg.letterTitle || "One last letter"}</h3><p>${escapeHtml(letter)}</p></div></div>`;
      }
      return;
    }
    if (type === "voice") {
      const voice = (cfg.voiceFile || "").trim();
      if (!voice) {
        vaultPanel.innerHTML = `<div class="vault-placeholder"><div class="eyebrow">AUDIO SLOT READY</div><h3>Your voice goes here.</h3><p>The player is wired in. Drop the recording into assets/audio and set voiceFile in config.js.</p></div>`;
      } else {
        vaultPanel.innerHTML = `<div class="vault-reveal"><div style="grid-column:1/-1"><div class="eyebrow">PRESS PLAY</div><h3>A message in my voice.</h3><audio controls style="width:100%" src="${escapeAttr(voice)}"></audio></div></div>`;
      }
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function escapeAttr(value) { return escapeHtml(value); }

  document.getElementById("to-cake").addEventListener("click", () => showScene("cake"));

  // Cake microphone interaction
  const enableMic = document.getElementById("enable-mic");
  const manualBlow = document.getElementById("manual-blow");
  const micStatus = document.getElementById("mic-status");
  const candles = Array.from(document.querySelectorAll(".candle"));
  let candlesOut = false;
  let audioContext = null;
  let micStream = null;
  let micAnimation = null;
  let blowFrames = 0;

  function extinguishCandles() {
    if (candlesOut) return;
    candlesOut = true;
    candles.forEach((candle, i) => setTimeout(() => candle.classList.add("out"), i * 110));
    micStatus.textContent = "Wish received. ♡";
    stopMic();
    setTimeout(() => showScene("finale"), 2300);
  }

  async function startMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      micStatus.textContent = "Microphone is not available here. Use the hold button instead.";
      return;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(micStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = .35;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      micStatus.textContent = "Listening... make your wish, then blow. 💨";
      enableMic.disabled = true;
      enableMic.textContent = "Listening";

      const listen = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        if (rms > .085) blowFrames += 1;
        else blowFrames = Math.max(0, blowFrames - 1);
        if (blowFrames > 5) {
          extinguishCandles();
          return;
        }
        micAnimation = requestAnimationFrame(listen);
      };
      listen();
    } catch (err) {
      micStatus.textContent = "Mic permission was skipped. Hold the button below to blow out the candles.";
    }
  }

  function stopMic() {
    if (micAnimation) cancelAnimationFrame(micAnimation);
    if (micStream) micStream.getTracks().forEach((track) => track.stop());
    if (audioContext && audioContext.state !== "closed") audioContext.close().catch(() => {});
    micAnimation = null;
    micStream = null;
    audioContext = null;
  }

  enableMic.addEventListener("click", startMic);
  let holdTimer = null;
  const startHold = (e) => {
    e.preventDefault();
    if (candlesOut) return;
    manualBlow.textContent = "Keep holding... 💨";
    holdTimer = setTimeout(extinguishCandles, 1100);
  };
  const endHold = () => {
    clearTimeout(holdTimer);
    if (!candlesOut) manualBlow.textContent = "Or hold to blow";
  };
  manualBlow.addEventListener("pointerdown", startHold);
  manualBlow.addEventListener("pointerup", endHold);
  manualBlow.addEventListener("pointerleave", endHold);
  manualBlow.addEventListener("pointercancel", endHold);

  // Finale
  document.getElementById("final-line").textContent = cfg.finalLine || "Thank you for sharing this life with me. I love you.";
  document.getElementById("replay-story").addEventListener("click", () => { setStory(0); showScene("story"); });
  document.getElementById("replay-game").addEventListener("click", () => showScene("game-intro"));

  function makeConfetti() {
    const holder = document.getElementById("confetti");
    holder.innerHTML = "";
    const colors = ["#f1a9ba", "#f0d19a", "#ffffff", "#a897d9", "#ff6d78"];
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${3.8 + Math.random() * 3}s`;
      piece.style.animationDelay = `${Math.random() * 1.4}s`;
      piece.style.setProperty("--drift", `${-100 + Math.random() * 200}px`);
      holder.appendChild(piece);
    }
  }

  function resetCake() {
    candlesOut = false;
    candles.forEach(c => c.classList.remove("out"));
    enableMic.disabled = false;
    enableMic.textContent = "Enable microphone";
    manualBlow.textContent = "Or hold to blow";
    micStatus.textContent = "Microphone access is optional.";
    blowFrames = 0;
  }

  function onSceneEnter(name) {
    if (name === "boot") runBoot();
    if (name === "cake") resetCake();
    if (name === "finale") makeConfetti();
    if (name !== "cake") stopMic();
    if (name !== "game") {
      gameRunning = false;
      if (gameAnimation) cancelAnimationFrame(gameAnimation);
    }
  }

  // Story-level swipe navigation. Inner photo/video carousels own their own
  // horizontal gesture so sliding photos never accidentally changes chapters.
  let touchStartX = 0;
  let touchStartedInMediaRail = false;
  const stage = document.getElementById("story-stage");
  stage.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartedInMediaRail = Boolean(e.target.closest(".story-collage, .proposal-layout"));
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (touchStartedInMediaRail) {
      touchStartedInMediaRail = false;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 55) return;
    if (dx < 0 && storyPos < storyCards.length - 1) setStory(storyPos + 1);
    if (dx > 0 && storyPos > 0) setStory(storyPos - 1);
  }, { passive: true });

})();
