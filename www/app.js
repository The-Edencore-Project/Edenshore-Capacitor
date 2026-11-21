import { loadSave, saveData, addBond, getStatus } from './save.js';
import { Brain } from './brain.js';
import { audio } from './audio.js';

let save = loadSave();
let brain = new Brain(save);
let lastTime = 0;

const CREATURES = [
    { id: "solon", name: "Solon", x: 0.25, y: 0.55, speed: 0.5, phase: 0, talkTimer: 0, blinkTimer: 3.0, isBlinking: false },
    { id: "prism", name: "Prism", x: 0.75, y: 0.55, speed: 1.2, phase: 1.5, talkTimer: 0, blinkTimer: 4.0, isBlinking: false },
    { id: "lumen", name: "Lumen", x: 0.15, y: 0.35, speed: 0.8, phase: 2.0, talkTimer: 0, blinkTimer: 5.0, isBlinking: false },
    { id: "ripple", name: "Ripple", x: 0.85, y: 0.35, speed: 0.6, phase: 3.0, talkTimer: 0, blinkTimer: 6.0, isBlinking: false },
    { id: "vertex", name: "Vertex", x: 0.50, y: 0.15, speed: 1.0, phase: 4.0, talkTimer: 0, blinkTimer: 2.0, isBlinking: false }
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

    let el = document.getElementById(c.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + (rect.width / 2);
    let spawnY = rect.top - 100; 
    if (spawnY < 100) spawnY = rect.bottom + 20; 

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    
    let width = Math.max(120, Math.min(280, text.length * 10 + 40));
    let height = Math.max(60, Math.min(120, text.length * 3 + 40));
    
    bubble.style.width = `${width}px`;
    bubble.style.height = `${height}px`;
    bubble.style.left = `${cx - width/2}px`;
    bubble.style.top = `${spawnY}px`;
    
    document.body.appendChild(bubble);

    let startTime = performance.now();
    activeBubbles.push({ el: bubble, startTime: startTime, life: 6000, startX: cx - width/2, startY: spawnY });
    c.talkTimer = 2.0;
}

function updateBubbles(now) {
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        let b = activeBubbles[i];
        let progress = (now - b.startTime) / b.life;
        if (progress >= 1.0) { b.el.remove(); activeBubbles.splice(i, 1); continue; }
        let currentY = b.startY - (progress * 80);
        let currentX = b.startX + Math.sin(progress * Math.PI * 3) * 15;
        let alpha = 1.0;
        if (progress < 0.1) alpha = progress / 0.1;
        if (progress > 0.7) alpha = (1.0 - progress) / 0.3;
        b.el.style.transform = `translate(${currentX - b.startX}px, ${currentY - b.startY}px)`;
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
    if (!audio.hasStarted) audio.start();
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
        // Special group handling for Solon
        let el = c.id === "solon" ? document.getElementById("solon-group") : document.getElementById(c.id);
        if (!el) return;

        if (c.talkTimer > 0) c.talkTimer -= dt;
        updateBlink(c, dt);
        updateCreatureSprite(c, now);

        const driftX = Math.sin((now * c.speed) + c.phase) * 20;
        const driftY = Math.cos((now * c.speed * 1.5) + c.phase) * 10;

        el.style.left = `${c.x * 100}%`;
        el.style.top = `${c.y * 100}%`;
        el.style.transform = `translate(${driftX}px, ${driftY}px)`;
    });

    updateSolonFins(dt);
    updateBubbles(time);
    requestAnimationFrame(animate);
}

window.addEventListener("DOMContentLoaded", () => {
    save.visits = (save.visits || 0) + 1;
    saveData(save);
    updateUI();
    bindCreatures();
    initBiomes();
    spawnParticles();
    
    document.getElementById("feed-btn")?.addEventListener("click", () => {
        if (!audio.hasStarted) audio.start();
        let scene = brain.onFeed();
        if (scene) queueScene(scene);
    });

    requestAnimationFrame(animate);
});