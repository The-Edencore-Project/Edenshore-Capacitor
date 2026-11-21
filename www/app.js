import { loadSave, saveData, addBond, getStatus } from './save.js';
import { Brain } from './brain.js';

let save = loadSave();
let brain = new Brain(save);
let lastTime = 0;

const CREATURES = [
    { id: "solon", x: 0.30, y: 0.55, speed: 0.5, phase: 0, talkTimer: 0 },
    { id: "prism", x: 0.70, y: 0.55, speed: 1.2, phase: 1.5, talkTimer: 0 },
    { id: "lumen", x: 0.20, y: 0.35, speed: 0.8, phase: 2.0, talkTimer: 0 },
    { id: "ripple", x: 0.75, y: 0.35, speed: 0.6, phase: 3.0, talkTimer: 0 },
    { id: "vertex", x: 0.50, y: 0.15, speed: 1.0, phase: 4.0, talkTimer: 0 }
];

let speechQueue = [];
let speechTimer = 0;

function updateUI() {
    const el = document.getElementById("bond-text");
    if (el) el.textContent = getStatus(save);
}

function showDialogue(speaker, text) {
    const box = document.getElementById("dialogue-box");
    if (box) box.innerHTML = `<strong>${speaker}:</strong> ${text}`;
}

function tapCreature(id) {
    let milestone = addBond(save, 1);
    if (milestone) showDialogue("SYSTEM", "MILESTONE REACHED!");
    
    let scene = brain.onTap();
    if (scene) queueScene(scene);
    
    let c = CREATURES.find(c => c.id === id);
    if(c) c.talkTimer = 2.0;
    updateUI();
}

function queueScene(scene) {
    if (!scene) return;
    scene.forEach(line => speechQueue.push({ speaker: line[0], text: line[1], delay: 2.5 }));
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
            showDialogue(item.speaker, item.text);
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
