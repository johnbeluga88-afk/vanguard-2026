/* VANGUARD 2026 — Geometry Dash–style launcher + studio */

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

const ICONS = [
  { name: "Neon Blue", hue: 200 },
  { name: "Solar Orange", hue: 30 },
  { name: "Toxic Green", hue: 120 },
  { name: "Royal Purple", hue: 270 },
  { name: "Crimson", hue: 0 },
  { name: "Cyber Cyan", hue: 180 },
  { name: "Gold Rush", hue: 45 },
  { name: "Magenta Pulse", hue: 320 },
  { name: "Steel Grey", hue: 210 },
  { name: "Vanguard White", hue: 0, light: true },
];

const FACES = [
  { name: "Calm Cube", text: "o_o" },
  { name: "Shocked", text: "O_O" },
  { name: "Angry", text: ">_<" },
  { name: "Sleepy", text: "-_-", },
  { name: "Happy", text: "^_^" },
  { name: "Sus", text: "o_O" },
  { name: "Cool", text: "B)" },
  { name: "Glitch", text: "x_x" },
  { name: "Focus", text: "•_•" },
  { name: "Void", text: "._." },
];

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

let levels = [];

function levelName(i) {
  const names = [
    "Launch Pad",
    "Neon Run",
    "Circuit Breaker",
    "Skyline Dash",
    "Binary Bounce",
    "Pulse Drive",
    "Nightfall",
    "Overclock",
    "Starlight Path",
    "Quantum Leap",
    "Shockwave",
    "Voltage Rush",
    "Gravity Flip",
    "Echo Chamber",
    "Hyperlane",
    "Signal Drift",
    "Dark Matter",
    "Ion Storm",
    "Phase Shift",
    "Singularity",
    "Core Reactor",
    "Firewall",
    "Data Stream",
    "Neon Abyss",
    "Orbital",
    "Terminal Velocity",
    "Spectral Run",
    "Vanguard Trial",
    "Final Circuit",
    "Ascension",
  ];
  return names[i - 1] || `Level ${i}`;
}

function generateBuiltinLevels() {
  const arr = [];
  for (let i = 1; i <= NUM_LEVELS; i++) {
    const spikes = [];
    for (let x = 8; x < 80; x += 4 + (i % 3)) {
      if ((x + i) % 4 === 0) spikes.push({ x });
    }
    arr.push({
      id: "L" + i,
      name: levelName(i),
      difficulty: i <= 10 ? "Easy" : i <= 20 ? "Normal" : "Hard",
      type: "builtin",
      data: {
        bg: "#020617",
        ground: "#111827",
        spikes,
        winText: levelName(i) + " Complete!",
      },
    });
  }
  return arr;
}

function rebuildLevels() {
  levels = [...generateBuiltinLevels(), ...customLevels];
}

document.addEventListener("DOMContentLoaded", () => {
  rebuildLevels();
  initNavigation();
  renderLevels();
  renderGarage();
  renderLeaderboard();
  updateLaunchInfo();
  initStudio();
});

function switchView(id) {
  const buttons = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view");
  buttons.forEach((b) => {
    b.classList.toggle("active", b.dataset.view === id);
  });
  views.forEach((v) => {
    v.classList.toggle("active", v.id === "view-" + id);
  });
}

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
      switchView("launch");
    };

    container.appendChild(card);
  });
}

