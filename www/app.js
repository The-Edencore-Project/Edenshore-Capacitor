// ============================================================
// EDENSHORE - APP.JS V2.2 (DYNAMIC IMPORT BOOT)
// ============================================================

// 1. INJECT A VISIBLE CRASH CONSOLE
window.addEventListener('error', (e) => {
    const errDiv = document.createElement('div');
    errDiv.style.cssText = "position:absolute;top:10px;left:10px;right:10px;background:red;color:white;z-index:9999;padding:15px;font-size:12px;font-family:monospace;overflow:auto;";
    errDiv.innerText = "GLOBAL CRASH:\n" + e.message + "\n" + (e.filename || "") + ":" + (e.lineno || "");
    document.body.appendChild(errDiv);
});

const bootLog = (msg, color="lime") => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;top:${10 + document.querySelectorAll('.boot-msg').length * 20}px;left:10px;background:black;color:${color};z-index:9998;padding:4px;font-size:10px;font-family:monospace;`;
    el.className = "boot-msg";
    el.innerText = msg;
    document.body.appendChild(el);
};

bootLog("app.js reached");

// We do NOT import brain or audio at the top level.
// They will be loaded dynamically inside DOMContentLoaded.

let save, Brain, audio, brain;
let lastTime = performance.now() / 1000;

const CREATURES = [
    { id: "solon",  name: "Solon",  x: 0.30, y: 0.45, speed: 0.5, phase: 0,   talkTimer: 0, blinkTimer: 3.0, isBlinking: false },
    { id: "prism",  name: "Prism",  x: 0.70, y: 0.45, speed: 1.2, phase: 1.5, talkTimer: 0, blinkTimer: 4.0, isBlinking: false },
    { id: "lumen",  name: "Lumen",  x: 0.20, y: 0.65, speed: 0.8, phase: 2.0, talkTimer: 0, blinkTimer: 5.0, isBlinking: false },
    { id: "ripple", name: "Ripple", x: 0.75, y: 0.65, speed: 0.6, phase: 3.0, talkTimer: 0, blinkTimer: 6.0, isBlinking: false },
    { id: "vertex", name: "Vertex", x: 0.50, y: 0.85, speed: 1.0, phase: 4.0, talkTimer: 0, blinkTimer: 2.0, isBlinking: false }
];

const TEXT_COLORS = {
    "Vertex": "#ff7366", "Solon": "#8cd98c", "Lumen": "#ff99cc", 
    "Ripple": "#80ccff", "Prism": "#ffd980"
};

let speechQueue = [];
let speechTimer = 0;
let activeBubbles = [];
let finFrame = 1;
let finTimer = 0;
let lumenTentacleEls = [];

let theatreState = "IDLE"; 
let theatreTimer = 0;
let foodParticles = []; 

const canvas = document.getElementById("fx-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ============================================================
// THE VOICE
// ============================================================
function chunkText(text) {
    const words = text.split(' ');
    const chunks = [];
    let current = "";
    for (const w of words) {
        if (w.length > 14) {
            if (current) { chunks.push(current); current = ""; }
            for (let i = 0; i < w.length; i += 14) chunks.push(w.slice(i, i + 14));
            continue;
        }
        if (!current) current = w;
        else if (current.length + 1 + w.length <= 14) current += " " + w;
        else { chunks.push(current); current = w; }
    }
    if (current) chunks.push(current);
    return chunks;
}

function queueScene(scene) {
    if (!scene || !Array.isArray(scene)) return;
    scene.forEach(line => {
        if (!line || line.length < 2) return;
        const speaker = line[0];
        const text = line[1];
        const chunks = chunkText(text);
        chunks.forEach(chunk => speechQueue.push({ speaker, text: chunk, delay: 2.0 }));
    });
}

// ============================================================
// THE BUBBLE (FIXED)
// ============================================================
function spawnBubble(speaker, text) {
    const c = CREATURES.find(x => x.name === speaker) || CREATURES.find(x => x.name === "Vertex");
    if (!c) return;

    const el = c.id === "solon" ? document.getElementById("solon-group") : document.getElementById(c.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let cx = rect.left + (rect.width / 2);
    let spawnY = Math.max(100, rect.top - 60);

    requestAnimationFrame(() => {
        ctx.font = "600 15px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        const tw = Math.max(ctx.measureText(text).width, 20);
        const th = 20; 
        const diag = Math.sqrt(tw * tw + th * th);
        const refSize = Math.min(window.innerWidth, window.innerHeight);
        const diameter = Math.max(diag + (refSize * 0.08), 100);
        const radius = diameter / 2;

        if (cx - radius < 0) cx = radius;
        if (cx + radius > window.innerWidth) cx = window.innerWidth - radius;

        activeBubbles.push({
            speaker: speaker,
            text: text,
            color: TEXT_COLORS[speaker] || "#ffffff",
            x: cx,
            y: spawnY,
            radius: radius,
            startTime: performance.now(),
            life: 6000
        });

        c.talkTimer = Math.max(1.5, Math.min(6.0, text.length * 0.1));
    });
}

function drawBubbles(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        const b = activeBubbles[i];
        const progress = (now - b.startTime) / b.life;

        if (progress >= 1.0) {
            activeBubbles.splice(i, 1);
            continue;
        }

        let alpha = 1.0;
        if (progress < 0.1) alpha = progress / 0.1;
        else if (progress > 0.75) alpha = (1.0 - progress) / 0.25;
        else alpha = 1.0;

        const rise = (canvas.height * 0.48) * progress;
        const sway = Math.sin(progress * Math.PI * 2) * (canvas.width * 0.05);
        const currentX = b.x + sway;
        const currentY = b.y - rise;

        ctx.beginPath();
        ctx.arc(currentX, currentY, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(38, 64, 89, ${0.45 * alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(currentX, currentY, b.radius * 0.75, 100 * Math.PI / 180, 140 * Math.PI / 180);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "600 15px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.fillStyle = b.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = alpha;
        ctx.fillText(b.text, currentX, currentY);
        ctx.globalAlpha = 1.0;
    }
}

// ============================================================
// THEATRE
// ============================================================
function startFeeding() {
    theatreState = "FEEDING";
    theatreTimer = 10.0; 
    foodParticles = [];
    for (let i = 0; i < 15; i++) {
        foodParticles.push({
            x: window.innerWidth * 0.5 + (Math.random() - 0.5) * (window.innerWidth * 0.6),
            y: -20 - (Math.random() * 50),
            vx: (Math.random() - 0.5) * 30,
            vy: 80 + Math.random() * 60,
            phase: Math.random() * 6.28
        });
    }
    audio.sting("Vertex");
}

function updateTheatre(dt) {
    if (theatreState === "FEEDING") {
        theatreTimer -= dt;
        if (theatreTimer <= 0) {
            theatreState = "IDLE";
            foodParticles = [];
        }
    }
    for (let i = foodParticles.length - 1; i >= 0; i--) {
        const f = foodParticles[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.y > window.innerHeight) foodParticles.splice(i, 1);
    }
}

function drawFood() {
    ctx.fillStyle = "#FFD700";
    foodParticles.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, 4 + Math.sin(f.phase + performance.now() * 0.005) * 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ============================================================
// UI + HUD
// ============================================================
function updateDebugHUD() {
    const el = document.getElementById("debug-overlay");
    if (!el) return;
    if (!brain) return;
    el.innerText = 
        `Mood: ${brain.currentMood}\n` +
        `Sleep: ${brain.sleepState}\n` +
        `State: ${brain.gameState}\n` +
        `Heat: ${brain.heat}`;
}

function updateUI() {
    const el = document.getElementById("bond-text");
    if (el && save) el.textContent = getStatus(save);
}

function initLumenTentacles() {
    const lumen = document.getElementById("lumen");
    if (!lumen) return;
    for (let i = 0; i < 5; i++) {
        const t = document.createElement("div");
        t.className = "lumen-tentacle";
        document.body.appendChild(t);
        lumenTentacleEls.push(t);
    }
}

function updateLumenTentacles(now) {
    const lumen = document.getElementById("lumen");
    if (!lumen) return;
    const rect = lumen.getBoundingClientRect();
    const baseX = rect.left + rect.width / 2;
    const baseY = rect.top + rect.height * 0.85;
    const len = rect.height * 1.0;

    lumenTentacleEls.forEach((t, idx) => {
        const offsetX = (idx - 2) * (rect.width * 0.10);
        const sway = Math.sin(now * 2.0 + idx * 1.3) * (rect.width * 0.15);
        t.style.left = `${baseX + offsetX + sway}px`;
        t.style.top = `${baseY}px`;
        t.style.height = `${len}px`;
        t.style.transform = `rotate(${(idx - 2) * 4}deg)`;
    });
}

function updateCreatureSprite(c, now) {
    const el = document.getElementById(c.id);
    if (!el) return;
    if (brain && brain.sleepState === "SLEEPING") { el.src = el.dataset.blink; return; }
    if (c.talkTimer > 0) {
        el.src = (Math.floor(now * 1000 / 150) % 2 === 0) ? el.dataset.talk : el.dataset.base;
        return;
    }
    if (c.isBlinking) { el.src = el.dataset.blink; return; }
    el.src = el.dataset.base;
}

function updateBlink(c, dt) {
    if (c.talkTimer > 0 || (brain && brain.sleepState === "SLEEPING")) return;
    c.blinkTimer -= dt;
    if (c.blinkTimer <= 0) {
        if (!c.isBlinking) { c.isBlinking = true; c.blinkTimer = 0.15; }
        else { c.isBlinking = false; c.blinkTimer = 3.0 + Math.random() * 3.0; }
    }
}

function updateSolonFins(dt) {
    finTimer += dt;
    if (finTimer < 0.12) return;
    finTimer = 0;
    finFrame++;
    if (finFrame > 5) finFrame = 1;
    const left = document.getElementById("solonLeftFin");
    const right = document.getElementById("solonRightFin");
    if (left) left.src = `assets/images/solon_left_fin_${finFrame}.png`;
    if (right) right.src = `assets/images/solon_right_fin_${finFrame}.png`;
}

function handleWorldTap() {
    if (!brain) return;
    if (brain.sleepState !== "AWAKE") { brain.wakeUp(); return; }
    if (brain.gameState === "riddle_wait") return;
    const scene = brain.onTap();
    if (scene) queueScene(scene);
    try { audio.sting("Vertex"); } catch(e){}
}

function handleCreatureTap(id) {
    if (!brain) return;
    addBond(save, 1);
    if (brain.gameState === "riddle_wait") {
        brain.onCreatureTap(id.charAt(0).toUpperCase() + id.slice(1));
    } else {
        const scene = brain.onTap();
        if (scene) queueScene(scene);
    }
    try { audio.sting(id); } catch(e){}
    updateUI();
}

function bindCreatures() {
    CREATURES.forEach(c => {
        const el = document.getElementById(c.id);
        if (el) el.addEventListener("click", () => handleCreatureTap(c.id));
    });
    const solonGroup = document.getElementById("solon-group");
    if (solonGroup) solonGroup.addEventListener("click", () => handleCreatureTap("solon"));
}

function bindUtilBar() {
    document.getElementById("btn-feed").addEventListener("click", () => {
        startFeeding();
        const response = brain.onFeed();
        if (response) queueScene(response);
    });
    document.getElementById("btn-sleep").addEventListener("click", () => {
        if (brain.sleepState === "AWAKE") {
            brain.triggerSleep();
            queueScene([["Lumen", "It is time for rest, little one."]]);
        } else {
            brain.wakeUp();
            queueScene([["Vertex", "I'm awake! I'm awake!"]]);
        }
    });
    document.getElementById("btn-dim").addEventListener("click", () => {});
    document.getElementById("btn-vol").addEventListener("click", () => {
        try {
            audio.volume = audio.volume > 0 ? 0 : 0.30;
            if (audio.music) audio.music.volume = audio.volume;
        } catch(e){}
    });
    document.getElementById("btn-menu").addEventListener("click", () => {});
}

function initBiomes() {
    const bg = document.getElementById("bg-gradient");
    const map = { lagoonBtn: "biome-lagoon", shoreBtn: "biome-shore", twilightBtn: "biome-twilight", deepBtn: "biome-deep" };
    Object.entries(map).forEach(([id, cls]) => {
        document.getElementById(id)?.addEventListener("click", () => {
            bg.className = cls;
            document.querySelectorAll(".biome-btn").forEach(b => b.classList.remove("active"));
            document.getElementById(id).classList.add("active");
            if (brain) {
                const biomeName = cls.replace("biome-", "").toUpperCase();
                brain.onBiomeSwitch(biomeName);
            }
        });
    });
}

function spawnParticles() {
    const layer = document.getElementById("particle-layer");
    if (!layer) return;
    setInterval(() => {
        const p = document.createElement("div");
        p.className = "particle";
        const size = Math.random() * 4 + 2;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.bottom = "-10px";
        p.style.animationDuration = `${Math.random() * 5 + 5}s`;
        layer.appendChild(p);
        setTimeout(() => p.remove(), 10000);
    }, 300);
}

function animate(time) {
    const now = time * 0.001;
    const dt = now - lastTime;
    lastTime = now;

    if (brain) {
        const newScene = brain.update(dt);
        if (newScene) queueScene(newScene);
    }

    updateTheatre(dt);

    if (speechQueue.length > 0 && activeBubbles.length < 2) {
        speechTimer += dt;
        if (speechTimer >= speechQueue[0].delay) {
            speechTimer = 0;
            const item = speechQueue.shift();
            spawnBubble(item.speaker, item.text);
        }
    }

    CREATURES.forEach((c) => {
        const el = c.id === "solon" ? document.getElementById("solon-group") : document.getElementById(c.id);
        if (!el) return;

        if (c.talkTimer > 0) c.talkTimer -= dt;
        updateBlink(c, dt);
        if (c.id !== "solon") updateCreatureSprite(c, now);

        let targetX = c.x;
        let targetY = c.y;

        if (brain && (brain.sleepState === "SLEEPING" || brain.sleepState === "WAKING")) {
            targetY = 0.85;
            if (c.name === "Vertex") targetY = 0.88;
        } else if (theatreState === "FEEDING") {
            if (c.name === "Lumen" || c.name === "Prism") targetY = 0.15;
            else if (c.name === "Solon") { targetX = 0.5 + Math.sin(now * 0.8) * 0.3; targetY = 0.5; }
            else if (c.name === "Vertex") targetY = 0.85;
        }

        el.style.left = `${targetX * 100}%`;
        el.style.top = `${targetY * 100}%`;

        const driftX = Math.sin((now * c.speed) + c.phase) * 10;
        const driftY = Math.cos((now * c.speed * 1.5) + c.phase) * 5;
        el.style.transform = `translateX(-50%) translate(${driftX}px, ${driftY}px)`;
    });

    updateSolonFins(dt);
    updateLumenTentacles(now);
    drawBubbles(time);
    drawFood();
    updateDebugHUD();

    requestAnimationFrame(animate);
}

// ============================================================
// BOOT (DYNAMIC IMPORT)
// ============================================================
async function boot() {
    bootLog("boot() started", "yellow");
    
    try {
        bootLog("Loading save.js...", "cyan");
        const saveModule = await import('./save.js');
        save = saveModule.loadSave();
        window.getStatus = saveModule.getStatus;
        window.addBond = saveModule.addBond;
        bootLog("save.js loaded", "lime");
    } catch (e) {
        bootLog("FAIL save.js: " + e.message, "red");
        return;
    }

    try {
        bootLog("Loading audio.js...", "cyan");
        const audioModule = await import('./audio.js');
        audio = audioModule.audio;
        bootLog("audio.js loaded", "lime");
    } catch (e) {
        bootLog("FAIL audio.js: " + e.message, "red");
        return;
    }

    try {
        bootLog("Loading brain.js...", "cyan");
        const brainModule = await import('./brain.js');
        Brain = brainModule.Brain;
        brain = new Brain(save);
        bootLog("brain.js loaded", "lime");
    } catch (e) {
        bootLog("FAIL brain.js: " + e.message, "red");
        return;
    }

    // If we got here, all imports succeeded!
    bootLog("ALL MODULES LOADED", "lime");
    updateUI();
    bindCreatures();
    bindUtilBar();
    initBiomes();
    initLumenTentacles();
    spawnParticles();

    document.body.addEventListener("click", (e) => {
        if (e.target.tagName === "IMG" || e.target.id === "solon-group") return;
        if (e.target.id.startsWith("btn-")) return;
        if (e.target.classList.contains("biome-btn")) return;
        handleWorldTap();
    });

    requestAnimationFrame(animate);

    // Splash screen
    const overlay = document.getElementById("start-overlay");
    if (overlay) {
        overlay.addEventListener("click", () => {
            overlay.style.opacity = "0";
            setTimeout(() => overlay.style.display = "none", 1000);
            try { audio.start(); } catch(e) { bootLog("Audio fail: " + e.message, "red"); }
        });
    }
}

window.addEventListener("DOMContentLoaded", boot);