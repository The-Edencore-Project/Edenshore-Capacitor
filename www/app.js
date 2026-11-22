import { loadSave, saveData, addBond, getStatus } from './save.js';
import { Brain } from './brain.js';
import { audio } from './audio.js';

let save = loadSave();
let brain = new Brain(save);
let lastTime = 0;

// THE UPSIDE DOWN PENTAGON LAYOUT
// Y-values inverted from Kivy (0=bottom) to CSS (0=top)
const CREATURES = [
    // Top Left (Kivy y=0.55 -> CSS y=0.45)
    { id: "solon",  name: "Solon",  x: 0.30, y: 0.45, speed: 0.5, phase: 0,   talkTimer: 0, blinkTimer: 3.0, isBlinking: false },
    // Top Right (Kivy y=0.55 -> CSS y=0.45)
    { id: "prism",  name: "Prism",  x: 0.70, y: 0.45, speed: 1.2, phase: 1.5, talkTimer: 0, blinkTimer: 4.0, isBlinking: false },
    // Bottom Left (Kivy y=0.35 -> CSS y=0.65)
    { id: "lumen",  name: "Lumen",  x: 0.20, y: 0.65, speed: 0.8, phase: 2.0, talkTimer: 0, blinkTimer: 5.0, isBlinking: false },
    // Bottom Right (Kivy y=0.35 -> CSS y=0.65)
    { id: "ripple", name: "Ripple", x: 0.75, y: 0.65, speed: 0.6, phase: 3.0, talkTimer: 0, blinkTimer: 6.0, isBlinking: false },
    // Bottom Center / Sand (Kivy y=0.15 -> CSS y=0.85)
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

// ============================================================
// THE VOICE: 24-char chunking (Golden Code parity)
// ============================================================
function chunkText(text) {
    const words = text.split(' ');
    const chunks = [];
    let current = "";
    for (const w of words) {
        if (w.length > 24) {
            if (current) { chunks.push(current); current = ""; }
            for (let i = 0; i < w.length; i += 24) chunks.push(w.slice(i, i + 24));
            continue;
        }
        if (!current) current = w;
        else if (current.length + 1 + w.length <= 24) current += " " + w;
        else { chunks.push(current); current = w; }
    }
    if (current) chunks.push(current);
    return chunks;
}

function queueScene(scene) {
    if (!scene) return;
    scene.forEach(line => {
        const speaker = line[0];
        const text = line[1];
        const chunks = chunkText(text);
        chunks.forEach(chunk => speechQueue.push({ speaker, text: chunk, delay: 1.5 }));
    });
}

// ============================================================
// THE BUBBLE: Bulletproof Rendering (Golden Code parity)
// ============================================================
function spawnBubble(speaker, text) {
    const c = CREATURES.find(x => x.name === speaker) || CREATURES.find(x => x.name === "Vertex");
    if (!c) return;

    const el = c.id === "solon" ? document.getElementById("solon-group") : document.getElementById(c.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + (rect.width / 2);
    const spawnY = Math.max(100, rect.top - 80); // Spawn high above

    // 1. Measure the text using a detached, unstyled element
    const measure = document.createElement("span");
    measure.style.position = "absolute";
    measure.style.visibility = "hidden";
    measure.style.whiteSpace = "nowrap";
    measure.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    measure.style.fontSize = "15px";
    measure.style.fontWeight = "600";
    measure.innerText = text;
    document.body.appendChild(measure);
    
    const tw = measure.offsetWidth;
    const th = measure.offsetHeight;
    measure.remove();

    // 2. Calculate diameter based on text diagonal + padding
    const diag = Math.sqrt(tw * tw + th * th);
    const refSize = Math.min(window.innerWidth, window.innerHeight);
    const diameter = diag + (refSize * 0.08); // 8% padding to ensure plenty of room

    // 3. Create the Bubble Container
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.style.position = "absolute";
    bubble.style.width = `${diameter}px`;
    bubble.style.height = `${diameter}px`;
    bubble.style.borderRadius = "50%";
    bubble.style.background = "rgba(38, 64, 89, 0.45)";
    bubble.style.left = `${Math.max(4, Math.min(window.innerWidth - diameter - 4, cx - (diameter / 2)))}px`;
    bubble.style.top = `${spawnY}px`;
    bubble.style.pointerEvents = "none";
    bubble.style.zIndex = "100";
    // NO overflow hidden, NO flex, NO backdrop-filter

    // Add the highlight arc
    const arc = document.createElement("div");
    arc.style.position = "absolute";
    arc.style.top = "15%";
    arc.style.left = "15%";
    arc.style.width = "30%";
    arc.style.height = "30%";
    arc.style.borderRadius = "50%";
    arc.style.borderTop = "2px solid rgba(255,255,255,0.8)";
    arc.style.transform = "rotate(35deg)";
    bubble.appendChild(arc);

    // 4. Create the Text Span
    const textSpan = document.createElement("span");
    textSpan.innerText = text;
    textSpan.style.position = "absolute";
    textSpan.style.top = "50%";
    textSpan.style.left = "50%";
    textSpan.style.transform = "translate(-50%, -50%)";
    textSpan.style.color = TEXT_COLORS[speaker] || "#ffffff";
    textSpan.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    textSpan.style.fontSize = "15px";
    textSpan.style.fontWeight = "600";
    textSpan.style.textAlign = "center";
    textSpan.style.lineHeight = "1.3";
    textSpan.style.width = `${Math.max(tw + 10, diameter * 0.7)}px`; 
    // ^ Force the span width so the WebView doesn't collapse it
    
    bubble.appendChild(textSpan);
    document.body.appendChild(bubble);

    const startTime = performance.now();
    activeBubbles.push({ 
        el: bubble, 
        startTime: startTime, 
        life: 6000, 
        startX: parseFloat(bubble.style.left), 
        startY: spawnY 
    });
    
    // Talk timer from text length (Golden Code)
    c.talkTimer = Math.max(1.5, Math.min(6.0, text.length * 0.1));
}

function updateBubbles(now) {
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        const b = activeBubbles[i];
        const progress = (now - b.startTime) / b.life;
        if (progress >= 1.0) { b.el.remove(); activeBubbles.splice(i, 1); continue; }

        let alpha = 1.0;
        if (progress < 0.1) alpha = progress / 0.1;
        else if (progress > 0.75) alpha = (1.0 - progress) / 0.25;
        else alpha = 1.0;

        const rise = (window.innerHeight * 0.48) * progress;
        const sway = Math.sin(progress * Math.PI * 2) * (window.innerWidth * 0.08);

        b.el.style.transform = `translate(${sway}px, -${rise}px)`;
        b.el.style.opacity = alpha;
    }
}

// ============================================================
// HUD Debug Overlay (Full Golden Code Parity)
// ============================================================
function updateDebugHUD() {
    const el = document.getElementById("debug-overlay");
    if (!el) return;
    
    // Simulate sensor values for the HUD display
    const light = 0.50;
    const temp = 0.60;
    const motion = 0.00;
    const shake = 0.00;
    const rhythm = 1.0;
    const net = brain.arbiter ? brain.arbiter.net.forward([0.2, 1.0, 0.0, 0.1, Math.min(brain.heat/3.0, 1.0), Math.min(save.bond_score/1000.0, 1.0), 0.0, 0.5, 0.0, 0.0, 0.2, 0.0]) : [0,0,0,0];
    const netStr = net.map(n => n.toFixed(1)).join(', ');

    el.innerText = 
        `Mood: ${brain.currentMood}\n` +
        `Sleep: ${brain.sleepState}\n` +
        `Light: ${light.toFixed(2)} | Temp: ${temp.toFixed(2)}\n` +
        `Motion: ${motion.toFixed(2)} | Shake: ${shake.toFixed(2)}\n` +
        `Rhythm: ${rhythm.toFixed(1)}s | Heat: ${brain.heat}\n` +
        `Net: [${netStr}]`;
}

// ============================================================
// Milestone Overlay
// ============================================================
function triggerMilestoneBurst() {
    const layer = document.getElementById("particle-layer");
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const p = document.createElement("div");
            p.className = "gold-particle";
            const size = Math.random() * 6 + 2;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${50 + (Math.random() - 0.5) * 20}%`;
            p.style.bottom = `50%`;
            p.style.animationDuration = `${Math.random() * 2 + 1}s`;
            layer.appendChild(p);
            setTimeout(() => p.remove(), 3000);
        }, i * 50);
    }
}

function showMilestone(text) {
    const el = document.getElementById("milestone-overlay");
    if (!el) return;
    el.innerText = text;
    el.classList.add("active");
    setTimeout(() => el.classList.remove("active"), 3000);
}

// ============================================================
// Float Text (+1, zZz)
// ============================================================
function spawnFloatText(x, y, text, color) {
    const el = document.createElement("div");
    el.className = "float-text";
    el.innerText = text;
    el.style.color = color || "#FFD700";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ============================================================
// Lumen Tentacles
// ============================================================
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

// ============================================================
// Creature Sprite Update
// ============================================================
function updateCreatureSprite(c, now) {
    const el = document.getElementById(c.id);
    if (!el) return;

    if (c.talkTimer > 0) {
        el.src = (Math.floor(now * 1000 / 150) % 2 === 0) ? el.dataset.talk : el.dataset.base;
        return;
    }
    if (c.isBlinking) { el.src = el.dataset.blink; return; }
    el.src = el.dataset.base;
}

function updateBlink(c, dt) {
    if (c.talkTimer > 0) return;
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

// ============================================================
// Interaction
// ============================================================
function tapCreature(id) {
    const milestone = addBond(save, 1);
    if (milestone) {
        triggerMilestoneBurst();
        showMilestone(`MILESTONE: ${save.bond_score}`);
    }
    const scene = brain.onTap();
    if (scene) queueScene(scene);
    audio.sting(id);
    updateUI();
}

function bindCreatures() {
    CREATURES.forEach(c => {
        const el = document.getElementById(c.id);
        if (el) el.addEventListener("click", () => tapCreature(c.id));
    });
    const solonFin = document.getElementById("solon-group");
    if (solonFin) solonFin.style.pointerEvents = "auto";
}

function updateUI() {
    const el = document.getElementById("bond-text");
    if (el) el.textContent = getStatus(save);
}

function initBiomes() {
    const bg = document.getElementById("bg-gradient");
    const map = { lagoonBtn: "biome-lagoon", shoreBtn: "biome-shore", twilightBtn: "biome-twilight", deepBtn: "biome-deep" };
    Object.entries(map).forEach(([id, cls]) => {
        document.getElementById(id)?.addEventListener("click", () => {
            bg.className = cls;
            document.querySelectorAll(".biome-btn").forEach(b => b.classList.remove("active"));
            document.getElementById(id).classList.add("active");
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

// ============================================================
// Main Animation Loop
// ============================================================
function animate(time) {
    const now = time * 0.001;
    const dt = now - lastTime;
    lastTime = now;

    const newScene = brain.update(dt);
    if (newScene) queueScene(newScene);

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

        el.style.left = `${c.x * 100}%`;
        el.style.top = `${c.y * 100}%`;

        const driftX = Math.sin((now * c.speed) + c.phase) * 10;
        const driftY = Math.cos((now * c.speed * 1.5) + c.phase) * 5;
        el.style.transform = `translate(${driftX}px, ${driftY}px)`;
    });

    updateSolonFins(dt);
    updateLumenTentacles(now);
    updateBubbles(time);
    updateDebugHUD();
    
    requestAnimationFrame(animate);
}

// ============================================================
// Boot
// ============================================================
document.getElementById("start-overlay").addEventListener("click", () => {
    const overlay = document.getElementById("start-overlay");
    overlay.style.opacity = "0";
    setTimeout(() => overlay.style.display = "none", 1000);
    audio.start();
});

window.addEventListener("DOMContentLoaded", () => {
    save.visits = (save.visits || 0) + 1;
    saveData(save);
    updateUI();
    bindCreatures();
    initBiomes();
    initLumenTentacles();
    spawnParticles();

    requestAnimationFrame(animate);
});