function renderGarage() {
  const icons = document.getElementById("icon-list");
  const faces = document.getElementById("face-list");
  icons.innerHTML = "";
  faces.innerHTML = "";

  ICONS.forEach((icon, i) => {
    const card = document.createElement("div");
    card.className = "card";
    if (i === progress.icon) card.classList.add("selected");
    const hue = icon.hue;
    const color = icon.light ? "#ffffff" : `hsl(${hue}, 80%, 60%)`;
    card.innerHTML = `
      <div class="skin-swatch" style="background:${color};"></div>
      <div class="card-title">${icon.name}</div>
      <div class="card-meta">Hue ${hue}${icon.light ? " • Light" : ""}</div>
    `;
    card.onclick = () => {
      progress.icon = i;
      save(STORAGE.PROGRESS, progress);
      renderGarage();
      drawGaragePreview();
    };
    icons.appendChild(card);
  });

  FACES.forEach((face, i) => {
    const card = document.createElement("div");
    card.className = "card";
    if (i === progress.face) card.classList.add("selected");
    card.innerHTML = `
      <div class="face-preview">${face.text}</div>
      <div class="card-title">${face.name}</div>
      <div class="card-meta">Face ${i + 1}</div>
    `;
    card.onclick = () => {
      progress.face = i;
      save(STORAGE.PROGRESS, progress);
      renderGarage();
      drawGaragePreview();
    };
    faces.appendChild(card);
  });

  drawGaragePreview();
}

function drawGaragePreview() {
  const c = document.getElementById("garage-preview");
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, c.width, c.height);

  const size = 60;
  const x = c.width / 2;
  const y = c.height / 2;

  const icon = ICONS[progress.icon] || ICONS[0];
  const face = FACES[progress.face] || FACES[0];

  const color = icon.light ? "#ffffff" : `hsl(${icon.hue}, 80%, 60%)`;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.fillRect(-size / 2, -size / 2, size, size);

  ctx.fillStyle = "#000";
  ctx.font = "18px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(face.text, 0, 2);

  ctx.restore();
}

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
    angle: 0,
    angularVelocity: 0,
  };

  let scroll = 0;
  let running = true;
  const length = 2200;

  progress.attempts[levelId] = (progress.attempts[levelId] || 0) + 1;
  save(STORAGE.PROGRESS, progress);
  updateLaunchInfo();

  function jump() {
    if (player.onGround) {
      player.vy = -9.5;
      player.onGround = false;
      player.angularVelocity = 0.25; // spin speed
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
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    jump();
  });

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
      player.angularVelocity *= 0.7;
      if (Math.abs(player.angularVelocity) < 0.01) player.angularVelocity = 0;
    } else {
      player.onGround = false;
    }

    player.angle += player.angularVelocity;

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

    const icon = ICONS[progress.icon] || ICONS[0];
    const face = FACES[progress.face] || FACES[0];
    const color = icon.light ? "#ffffff" : `hsl(${icon.hue}, 80%, 60%)`;

    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    ctx.rotate(player.angle);
    ctx.fillStyle = color;
    ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);

    ctx.fillStyle = "#000";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(face.text, 0, 1);

    ctx.restore();

    requestAnimationFrame(loop);
  }

  loop();
}

/* --------- STUDIO (upgraded, GD-style, mobile-friendly) --------- */

