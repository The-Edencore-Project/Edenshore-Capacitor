import { loadSave, saveData, addBond, getStatus } from './save.js';
import { Brain } from './brain.js';
import { audio } from './audio.js';

let save = loadSave();
let brain = new Brain(save);
let lastTime = 0;

// POSITIONS FIXED (Vertex moved down to y: 0.05)
const CREATURES = [
    { id: "solon", name: "Solon", x: 0.30, y: 0.55, speed: 0.5, phase: 0, talkTimer: 0, blinkTimer: 3.0, isBlinking: false },
    { id: "prism", name: "Prism", x: 0.70, y: 0.55, speed: 1.2, phase: 1.5, talkTimer: 0, blinkTimer: 4.0, isBlinking: false },
    { id: "lumen", name: "Lumen", x: 0.20, y: 0.35, speed: 0.8, phase: 2.0, talkTimer: 0, blinkTimer: 5.0, isBlinking: false },
    { id: "ripple", name: "Ripple", x: 0.75, y: 0.35, speed: 0.6, phase: 3.0, talkTimer: 0, blinkTimer: 6.0, isBlinking: false },
    { id: "vertex", name: "Vertex", x: 0.50, y: 0.05, speed: 1.0, phase: 4.0, talkTimer: 0, blinkTimer: 2.0, isBlinking: false }
];

let speechQueue = [];
let speechTimer = 0;
let activeBubbles = [];
let finFrame = 1;
let finTimer = 0;

function updateUI() {
    const el = document.getElementById("bond-text");
    if (el) el.textContent = getStatus(save);
}

function spawnBubble(speaker, text) {
    let c = CREATURES.find(x => x.name === speaker) || CREATURES.find(x => x.name === "Vertex");
    if (!c) return;

    let el = c.id === "solon" ? document.getElementById("solon-group") : document.getElementById(c.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + (rect.width / 2);
    
    // Spawn above the creature, but clamp to the screen bounds
    let spawnY = rect.top - 20; 
    if (spawnY < 90) spawnY = rect.bottom + 20; // Below the HUD

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerText = text; // Using innerText instead of textContent to force text rendering
    
    // Dynamic sizing
    let width = Math.max(140, Math.min(window.innerWidth - 40, text.length * 10 + 40));
    bubble.style.width = `${width}px`;
    bubble.style.left = `${cx - (width/2)}px`; // Exact left position
    bubble.style.top = `${spawnY}px`; 
    
    document.body.appendChild(bubble);

    let startTime = performance.now();
    activeBubbles.push({ el: bubble, startTime: startTime, life: 6000, startX: cx - (width/2), startY: spawnY });
    c.talkTimer = 2.0;
}

function updateBubbles(now) {
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        let b = activeBubbles[i];
        let progress = (now - b.startTime) / b.life;
        if (progress >= 1.0) { b.el.remove(); activeBubbles.splice(i, 1); continue; }
        
        let currentY = b.startY - (progress * 80);
        let alpha = 1.0;
        if (progress < 0.1) alpha = progress / 0.1;
        if (progress > 0.7) alpha = (1.0 - progress) / 0.3;
        
        // Fixed transform to prevent text clipping
        b.el.style.transform = `translate(0px, -${progress * 80}px)`;
        b.el.style.opacity = alpha;
    }
}

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

function tapCreature(id) {
    let milestone = addBond(save, 1);
    if (milestone) spawnBubble("SYSTEM", "MILESTONE REACHED!");
    let scene = brain.onTap();
    if (scene) queueScene(scene);
    audio.sting(id);
    updateUI();
}

function queueScene(scene) {
    if (!scene) return;
    scene.forEach(line => speechQueue.push({ speaker: line[0], text: line[1], delay: 3.0 }));
}

function bindCreatures() {
    CREATURES.forEach(c => {
        const el = document.getElementById(c.id);
        if (el) el.addEventListener("click", () => tapCreature(c.id));
    });
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
        let p = document.createElement("div");
        p.className = "particle";
        let size = Math.random() * 4 + 2;
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

    let newScene = brain.update(dt);
    if (newScene) queueScene(newScene);

    if (speechQueue.length > 0) {
        speechTimer += dt;
        if (speechTimer >= speechQueue[0].delay) {
            speechTimer = 0;
            let item = speechQueue.shift();
            spawnBubble(item.speaker, item.text);
        }
    }

    CREATURES.forEach(c => {
        let el = c.id === "solon" ? document.getElementById("solon-group") : document.getElementById(c.id);
        if (!el) return;

        if (c.talkTimer > 0) c.talkTimer -= dt;
        updateBlink(c, dt);
        updateCreatureSprite(c, now);

        const driftX = Math.sin((now * c.speed) + c.phase) * 15; // Reduced drift
        const driftY = Math.cos((now * c.speed * 1.5) + c.phase) * 8;

        el.style.left = `${c.x * 100}%`;
        el.style.top = `${c.y * 100}%`;
        el.style.transform = `translate(${driftX}px, ${driftY}px)`;
    });

    updateSolonFins(dt);
    updateBubbles(time);
    requestAnimationFrame(animate);
}

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
    spawnParticles();
    
    document.getElementById("feed-btn")?.addEventListener("click", () => {
        let scene = brain.onFeed();
        if (scene) queueScene(scene);
    });

    requestAnimationFrame(animate);
});