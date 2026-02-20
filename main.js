/* ============================================================
   VANGUARD 2026 — PRODUCTION BUILD
   Geometry Dash–style launcher + studio + garage + leaderboard
   Fully localStorage powered
   ============================================================ */

/* ------------------------------------------------------------
   STORAGE KEYS + DEFAULTS
------------------------------------------------------------ */

const STORAGE = {
  PROGRESS: "vanguard_progress",
  LEADERBOARD: "vanguard_leaderboard",
  CUSTOM: "vanguard_custom_levels",
};

const DEFAULT_PROGRESS = {
  completed: [],
  best: {},
  attempts: {},
  selectedLevel: null,
  icon: 0,
  face: 0,
};

const NUM_LEVELS = 30;
const NUM_ICONS = 10;
const NUM_FACES = 10;

/* ------------------------------------------------------------
   LOAD / SAVE HELPERS
------------------------------------------------------------ */

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let progress = load(STORAGE.PROGRESS, DEFAULT_PROGRESS);
let leaderboard = load(STORAGE.LEADERBOARD, []);
let customLevels = load(STORAGE.CUSTOM, []);

/* ------------------------------------------------------------
   LEVEL GENERATION
------------------------------------------------------------ */

let levels = [];

function generateBuiltinLevels() {
  const arr = [];
  for (let i = 1; i <= NUM_LEVELS; i++) {
    const spikes = [];
    for (let x = 8; x < 60; x += 5 + (i % 3)) {
      if ((x + i) % 4 === 0) spikes.push({ x });
    }
    arr.push({
      id: "L" + i,
      name: "Level " + i,
      difficulty: i <= 10 ? "Easy" : i <= 20 ? "Normal" : "Hard",
      type: "builtin",
      data: {
        bg: "#020617",
        ground: "#111827",
        spikes,
        winText: "Level " + i + " Complete!",
      },
    });
  }
  return arr;
}

function rebuildLevels() {
  levels = [...generateBuiltinLevels(), ...customLevels];
}

/* ------------------------------------------------------------
   INITIALIZATION
------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  rebuildLevels();
  initNavigation();
  renderLevels();
  renderGarage();
  renderLeaderboard();
  updateLaunchInfo();
  initStudio();
});

/* ------------------------------------------------------------
   NAVIGATION
------------------------------------------------------------ */

function initNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const id = btn.dataset.view;
      views.forEach((v) => v.classList.remove("active"));
      document.getElementById("view-" + id).classList.add("active");
    });
  });

  document.getElementById("export-progress").onclick = exportProgress;
  document.getElementById("import-progress").onchange = importProgress;
  document.getElementById("play-btn").onclick = () => {
    if (progress.selectedLevel) startGame(progress.selectedLevel);
  };
}

/* ------------------------------------------------------------
   LEVELS LIST
------------------------------------------------------------ */

function renderLevels() {
  const container = document.getElementById("levels-list");
  container.innerHTML = "";

  levels.forEach((lvl) => {
    const card = document.createElement("div");
    card.className = "card";
    if (lvl.id === progress.selectedLevel) card.classList.add("selected");

    card.innerHTML = `
      <div class="card-title">${lvl.name}${lvl.type === "custom" ? " • Custom" : ""}</div>
      <div class="card-meta">
        ${lvl.difficulty} • Best: ${progress.best[lvl.id] || 0}%
      </div>
    `;

    card.onclick = () => {
      progress.selectedLevel = lvl.id;
      save(STORAGE.PROGRESS, progress);
      renderLevels();
      updateLaunchInfo();
    };

    container.appendChild(card);
  });
}

/* ------------------------------------------------------------
   GARAGE
------------------------------------------------------------ */

function renderGarage() {
  const icons = document.getElementById("icon-list");
  const faces = document.getElementById("face-list");
  icons.innerHTML = "";
  faces.innerHTML = "";

  for (let i = 0; i < NUM_ICONS; i++) {
    const card = document.createElement("div");
    card.className = "card";
    if (i === progress.icon) card.classList.add("selected");
    card.innerHTML = `<div class="card-title">Icon ${i + 1}</div>`;
    card.onclick = () => {
      progress.icon = i;
      save(STORAGE.PROGRESS, progress);
      renderGarage();
      drawGaragePreview();
    };
    icons.appendChild(card);
  }

  for (let i = 0; i < NUM_FACES; i++) {
    const card = document.createElement("div");
    card.className = "card";
    if (i === progress.face) card.classList.add("selected");
    card.innerHTML = `<div class="card-title">Face ${i + 1}</div>`;
    card.onclick = () => {
      progress.face = i;
      save(STORAGE.PROGRESS, progress);
      renderGarage();
      drawGaragePreview();
    };
    faces.appendChild(card);
  }

  drawGaragePreview();
}

