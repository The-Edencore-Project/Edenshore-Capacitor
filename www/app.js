// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V3.3 - Final Bug Fix)
// =====================================================================

const state = { time_elapsed: 0, base_scroll: 0, lastDebugFrame: -1, hasGreeted: false };
let gameState = "normal";
let currentRiddle = null;
let riddleTimer = 0;
let lumenTentacles = [];
let foodParticles = [];
let feedingTimer = 0;

const creatureData = {
    solon:  { baseX: 0.30, baseY: 0.55, scale: 0.20, name: "Solon" },
    prism:  { baseX: 0.70, baseY: 0.55, scale: 0.26, name: "Prism" },
    lumen:  { baseX: 0.20, baseY: 0.35, scale: 0.18, name: "Lumen" },
    ripple: { baseX: 0.75, baseY: 0.35, scale: 0.36, name: "Ripple" },
    vertex: { baseX: 0.50, baseY: 0.12, scale: 0.24, name: "Vertex" }
};
const creatureKeys = Object.keys(creatureData);
let shadowElements = {};

function initShadows() {
    const shadowLayer = document.getElementById('shadow-layer');
    if (!shadowLayer) return;
    for (const id of creatureKeys) {
        const shadow = document.createElement('div');
        shadow.className = 'creature-shadow';
        shadow.id = `shadow-${id}`;
        shadowLayer.appendChild(shadow);
        shadowElements[id] = shadow;
        if (window.physicsEngine) {
            window.physicsEngine.registerCreature(id, creatureData[id].baseX, creatureData[id].baseY, creatureData[id].scale);
        }
    }
}

function initTentacles() {
    const lumenEl = document.getElementById('lumen');
    if (!lumenEl) return;
    document.querySelectorAll('.lumen-tentacle').forEach(el => el.remove());
    lumenTentacles = [];
    for (let i = 0; i < 5; i++) {
        const t = document.createElement('div');
        t.className = 'lumen-tentacle';
        document.getElementById('scene').appendChild(t);
        lumenTentacles.push(t);
    }
}

function updateTentacles() {
    const lumenEl = document.getElementById('lumen');
    if (!lumenEl || lumenTentacles.length === 0) return;
    const rect = lumenEl.getBoundingClientRect();
    const baseX = rect.left + rect.width / 2;
    const baseY = rect.top + rect.height * 0.8;
    const len = rect.height * 1.2;

    lumenTentacles.forEach((t, idx) => {
        const offsetX = (idx - 2) * (rect.width * 0.1);
        const sway = Math.sin(state.time_elapsed * 2.0 + idx * 1.3) * (rect.width * 0.15);
        t.style.left = `${baseX + offsetX + sway}px`;
        t.style.top = `${baseY}px`;
        t.style.height = `${len}px`;
        t.style.transform = `rotate(${(idx - 2) * 5}deg)`;
    });
}

function resize() {
    const baseSize = Math.min(window.innerWidth, window.innerHeight);
    document.querySelectorAll('.creature').forEach(el => {
        const scale = parseFloat(el.dataset.scale);
        const size = baseSize * scale;
        el.style.width = size + 'px';
        el.style.height = 'auto';
        const id = el.id;
        if (creatureData[id]) {
            const cx = window.innerWidth * creatureData[id].baseX;
            const cy = window.innerHeight * (1.0 - creatureData[id].baseY); 
            el.style.left = (cx - size / 2) + 'px';
            el.style.top = (cy - size / 2) + 'px';
        }
    });
    if (window.physicsEngine) window.physicsEngine.resize();
    if (window.choreographyEngine) window.choreographyEngine.resize();
}

function triggerRiddle() {
    const bank = window.getBank("riddles");
    if (!bank || bank.length === 0) return;
    const riddle = bank[Math.floor(Math.random() * bank.length)];
    currentRiddle = riddle;
    gameState = "riddle_wait";
    riddleTimer = 15;
    window.dialogue.queueSpeech(riddle);
    document.getElementById('status-text').innerText = "RIDDLE: Tap the correct creature!";
    document.getElementById('status-text').style.color = "#FFD700";
    document.querySelectorAll('.creature').forEach(el => el.classList.add('riddle-target'));
}

