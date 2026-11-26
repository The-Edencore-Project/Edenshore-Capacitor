// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V3.6 - Sprite Scale Fix)
// =====================================================================

// --- Core State ---
let lastTime = 0;
let time_elapsed = 0;
let isDimmed = false;
let isMuted = false;
let debugMode = false;

// --- Timers ---
let riddleTimer = 0;
let idleTimer = 0; 
let uiTickTimer = 0;
let currentMood = "NORMAL";
let readCooldown = 0; 

// --- Creature Registry ---
const creatureState = {
    solon:  { el: null, x: 0, y: 0, baseX: 0.3, baseY: 0.55, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    prism:  { el: null, x: 0, y: 0, baseX: 0.7, baseY: 0.55, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    lumen:  { el: null, x: 0, y: 0, baseX: 0.2, baseY: 0.35, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    ripple: { el: null, x: 0, y: 0, baseX: 0.75, baseY: 0.35, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    vertex: { el: null, x: 0, y: 0, baseX: 0.5, baseY: 0.12, talkTimer: 0, blinkTimer: 0, nextBlink: 0 }
};

// --- DOM Elements ---
const sceneEl = document.getElementById('scene');
const shadowLayer = document.getElementById('shadow-layer');
const debugOverlay = document.getElementById('debug-overlay');

// =====================================================================
// INITIALIZATION & SPRITE SCALING
// =====================================================================

function initShadows() {
    for (const key in creatureState) {
        const shadow = document.createElement('div');
        shadow.className = 'creature-shadow';
        shadow.id = `shadow-${key}`;
        shadowLayer.appendChild(shadow);
    }
}

function initTentacles() {
    const lumenEl = document.getElementById('lumen');
    if (!lumenEl) return;
    for (let i = 0; i < 6; i++) {
        const tentacle = document.createElement('div');
        tentacle.className = 'lumen-tentacle';
        tentacle.style.left = `${15 + (i * 12)}%`;
        tentacle.style.height = `${20 + Math.random() * 20}px`;
        tentacle.style.animationDelay = `${Math.random() * 2}s`;
        lumenEl.appendChild(tentacle);
    }
}

function applySpriteScaling() {
    // The 512 Math Rule
    for (const key in creatureState) {
        const c = creatureState[key];
        if (c.el && c.el.dataset.scale) {
            const scaleFactor = parseFloat(c.el.dataset.scale);
            // 512 is the base width in your Constitution
            const renderWidth = 512 * scaleFactor; 
            
            // If it's an IMG tag, set width directly. 
            // If it's Solon (a DIV), let the CSS handle his inner layers, but scale the container.
            if (c.el.tagName === 'IMG') {
                c.el.style.width = `${renderWidth}px`;
                c.el.style.height = 'auto';
            } else if (key === 'solon') {
                // Solon is already hardcoded to 150px in CSS, but we can scale him here too if needed.
                // For now, let's keep his specific CSS size to avoid breaking his fins.
            }
        }
    }
}

function init() {
    console.log("[Edencore] Initializing Orchestrator...");

    creatureState.solon.el = document.getElementById('solon');
    creatureState.prism.el = document.getElementById('prism');
    creatureState.lumen.el = document.getElementById('lumen');
    creatureState.ripple.el = document.getElementById('ripple');
    creatureState.vertex.el = document.getElementById('vertex');

    // APPLY SCALING IMMEDIATELY
    applySpriteScaling();

    if (window.loadSave) {
        const save = window.loadSave();
        if (window.updateBondUI) window.updateBondUI(save.bond || 0);
    }

    initShadows();
    initTentacles();
    resize();

    for (const key in creatureState) {
        creatureState[key].nextBlink = time_elapsed + Math.random() * 5;
    }

    requestAnimationFrame(tick);

    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.addEventListener('click', () => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
            if (window.audioManager) window.audioManager.start();
        });
    }
}

// =====================================================================
// PACING LOGIC (Director Note #5)
// =====================================================================

window.calculateReadTime = function(conversation) {
    if (!conversation || !Array.isArray(conversation)) return 0;

    let totalWords = 0;
    conversation.forEach(line => {
        if (line[1]) {
            totalWords += line[1].split(' ').length;
        }
    });

    let time = (totalWords / 3) + (conversation.length * 2.5) + 2;
    readCooldown = Math.max(5, time);
    idleTimer = -10; 
};

// =====================================================================
// RESIZE & LAYOUT
// =====================================================================

function resize() {
    // Re-apply scaling in case of orientation change
    applySpriteScaling();
    if (window.physicsEngine) window.physicsEngine.resize();
    if (window.choreographyEngine) window.choreographyEngine.resize();
}

window.addEventListener('resize', resize);

// =====================================================================
// USER INTERACTION
// =====================================================================

function handleCreatureTap(id) {
    if (readCooldown > 0) return;
    if (window.audioManager) window.audioManager.sting(id);
    if (window.brain) window.brain.addBond(1);

    idleTimer = 0;

    if (window.dialogueEngine) {
        const reaction = window.drawFromBank('reactions_tap');
        if (reaction) {
            window.dialogueEngine.queueSpeech(reaction);
            if (window.calculateReadTime) window.calculateReadTime(reaction);
        } else {
            const grunt = window.drawFromBank('tap_grunts');
            if (grunt) {
                window.dialogueEngine.queueSpeech(grunt);
                if (window.calculateReadTime) window.calculateReadTime(grunt);
            }
        }
    }
}

function spawnFood() {
    if (readCooldown > 0) return;

    const foodEl = document.createElement('div');
    foodEl.className = 'food-particle';
    foodEl.style.left = `${20 + Math.random() * 60}%`;
    foodEl.style.top = `-20px`;
    sceneEl.appendChild(foodEl);

    if (window.dialogueEngine) {
        const feedReaction = window.drawFromBank('reactions_feed');
        if (feedReaction) {
            window.dialogueEngine.queueSpeech(feedReaction);
            if (window.calculateReadTime) window.calculateReadTime(feedReaction);
        }
    }
}

function updateFood(dt) {
    const foods = document.querySelectorAll('.food-particle');
    foods.forEach(food => {
        let top = parseFloat(food.style.top) || 0;
        top += 50 * dt; 
        food.style.top = `${top}px`;
        if (top > window.innerHeight) {
            food.remove();
        }
    });
}

// =====================================================================
// DEBUG HUD
// =====================================================================

function updateDebugHUD() {
    if (!debugMode) {
        debugOverlay.style.display = 'none';
        return;
    }
    debugOverlay.style.display = 'block';

    const netOutput = window.arbiter && window.arbiter.lastOutput ? window.arbiter.lastOutput.map(n => n.toFixed(2)).join(', ') : "N/A";

    debugOverlay.innerHTML = `
        <div style="color: #0f0; font-family: monospace; font-size: 12px; line-height: 1.4; padding: 10px; background: rgba(0,0,0,0.7); border: 1px solid #0f0; border-radius: 5px; width: fit-content; position: absolute; top: 120px; left: 10px; pointer-events: none;">
            Mood: ${currentMood}<br>
            Sleep: ${window.brain ? window.brain.sleepState : 'N/A'}<br>
            Read Lock: ${readCooldown > 0 ? readCooldown.toFixed(1) + 's' : 'OFF'}<br>
            Idle: ${idleTimer > 0 ? idleTimer.toFixed(1) + 's' : '0s'}<br>
            Net: [${netOutput}]
        </div>
    `;
}

// =====================================================================
// MASTER TICK LOOP
// =====================================================================

function tick(currentTime) {
    requestAnimationFrame(tick);

    if (!lastTime) lastTime = currentTime;
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (dt > 0.1) dt = 0.1; 
    time_elapsed += dt;

    if (readCooldown > 0) {
        readCooldown -= dt;
    }

    if (window.brain) {
        window.brain.update(dt);
        currentMood = window.brain.currentMood || "NORMAL";
        if (window.brain.sleepState) {
            if (time_elapsed < 30 && window.brain.sleepState === "SLEEPING") {
                window.brain.sleepState = "AWAKE";
            }
        }
    }

    if (window.dialogueEngine) {
        window.dialogueEngine.update(dt);
    }

    if (window.choreographyEngine) {
        const formation = window.choreographyEngine.getFormation(
            window.brain && window.brain.sleepState === "SLEEPING" ? "HUDDLE" : "NORMAL", 
            window.innerWidth, window.innerHeight, time_elapsed
        );

        for (const key in formation) {
            if (creatureState[key]) {
                creatureState[key].targetX = formation[key].x * window.innerWidth;
                creatureState[key].targetY = formation[key].y * window.innerHeight;
            }
        }
    }

    if (window.atmosphereEngine) window.atmosphereEngine.update(dt, currentMood);
    if (window.physicsEngine) {
        window.physicsEngine.update(dt, time_elapsed, currentMood, document.querySelectorAll('.creature-shadow'));
    }

    let activeTalker = null;

    for (const key in creatureState) {
        const c = creatureState[key];
        if (!c.el) continue;

        if (c.targetX !== undefined && c.targetY !== undefined) {
            c.x += (c.targetX - c.x) * 2 * dt;
            c.y += (c.targetY - c.y) * 2 * dt;
            c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
        }

        c.nextBlink -= dt;
        if (c.nextBlink <= 0) {
            c.blinkTimer = 0.15; 
            c.nextBlink = 3 + Math.random() * 5; 
        }

        const isTalking = c.talkTimer > 0;
        if (isTalking) {
            c.talkTimer -= dt;
            activeTalker = key;
        }

        if (c.el.tagName === 'IMG') {
            const baseSrc = `assets/images/${key}`;
            if (isTalking) {
                c.el.src = `${baseSrc}_talk.png`;
            } else if (c.blinkTimer > 0) {
                c.el.src = `${baseSrc}_blink.png`;
                c.blinkTimer -= dt;
            } else {
                c.el.src = `${baseSrc}.png`;
            }
        }
    }

    if (readCooldown <= 0 && currentMood === "NORMAL" && !activeTalker && time_elapsed > 15) {
        idleTimer += dt;

        if (idleTimer > 25) {
            if (window.dialogueEngine) {
                const chatter = window.drawFromBank('chatter');
                if (chatter) {
                    window.dialogueEngine.queueSpeech(chatter);
                    if (window.calculateReadTime) window.calculateReadTime(chatter);
                }
            }
            idleTimer = 0; 
        }
    } else if (readCooldown > 0 || activeTalker) {
        idleTimer = 0; 
    }

    uiTickTimer += dt;
    if (uiTickTimer > 0.5) {
        updateDebugHUD();
        uiTickTimer = 0;
    }
}

// =====================================================================
// BOOT
// =====================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}