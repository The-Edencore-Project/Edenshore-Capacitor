import { loadSave, saveData, addBond, getStatus } from './save.js';
import { Brain } from './brain.js';
import { audio } from './audio.js';

let save = loadSave();
let brain = new Brain(save);
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
let sleepDialogueIndex = 0;

const SLEEP_DIALOGUE = [
    ["Lumen", "It is time for rest, little one."],
    ["Vertex", "I'm not tired! I'm still playing!"],
    ["Solon", "Kid, the sand is calling you."],
    ["Vertex", "But the glass is so interesting right now..."],
    ["Ripple", "Shh. We will be here when you wake."],
    ["Vertex", "Okay... okay. Just five more minutes."],
    ["Lumen", "Goodnight, Vertex."]
];

const canvas = document.getElementById("fx-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ============================================================
// THE VOICE: 14-char chunking
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
// THE BUBBLE (FIXED for WebView)
// ============================================================
function spawnBubble(speaker, text) {
    const c = CREATURES.find(x => x.name === speaker) || CREATURES.find(x => x.name === "Vertex");
    if (!c) return;

    const el = c.id === "solon" ? document.getElementById("solon-group") : document.getElementById(c.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let cx = rect.left + (rect.width / 2);
    let spawnY = Math.max(100, rect.top - 60);

    // Use requestAnimationFrame to ensure text is measured AFTER DOM is ready
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

        // Draw Circle
        ctx.beginPath();
        ctx.arc(currentX, currentY, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(38, 64, 89, ${0.45 * alpha})`;
        ctx.fill();

        // Draw Highlight Arc
        ctx.beginPath();
        ctx.arc(currentX, currentY, b.radius * 0.75, 100 * Math.PI / 180, 140 * Math.PI / 180);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Text
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
// THEATRE ENGINE
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
// HUD & MILESTONES
// ============================================================
function updateDebugHUD() {
    const el = document.getElementById("debug-overlay");
    if (!el) return;
    const actStr = "[0.5, 1.0, 0.9, 1.0]";
    el.innerText = 
        `Mood: ${brain.currentMood}\n` +
        `Sleep: ${brain.sleepState}\n` +
        `State: ${brain.gameState}\n` +
        `Light: 0.50 | Temp: 0.60\n` +
        `Motion: 0.00 | Shake: 0.00\n` +
        `Rhythm: 1.0s | Heat: ${brain.heat}\n` +
        `Net: ${actStr}`;
}

function triggerMilestoneBurst() {
    const layer = document.getElementById("particle-layer");
    if (!layer) return;
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const p = document.createElement("div");
            p.className = "gold-particle";
            p.style.left = `${50 + (Math.random() - 0.5) * 20}%`;
            p.style.bottom = `50%`;
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
// LUMEN TENTACLES
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