function handleCreatureTap(id) {
    if (gameState === "riddle_wait" && currentRiddle) {
        const speaker = creatureData[id].name;
        if (speaker === currentRiddle.correct_speaker) {
            window.dialogue.queueSpeech(currentRiddle.correct_reply);
            window.brain.addBond(5);
            document.getElementById('status-text').innerText = "CORRECT! +5 BOND";
            document.getElementById('status-text').style.color = "#00FF00";
        } else {
            window.dialogue.queueSpeech(currentRiddle.wrong_reply);
            document.getElementById('status-text').innerText = "WRONG!";
            document.getElementById('status-text').style.color = "#FF0000";
        }
        gameState = "normal";
        currentRiddle = null;
        document.querySelectorAll('.creature').forEach(el => el.classList.remove('riddle-target'));
        setTimeout(() => { document.getElementById('status-text').innerText = ""; }, 3000);
    } else {
        window.brain.addBond(1);
        if (window.dialogue) window.dialogue.triggerBank("tap_reactions");
    }
}

function spawnFood() {
    feedingTimer = 10.0;
    const scene = document.getElementById('scene');
    for (let i = 0; i < 15; i++) {
        const f = document.createElement('div');
        f.className = 'food-particle';
        const startX = window.innerWidth * 0.5 + (Math.random() - 0.5) * (window.innerWidth * 0.6);
        f.style.left = startX + 'px';
        f.style.top = '-20px';
        scene.appendChild(f);
        foodParticles.push({ el: f, x: startX, y: -20, vy: 80 + Math.random() * 60 });
    }
    if (window.dialogue) window.dialogue.triggerBank("feed_reactions");
}

function updateFood(dt) {
    if (feedingTimer > 0) feedingTimer -= dt;
    for (let i = foodParticles.length - 1; i >= 0; i--) {
        const f = foodParticles[i];
        f.y += f.vy * dt;
        f.el.style.top = f.y + 'px';
        if (f.y > window.innerHeight || feedingTimer <= 0) {
            f.el.remove();
            foodParticles.splice(i, 1);
        }
    }
}

function updateDebugHUD() {
    const dbg = document.getElementById('debug-overlay');
    if (!dbg || !window.brain) return;
    
    const currentFrame = Math.floor(state.time_elapsed * 5);
    if (currentFrame === state.lastDebugFrame) return;
    state.lastDebugFrame = currentFrame;

    const mood = window.brain.mood || "NORMAL";
    const sleep = window.brain.sleepState || "AWAKE";
    const motion = (window.brain.motion || 0).toFixed(2);
    const battery = (window.brain.battery || 1).toFixed(2);
    const heat = (window.brain.heat || 0).toFixed(1);
    const netOutput = window.brain.lastNetOutput 
        ? window.brain.lastNetOutput.map(v => v.toFixed(2)).join(", ") 
        : "0.25, 0.25, 0.25, 0.25";

    dbg.innerHTML = 
        `Mood: ${mood}<br>` +
        `Sleep: ${sleep}<br>` +
        `Light: 0.50 | Temp: 0.60<br>` +
        `Motion: ${motion} | Batt: ${battery}<br>` +
        `Heat: ${heat} | Rhythm: 1.0s<br>` +
        `Net: [${netOutput}]`;
}

let lastTime = performance.now();

