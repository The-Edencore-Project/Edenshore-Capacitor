// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V5.2 - Everything Wired)
// =====================================================================

let lastTime = 0;
let time_elapsed = 0;
let debugMode = false;
let idleTimer = 0; 
let uiTickTimer = 0;
let currentMood = "NORMAL";
let readCooldown = 0; 

const creatureState = {
    solon:  { el: null, x: 0, y: 0, w: 180, h: 180, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    prism:  { el: null, x: 0, y: 0, w: 140, h: 140, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    lumen:  { el: null, x: 0, y: 0, w: 100, h: 100, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    ripple: { el: null, x: 0, y: 0, w: 190, h: 190, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    vertex: { el: null, x: 0, y: 0, w: 130, h: 130, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 }
};
window.creatureState = creatureState;

const sceneEl = document.getElementById('scene');
const particleLayer = document.getElementById('particle-layer');
const bgGradient = document.getElementById('bg-gradient');
const debugOverlay = document.getElementById('debug-overlay');

function init() {
    console.log("[Edencore] Initializing V5.2...");

    for (const key in creatureState) {
        creatureState[key].el = document.getElementById(key);
    }

    // 1. Wire Biomes
    document.querySelectorAll('.biome-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const biome = e.target.dataset.biome;
            bgGradient.className = `biome-${biome.toLowerCase()}`;
            if (window.drawFromBank && window.dialogueEngine) {
                const convo = window.drawFromBank('biome', biome);
                if (convo) window.dialogueEngine.queueSpeech(convo);
            }
        });
    });

    // 2. Wire Buttons
    document.getElementById('btn-feed').addEventListener('click', spawnFood);
    document.getElementById('btn-sleep').addEventListener('click', toggleSleep);
    document.getElementById('btn-menu').addEventListener('click', () => debugMode = !debugMode);

    // 3. Spawn Ambient Bubbles
    spawnAmbientBubbles();

    requestAnimationFrame(tick);
}

function spawnAmbientBubbles() {
    if (!particleLayer) return;
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = 4 + Math.random() * 12;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${8 + Math.random() * 10}s`;
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        bubble.style.setProperty('--dx', `${(Math.random() - 0.5) * 50}px`);
        particleLayer.appendChild(bubble);
    }
}

function spawnFood() {
    if (readCooldown > 0) return;
    const foodEl = document.createElement('div');
    foodEl.className = 'food-particle';
    foodEl.style.left = `${20 + Math.random() * 60}%`;
    foodEl.style.top = `-20px`;
    foodEl.dataset.falling = "true";
    if (sceneEl) sceneEl.appendChild(foodEl);
    
    if (window.drawFromBank && window.dialogueEngine) {
        const convo = window.drawFromBank('reactions_feed');
        if (convo) window.dialogueEngine.queueSpeech(convo);
    }
}

function updateFood(dt) {
    document.querySelectorAll('.food-particle').forEach(food => {
        let top = parseFloat(food.style.top) || 0;
        top += 150 * dt; 
        food.style.top = `${top}px`;
        if (top > window.innerHeight) food.remove();
    });
}

function toggleSleep() {
    if (window.brain) {
        window.brain.sleepState = window.brain.sleepState === "SLEEPING" ? "AWAKE" : "SLEEPING";
    }
}

function updateDebugHUD() {
    if (!debugMode || !debugOverlay) {
        if (debugOverlay) debugOverlay.style.display = 'none';
        return;
    }
    debugOverlay.style.display = 'block';
    debugOverlay.innerHTML = `
        <div style="color: #0f0; font-family: monospace; font-size: 12px; padding: 10px; background: rgba(0,0,0,0.7); border: 1px solid #0f0;">
            Mood: ${currentMood}<br>
            Sleep: ${window.brain ? window.brain.sleepState : 'N/A'}<br>
            Read Lock: ${readCooldown > 0 ? readCooldown.toFixed(1) : 'OFF'}<br>
            Idle: ${idleTimer.toFixed(1)}
        </div>
    `;
}

function tick(now) {
    requestAnimationFrame(tick);
    try {
        if (!lastTime) lastTime = now;
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        if (dt > 0.1) dt = 0.1; 
        time_elapsed += dt;

        if (readCooldown > 0) readCooldown -= dt;

        if (window.brain) {
            window.brain.update(dt);
            currentMood = window.brain.currentMood || "NORMAL";
        }
        if (window.dialogueEngine) window.dialogueEngine.update(dt);

        // Formation
        let formation = null;
        if (window.choreographyEngine) {
            const state = (window.brain && window.brain.sleepState === "SLEEPING") ? "HUDDLE" : "NORMAL";
            formation = window.choreographyEngine.getFormation(state, window.innerWidth, window.innerHeight, time_elapsed);
        }

        let activeTalker = null;
        for (const key in creatureState) {
            const c = creatureState[key];
            if (!c.el) continue;

            let targetX = window.innerWidth / 2 - c.w/2;
            let targetY = window.innerHeight / 2 - c.h/2;
            
            if (formation && formation[key]) {
                targetX = formation[key].x - c.w / 2;
                targetY = formation[key].y - c.h / 2;
            }

            c.x += (targetX - c.x) * 2 * dt;
            c.y += (targetY - c.y) * 2 * dt;
            c.el.style.transform = `translate(${c.x + c.offX}px, ${c.y + c.offY}px)`;

            const isTalking = c.talkTimer > 0;
            if (isTalking) {
                c.talkTimer -= dt;
                activeTalker = key;
            }
            
            if (c.el.tagName === 'IMG') {
                const baseSrc = `assets/images/${key}`;
                if (isTalking) c.el.src = `${baseSrc}_talk.png`;
                else c.el.src = `${baseSrc}.png`;
            }
        }

        // Physics
        if (window.physicsEngine) {
            const shadows = {};
            for (const key in creatureState) shadows[key] = document.getElementById(`shadow-${key}`);
            window.physicsEngine.update(dt, time_elapsed, currentMood, creatureState, shadows);
        }

        updateFood(dt);

        // Chatter
        if (readCooldown <= 0 && !activeTalker && time_elapsed > 15) {
            idleTimer += dt;
            if (idleTimer > 25) {
                if (window.drawFromBank && window.dialogueEngine) {
                    const chatter = window.drawFromBank('chatter');
                    if (chatter) window.dialogueEngine.queueSpeech(chatter);
                }
                idleTimer = 0; 
            }
        } else {
            idleTimer = 0;
        }

        uiTickTimer += dt;
        if (uiTickTimer > 0.5) {
            updateDebugHUD();
            uiTickTimer = 0;
        }
    } catch (e) {
        console.error(e);
    }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();