function initStudio() {
  const canvas = document.getElementById("studio-canvas");
  const ctx = canvas.getContext("2d");

  const cols = 200;
  const cellWBase = 20;
  const groundH = 40;
  const groundY = canvas.height - groundH;

  const state = {
    tool: "spike",
    spikes: [],
    cameraX: 0,
    zoom: 1,
    cursorCol: null,
  };

  function worldToScreenX(col) {
    const cellW = cellWBase * state.zoom;
    return col * cellW - state.cameraX;
  }

  function screenToCol(x) {
    const cellW = cellWBase * state.zoom;
    return Math.max(0, Math.min(cols - 1, Math.floor((x + state.cameraX) / cellW)));
  }

  function draw() {
    const bg = document.getElementById("studio-bg").value || "#020617";
    const ground = document.getElementById("studio-ground").value || "#111827";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = cellWBase * state.zoom;
    ctx.strokeStyle = "rgba(148,163,184,0.15)";
    ctx.lineWidth = 1;
    for (let col = 0; col <= cols; col++) {
      const sx = worldToScreenX(col);
      if (sx < -cellW || sx > canvas.width + cellW) continue;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvas.height);
      ctx.stroke();
    }

    ctx.fillStyle = ground;
    ctx.fillRect(0, groundY, canvas.width, groundH);

    ctx.fillStyle = "#f97316";
    state.spikes.forEach((s) => {
      const sx = worldToScreenX(s.x) + cellW / 2;
      if (sx < -20 || sx > canvas.width + 20) return;
      ctx.beginPath();
      ctx.moveTo(sx - cellW * 0.4, groundY);
      ctx.lineTo(sx + cellW * 0.4, groundY);
      ctx.lineTo(sx, groundY - 30 * state.zoom);
      ctx.closePath();
      ctx.fill();
    });

    if (state.cursorCol !== null) {
      const sx = worldToScreenX(state.cursorCol);
      ctx.fillStyle = "rgba(56,189,248,0.25)";
      ctx.fillRect(sx, 0, cellW, canvas.height - groundH);
    }
  }

  function placeOrErase(col) {
    const idx = state.spikes.findIndex((s) => s.x === col);
    if (state.tool === "spike") {
      if (idx === -1) state.spikes.push({ x: col });
    } else {
      if (idx !== -1) state.spikes.splice(idx, 1);
    }
    draw();
  }

  function handlePointer(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const col = screenToCol(x);
    state.cursorCol = col;
    placeOrErase(col);
  }

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    state.cursorCol = screenToCol(x);
    draw();
  });

  canvas.addEventListener("mousedown", (e) => {
    handlePointer(e.clientX);
  });

  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    handlePointer(touch.clientX);
  });

  canvas.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    handlePointer(touch.clientX);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      state.cameraX = Math.min(
        state.cameraX + 40,
        cols * cellWBase * state.zoom - canvas.width
      );
      draw();
    } else if (e.key === "ArrowLeft") {
      state.cameraX = Math.max(state.cameraX - 40, 0);
      draw();
    } else if (e.key === "+" || e.key === "=") {
      state.zoom = Math.min(2, state.zoom + 0.1);
      draw();
    } else if (e.key === "-" || e.key === "_") {
      state.zoom = Math.max(0.5, state.zoom - 0.1);
      draw();
    }
  });

  document.getElementById("studio-left").onclick = () => {
    state.cameraX = Math.max(state.cameraX - 40, 0);
    draw();
  };
  document.getElementById("studio-right").onclick = () => {
    state.cameraX = Math.min(
      state.cameraX + 40,
      cols * cellWBase * state.zoom - canvas.width
    );
    draw();
  };
  document.getElementById("studio-zoom-in").onclick = () => {
    state.zoom = Math.min(2, state.zoom + 0.1);
    draw();
  };
  document.getElementById("studio-zoom-out").onclick = () => {
    state.zoom = Math.max(0.5, state.zoom - 0.1);
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
    a.download = (json.name || "custom-level").replace(/\s+/g, "-") + ".json";
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
        document.getElementById("studio-name").value = data.name || "";
        document.getElementById("studio-bg").value = data.data.bg || "#020617";
        document.getElementById("studio-ground").value =
          data.data.ground || "#111827";
        document.getElementById("studio-win").value =
          data.data.winText || "GG!";
        state.spikes = (data.data.spikes || []).map((s) => ({ x: s.x }));
        state.cameraX = 0;
        state.zoom = 1;
        draw();
      } catch {
        alert("Invalid level JSON.");
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
    alert("Level saved to launcher.");
  };

  draw();
}

function buildStudioJSON(state) {
  const name = document.getElementById("studio-name").value.trim() || "Custom Level";
  const bg = document.getElementById("studio-bg").value || "#020617";
  const ground = document.getElementById("studio-ground").value || "#111827";
  const winText = document.getElementById("studio-win").value.trim() || "GG!";

  return {
    id: "STUDIO",
    name,
    difficulty: "Custom",
    type: "custom",
    data: {
      bg,
      ground,
      winText,
      spikes: state.spikes.map((s) => ({ x: s.x })),
    },
  };
}