function drawGaragePreview() {
  const c = document.getElementById("garage-preview");
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, c.width, c.height);

  const size = 50;
  const x = c.width / 2 - size / 2;
  const y = c.height / 2 - size / 2;

  const hue = (progress.icon / NUM_ICONS) * 360;
  ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.beginPath();

  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.moveTo(cx - 10, cy - 8);
  ctx.lineTo(cx - 10, cy - 4);
  ctx.moveTo(cx + 10, cy - 8);
  ctx.lineTo(cx + 10, cy - 4);

  const m = progress.face % 3;
  if (m === 0) {
    ctx.moveTo(cx - 12, cy + 10);
    ctx.lineTo(cx + 12, cy + 10);
  } else if (m === 1) {
    ctx.moveTo(cx - 12, cy + 8);
    ctx.quadraticCurveTo(cx, cy + 16, cx + 12, cy + 8);
  } else {
    ctx.moveTo(cx - 12, cy + 12);
    ctx.quadraticCurveTo(cx, cy + 4, cx + 12, cy + 12);
  }

  ctx.stroke();
}

/* ------------------------------------------------------------
   LEADERBOARD
------------------------------------------------------------ */

function renderLeaderboard() {
  const tbody = document.querySelector("#leaderboard-table tbody");
  tbody.innerHTML = "";

  leaderboard.forEach((entry, i) => {
    const tr = document.createElement("tr");
    const best = Math.max(0, ...Object.values(entry.best || {}));

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${new Date(entry.timestamp).toLocaleString()}</td>
      <td>${entry.completed.length}</td>
      <td>${best}</td>
    `;

    tbody.appendChild(tr);
  });
}

function exportProgress() {
  const snapshot = { ...progress, timestamp: Date.now() };
  leaderboard.push(snapshot);
  save(STORAGE.LEADERBOARD, leaderboard);
  renderLeaderboard();

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vanguard-progress.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      leaderboard.push({ ...data, timestamp: Date.now() });
      save(STORAGE.LEADERBOARD, leaderboard);
      renderLeaderboard();
      alert("Imported into leaderboard.");
    } catch {
      alert("Invalid JSON.");
    }
  };
  reader.readAsText(file);
}

/* ------------------------------------------------------------
   LAUNCHER INFO
------------------------------------------------------------ */

function updateLaunchInfo() {
  const info = document.getElementById("selected-level-info");
  const btn = document.getElementById("play-btn");

  if (!progress.selectedLevel) {
    info.textContent = "No level selected.";
    btn.disabled = true;
    return;
  }

  const lvl = levels.find((l) => l.id === progress.selectedLevel);
  if (!lvl) {
    info.textContent = "Level not found.";
    btn.disabled = true;
    return;
  }

  const best = progress.best[lvl.id] || 0;
  info.textContent = `${lvl.name} • Best: ${best}%`;
  btn.disabled = false;
}

/* ------------------------------------------------------------
   GAME ENGINE
------------------------------------------------------------ */

function startGame(levelId) {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  const lvl = levels.find((l) => l.id === levelId);
  const data = lvl.data;

  const groundY = canvas.height - 40;

  const player = {
    x: 80,
    y: groundY - 30,
    vy: 0,
    size: 26,
    onGround: true,
  };

  let scroll = 0;
  let running = true;
  const length = 2000;

  progress.attempts[levelId] = (progress.attempts[levelId] || 0) + 1;
  save(STORAGE.PROGRESS, progress);
  updateLaunchInfo();

  function jump() {
    if (player.onGround) {
      player.vy = -9.5;
      player.onGround = false;
    }
  }

  function key(e) {
    if (e.code === "Space") {
      e.preventDefault();
      jump();
    }
  }

  function click() {
    jump();
  }

  window.addEventListener("keydown", key);
  canvas.addEventListener("mousedown", click);

  function end(win, percent) {
    running = false;
    window.removeEventListener("keydown", key);
    canvas.removeEventListener("mousedown", click);

    const best = progress.best[levelId] || 0;
    if (percent > best) progress.best[levelId] = Math.round(percent);
    if (win && !progress.completed.includes(levelId))
      progress.completed.push(levelId);

    save(STORAGE.PROGRESS, progress);
    updateLaunchInfo();

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(win ? data.winText : "You Died", canvas.width / 2, canvas.height / 2);
  }

  function loop() {
    if (!running) return;

    player.vy += 0.5;
    player.y += player.vy;

    if (player.y >= groundY - player.size) {
      player.y = groundY - player.size;
      player.vy = 0;
      player.onGround = true;
    }

    scroll += 4;
    const percent = Math.min(100, (scroll / length) * 100);

    const px = player.x + scroll;
    for (const s of data.spikes) {
      const sx = s.x * 20;
      if (
        px + player.size > sx - 10 &&
        px < sx + 10 &&
        player.y + player.size > groundY - 30
      ) {
        end(false, percent);
        return;
      }
    }

    if (scroll >= length) {
      end(true, 100);
      return;
    }

    ctx.fillStyle = data.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = data.ground;
    ctx.fillRect(0, groundY, canvas.width, 40);

    ctx.fillStyle = "#f97316";
    for (const s of data.spikes) {
      const sx = s.x * 20 - scroll;
      if (sx < -20 || sx > canvas.width + 20) continue;
      ctx.beginPath();
      ctx.moveTo(sx - 10, groundY);
      ctx.lineTo(sx + 10, groundY);
      ctx.lineTo(sx, groundY - 30);
      ctx.closePath();
      ctx.fill();
    }

    const hue = (progress.icon / NUM_ICONS) * 360;
    ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    requestAnimationFrame(loop);
  }

  loop();
}

/* ------------------------------------------------------------
   STUDIO
------------------------------------------------------------ */

function initStudio() {
  const canvas = document.getElementById("studio-canvas");
  const ctx = canvas.getContext("2d");

  const cols = 60;
  const cellW = canvas.width / cols;
  const groundY = canvas.height - 40;

  const state = {
    tool: "spike",
    spikes: [],
  };

  function draw() {
    ctx.fillStyle = document.getElementById("studio-bg").value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = document.getElementById("studio-ground").value;
    ctx.fillRect(0, groundY, canvas.width, 40);

    ctx.fillStyle = "#f97316";
    state.spikes.forEach((s) => {
      const sx = s.x * cellW + cellW / 2;
      ctx.beginPath();
      ctx.moveTo(sx - 10, groundY);
      ctx.lineTo(sx + 10, groundY);
      ctx.lineTo(sx, groundY - 30);
      ctx.closePath();
      ctx.fill();
    });
  }

  function cellFromX(x) {
    return Math.max(0, Math.min(cols - 1, Math.floor(x / cellW)));
  }

  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const col = cellFromX(e.clientX - rect.left);
    const idx = state.spikes.findIndex((s) => s.x === col);

    if (state.tool === "spike") {
      if (idx === -1) state.spikes.push({ x: col });
    } else {
      if (idx !== -1) state.spikes.splice(idx, 1);
    }

    draw();
  };

  document.getElementById("tool-spike").onclick = () => {
    state.tool = "spike";
  };
  document.getElementById("tool-erase").onclick = () => {
    state.tool = "erase";
  };
  document.getElementById("studio-clear").onclick = () => {
    state.spikes = [];
    draw();
  };

  document.getElementById("studio-export").onclick = () => {
    const json = buildStudioJSON(state);
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = json.name.replace(/\s+/g, "-") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById("studio-import").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        document.getElementById("studio-name").value = data.name;
        document.getElementById("studio-bg").value = data.data.bg;
        document.getElementById("studio-ground").value = data.data.ground;
        document.getElementById("studio-win").value = data.data.winText;
        state.spikes = data.data.spikes.map((s) => ({ x: s.x }));
        draw();
      } catch {
        alert("Invalid JSON.");
      }
    };
    reader.readAsText(file);
  };

  document.getElementById("studio-save").onclick = () => {
    const json = buildStudioJSON(state);
    json.id = "C" + Date.now();
    json.type = "custom";
    customLevels.push(json);
    save(STORAGE.CUSTOM, customLevels);
    rebuildLevels();
    renderLevels();
    alert("Saved to launcher.");
  };

  draw();
}

function buildStudioJSON(state) {
  return {
    id: "STUDIO",
    name: document.getElementById("studio-name").value || "Custom Level",
    difficulty: "Custom",
    type: "custom",
    data: {
      bg: document.getElementById("studio-bg").value,
      ground: document.getElementById("studio-ground").value,
      winText: document.getElementById("studio-win").value || "GG!",
      spikes: state.spikes.map((s) => ({ x: s.x })),
    },
  };
}
