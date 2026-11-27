// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V5.5 - Wake on Tap)
// =====================================================================

let lastTime = 0;
let time_elapsed = 0;
let debugMode = false;
let idleTimer = 0; 
let uiTickTimer = 0;
let currentMood = "NORMAL";
let readCooldown = 0; 
let flipperTimer = 0;

const creatureState = {
    solon:  { el: null, x: 0, y: 0, w: 160, h: 160, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    prism:  { el: null, x: 0, y: 0, w: 120, h: 120, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    lumen:  { el: null, x: 0, y: 0, w: 90, h: 90, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    ripple: { el: null, x: 0, y: 0, w: 170, h: 170, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    vertex: { el: null, x: 0, y: 0, w: 120, h: 120, offX: 0, offY: 0, talkTimer: 0, blinkTimer: 0, nextBlink: 0 }
};
window.creatureState = creatureState;

const sceneEl = document.getElementById('scene');
const particleLayer = document.getElementById('particle-layer');
const bgGradient = document.getElementById('bg-gradient');
const debugOverlay = document.getElementById('debug-overlay');

let activeBubbles = [];

function init() {
    console.log("[Edencore] Initializing V5.5...");

    for (const key in creatureState) {
        creatureState[key].el = document.getElementById(key);
    }

    // --- THE WAKE UP TAP ---
    if (sceneEl) {
        sceneEl.addEventListener('pointerdown', (e) => {
            // If asleep, wake them up
            if (window.brain && window.brain.sleepState === "SLEEPING") {
                window.brain.sleepState = "AWAKE";
                if (window.drawFromBank && window.dialogueEngine) {
                    const wakeConvo = window.drawFromBank('waking_nudge');
                    if (wakeConvo) window.dialogueEngine.queueSpeech(wakeConvo);
                }
            }
        });
    }

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

    document.getElementById('btn-feed').addEventListener('click', spawnFood);
    document.getElementById('btn-sleep').addEventListener('click', toggleSleep);
    document.getElementById('btn-menu').addEventListener('click', () => debugMode = !debugMode);

    spawnAmbientBubbles();
    requestAnimationFrame(tick);
}

function spawnAmbientBubbles() {
    if (!particleLayer) return;
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = 6 + Math.random() * 14;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`; 
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.bottom = `-30px`; 
        bubble.style.position = 'absolute';
        
        activeBubbles.push({
            el: bubble,
            y: window.innerHeight + Math.random() * 100,
            speed: 20 + Math.random() * 30,
            dx: (Math.random() - 0.5) * 40,
            sway: Math.random() * Math.PI * 2
        });
        
        particleLayer.appendChild(bubble);
    }
}

function updateBubbles(dt) {
    activeBubbles.forEach(b => {
        b.y -= b.speed * dt;
        b.sway += dt * 2;
        const xOffset = Math.sin(b.sway) * 10;
        
        b.el.style.transform = `translate(${xOffset}px, ${b.y - window.innerHeight}px)`;
        
        if (b.y < -50) {
            b.y = window.innerHeight + 50;
            b.el.style.left = `${Math.random() * 100}%`;
        }
    });
}

function spawnFood() {
    if (readCooldown > 0) return;
    
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const foodEl = document.createElement('div');
            foodEl.className = 'food-particle';
            foodEl.style.left = `${30 + Math.random() * 40}%`;
            foodEl.style.top = `-20px`;
            if (sceneEl) sceneEl.appendChild(foodEl);
        }, i * 150);
    }
    
    if (window.drawFromBank && window.dialogueEngine) {
        const convo = window.drawFromBank('reactions_feed');
        if (convo) window.dialogueEngine.queueSpeech(convo);
    }
}

function updateFood(dt) {
    document.querySelectorAll('.food-particle').forEach(food => {
        let top = parseFloat(food.style.top) || 0;
        top += 120 * dt; 
        food.style.top = `${top}px`;
        if (top > window.innerHeight - 50) food.remove(); 
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

        updateBubbles(dt);

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

            // Smooth move (This is what brings them back up)
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

        if (window.physicsEngine) {
            const shadows = {};
            for (const key in creatureState) shadows[key] = document.getElementById(`shadow-${key}`);
            window.physicsEngine.update(dt, time_elapsed, currentMood, creatureState, shadows);
        }

        updateFood(dt);

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