import { loadSave, saveData, addBond, getStatus } from './save.js';
import { Brain } from './brain.js';

let save = loadSave();
let brain = new Brain(save);
let lastTime = 0;

const CREATURES = [
    { id: "solon", name: "Solon", x: 0.30, y: 0.55, speed: 0.5, phase: 0, talkTimer: 0 },
    { id: "prism", name: "Prism", x: 0.70, y: 0.55, speed: 1.2, phase: 1.5, talkTimer: 0 },
    { id: "lumen", name: "Lumen", x: 0.20, y: 0.35, speed: 0.8, phase: 2.0, talkTimer: 0 },
    { id: "ripple", name: "Ripple", x: 0.75, y: 0.35, speed: 0.6, phase: 3.0, talkTimer: 0 },
    { id: "vertex", name: "Vertex", x: 0.50, y: 0.15, speed: 1.0, phase: 4.0, talkTimer: 0 }
];

let speechQueue = [];
let speechTimer = 0;
let activeBubbles = [];

function updateUI() {
    const el = document.getElementById("bond-text");
    if (el) el.textContent = getStatus(save);
}

function spawnBubble(speaker, text) {
    let c = CREATURES.find(x => x.name === speaker) || CREATURES.find(x => x.name === "Vertex");
    if (!c) return;

    const el = document.getElementById(c.id);
    if (!el) return;

    // Get bounding box of creature
    const rect = el.getBoundingClientRect();
    
    // Calculate center of creature, then move up
    const cx = rect.left + (rect.width / 2);
    
    // The bubble should spawn above the creature, but not off-screen
    // If the creature is in the top half, bubble spawns BELOW them
    let spawnY = rect.top - 120; 
    if (spawnY < 100) {
        spawnY = rect.bottom + 20; // Spawn below if too close to top
    }

    // Create bubble
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    
    // Dynamically size based on text length, with min/max bounds
    let width = Math.max(120, Math.min(280, text.length * 10 + 40));
    let height = Math.max(60, Math.min(120, text.length * 3 + 40));
    
    bubble.style.width = `${width}px`;
    bubble.style.height = `${height}px`;
    
    // Position it
    bubble.style.left = `${cx - width/2}px`;
    bubble.style.top = `${spawnY}px`;
    
    document.body.appendChild(bubble);

    // Animate
    let startTime = performance.now();
    const life = 6000; // 6 seconds

    activeBubbles.push({
        el: bubble,
        startTime: startTime,
        life: life,
        startX: cx - width/2,
        startY: spawnY,
        driftDir: Math.random() > 0.5 ? 1 : -1
    });

    c.talkTimer = 2.0;
}

function updateBubbles(now) {
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        let b = activeBubbles[i];
        let progress = (now - b.startTime) / b.life;

        if (progress >= 1.0) {
            b.el.remove();
            activeBubbles.splice(i, 1);
            continue;
        }

        // Float up and sway
        let currentY = b.startY - (progress * 80); // Rise 80px over lifetime
        let currentX = b.startX + Math.sin(progress * Math.PI * 3) * 15; // Gentle sway

        // Fade in/out
        let alpha = 1.0;
        if (progress < 0.1) alpha = progress / 0.1;
        if (progress > 0.7) alpha = (1.0 - progress) / 0.3;

        b.el.style.transform = `translate(${currentX - b.startX}px, ${currentY - b.startY}px) scale(${1.0 + progress * 0.1})`;
        b.el.style.opacity = alpha;
    }
}

function tapCreature(id) {
    let milestone = addBond(save, 1);
    if (milestone) spawnBubble("SYSTEM", "MILESTONE REACHED!");
    
    let scene = brain.onTap();
    if (scene) queueScene(scene);
    
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
        const el = document.getElementById(c.id);
        if (!el) return;

        if (c.talkTimer > 0) c.talkTimer -= dt;

        const driftX = Math.sin((now * c.speed) + c.phase) * 20;
        const driftY = Math.cos((now * c.speed * 1.5) + c.phase) * 10;

        el.style.left = `${c.x * 100}%`;
        el.style.top = `${c.y * 100}%`;
        el.style.transform = `translate(${driftX}px, ${driftY}px)`;
    });

    updateBubbles(time);

    requestAnimationFrame(animate);
}

window.addEventListener("DOMContentLoaded", () => {
    save.visits = (save.visits || 0) + 1;
    saveData(save);
    updateUI();
    bindCreatures();
    initBiomes();
    
    document.getElementById("feed-btn")?.addEventListener("click", () => {
        let scene = brain.onFeed();
        if (scene) queueScene(scene);
    });

    requestAnimationFrame(animate);
});