function tick(currentTime) {
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;
    const safeDt = Math.min(dt, 0.1); 

    state.time_elapsed += safeDt;
    if (window.brain) window.brain.update(safeDt); 

    state.base_scroll += safeDt * 100; 
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    // Riddle Timer
    if (gameState === "riddle_wait") {
        riddleTimer -= safeDt;
        if (riddleTimer <= 0) {
            gameState = "normal";
            currentRiddle = null;
            document.querySelectorAll('.creature').forEach(el => el.classList.remove('riddle-target'));
            const st = document.getElementById('status-text');
            if (st) { st.innerText = "Too slow!"; st.style.color = "#FF0000"; setTimeout(() => { st.innerText = ""; }, 3000); }
        }
    }

    const currentMood = window.brain ? window.brain.mood : "NORMAL";
    if (window.weatherEngine) window.weatherEngine.update(safeDt, currentMood);
    if (window.cinematicEngine) window.cinematicEngine.update(safeDt);
    
    if (window.physicsEngine) {
        window.physicsEngine.update(safeDt, state.time_elapsed, currentMood, shadowElements);
    }

    // Choreography takes full control of position
    if (window.choreographyEngine && window.physicsEngine) {
        let stateStr = currentMood;
        if (feedingTimer > 0) stateStr = "FEEDING";
        
        const formation = window.choreographyEngine.getFormation(
            stateStr, window.innerWidth, window.innerHeight, state.time_elapsed, feedingTimer
        );
        
        for (let i = 0; i < creatureKeys.length; i++) {
            const id = creatureKeys[i];
            if (window.physicsEngine.creatures[id] && formation[i]) {
                const c = window.physicsEngine.creatures[id];
                c.x += (formation[i].x - c.x) * safeDt * 2.0;
                c.y += (formation[i].y - c.y) * safeDt * 2.0;
                
                const el = document.getElementById(id);
                if (el) {
                    const basePxX = window.innerWidth * creatureData[id].baseX;
                    const basePxY = window.innerHeight * (1.0 - creatureData[id].baseY);
                    el.style.transform = `translate(${c.x - basePxX}px, ${c.y - basePxY}px)`;
                }
            }
        }
    }

    // Sprite States
    for (const id of creatureKeys) {
        const el = document.getElementById(id);
        if (!el) continue;
        const isTalking = window.brain && window.brain.talkingCreature === id;
        const isBlinking = window.brain && window.brain.blinkTimer > 3.0 && window.brain.blinkTimer < 3.2;
        const isSleeping = window.brain && window.brain.sleepState !== "AWAKE";

        if (id === "solon" && window.solonActor) {
            window.solonActor.update(state.time_elapsed, currentMood, isTalking, isBlinking || isSleeping);
        } else {
            let stateStr = "";
            if (isSleeping) stateStr = "_blink";
            else if (isTalking) { if (Math.floor(state.time_elapsed / 0.15) % 2 === 0) stateStr = "_talk"; }
            else if (isBlinking) stateStr = "_blink";
            
            const newSrc = stateStr ? `assets/images/${id}${stateStr}.png` : `assets/images/${id}.png`;
            if (el.src.indexOf(newSrc) === -1) el.src = newSrc;
        }
    }

    updateTentacles();
    updateFood(safeDt);
    updateDebugHUD();

    // Auto-Greeting & Ambient
    if (!state.hasGreeted && state.time_elapsed > 2.0) {
        state.hasGreeted = true;
        if (window.dialogue) window.dialogue.triggerBank("greetings");
    }
    if (state.time_elapsed > 15.0 && gameState === "normal" && !window.dialogue.isTalking && Math.random() < 0.005) {
        if (window.dialogue) window.dialogue.triggerBank("ambient");
    }

    requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.addEventListener('click', () => {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 800);
            if (window.audio) window.audio.start();
        });
    }
    initShadows();
    initTentacles();
    resize();
    requestAnimationFrame(tick); 
});

// Input Handling
window.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('biome-btn') || e.target.classList.contains('util-btn') || e.target.id === 'splash-screen') return;
    if (e.target.closest('.creature')) {
        handleCreatureTap(e.target.closest('.creature').id);
    } else {
        if (gameState === "normal" && Math.random() > 0.8) {
            window.brain.addBond(1);
            if (window.dialogue) window.dialogue.triggerBank("tap_reactions");
        }
    }
}, { passive: true });

document.querySelectorAll('.biome-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const bg = document.getElementById('bg-gradient');
        if (bg) { bg.className = ''; bg.classList.add(`biome-${e.target.dataset.biome.toLowerCase()}`); }
        if (window.dialogue) window.dialogue.triggerBank(`biome_${e.target.dataset.biome}`);
    });
});

const btnFeed = document.getElementById('btn-feed');
if (btnFeed) btnFeed.addEventListener('click', spawnFood);

const btnSleep = document.getElementById('btn-sleep');
if (btnSleep) btnSleep.addEventListener('click', () => {
    if (window.dialogue) window.dialogue.triggerBank("bedtime_resistance");
    if (window.brain) {
        window.brain.sleepState = "SLEEPING";
        window.brain.mood = "SLEEPY";
    }
});

window.addEventListener('resize', resize);