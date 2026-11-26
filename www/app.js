// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V3.4 - Chatter Integration)
// =====================================================================

// --- Core State ---
let lastTime = 0;
let time_elapsed = 0;
let isDimmed = false;
let isMuted = false;
let debugMode = false;

// --- Timers ---
let riddleTimer = 0;
let idleTimer = 0; // NEW: Tracks time since last dialogue to trigger chatter
let uiTickTimer = 0;
let currentMood = "NORMAL";

// --- Creature Registry ---
// In a full build, creatures.js should populate this. 
// For safety, we define the core state here if they don't exist.
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
const statusText = document.getElementById('status-text');
const bondText = document.getElementById('bond-text');
const bgGradient = document.getElementById('bg-gradient');
const godRays = document.getElementById('god-rays');
const weatherTint = document.getElementById('weather-tint');
const bubbleEl = document.getElementById('ghost-bubble');
const bubbleText = document.getElementById('bubble-text');

// =====================================================================
// INITIALIZATION
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
    // Procedural tentacle generation for Lumen
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

function init() {
    console.log("[Edencore] Initializing Orchestrator...");
    
    // Link DOM elements to state
    creatureState.solon.el = document.getElementById('solon');
    creatureState.prism.el = document.getElementById('prism');
    creatureState.lumen.el = document.getElementById('lumen');
    creatureState.ripple.el = document.getElementById('ripple');
    creatureState.vertex.el = document.getElementById('vertex');

    // Initialize systems
    if (window.loadSave) {
        const save = window.loadSave();
        if (window.updateBondUI) window.updateBondUI(save.bond || 0);
    }
    
    if (window.arbiter) {
        // Initialize Neural Net if needed
    }

    initShadows();
    initTentacles();
    resize();

    // Set initial blink timers to be out of sync
    for (const key in creatureState) {
        creatureState[key].nextBlink = time_elapsed + Math.random() * 5;
    }

    // Boot the loop
    requestAnimationFrame(tick);

    // Splash screen interaction
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
// RESIZE & LAYOUT
// =====================================================================

function resize() {
    if (window.physicsEngine) window.physicsEngine.resize();
    if (window.choreographyEngine) window.choreographyEngine.resize();
}

window.addEventListener('resize', resize);

// =====================================================================
// USER INTERACTION
// =====================================================================

function handleCreatureTap(id) {
    if (window.audioManager) window.audioManager.sting(id);
    if (window.brain) window.brain.addBond(1);
    
    // Reset idle timer on interaction
    idleTimer = 0;

    // Trigger a reaction bank
    if (window.dialogueEngine) {
        const reaction = window.drawFromBank('reactions_tap');
        if (reaction) {
            window.dialogueEngine.queueSpeech(reaction);
        } else {
            // Fallback to grunt
            const grunt = window.drawFromBank('tap_grunts');
            if (grunt) window.dialogueEngine.queueSpeech(grunt);
        }
    }
}

function spawnFood() {
    // Existing food logic
    const foodEl = document.createElement('div');
    foodEl.className = 'food-particle';
    foodEl.style.left = `${20 + Math.random() * 60}%`;
    foodEl.style.top = `-20px`;
    sceneEl.appendChild(foodEl);
    
    // Trigger feed reaction
    if (window.dialogueEngine) {
        const feedReaction = window.drawFromBank('reactions_feed');
        if (feedReaction) window.dialogueEngine.queueSpeech(feedReaction);
    }
}

function updateFood(dt) {
    const foods = document.querySelectorAll('.food-particle');
    foods.forEach(food => {
        let top = parseFloat(food.style.top) || 0;
        top += 50 * dt; // fall speed
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
        <div style="color: #0f0; font-family: monospace; font-size: 12px; line-height: 1.4; padding: 10px; background: rgba(0,0,0,0.7); border: 1px solid #0f0; border-radius: 5px; width: fit-content; position: absolute; top: 60px; left: 10px; pointer-events: none;">
            Mood: ${currentMood}<br>
            Sleep: ${window.brain ? window.brain.sleepState : 'N/A'}<br>
            Light: 0.50 | Temp: 0.60<br>
            Motion: 0.00 | Batt: 0.68<br>
            Heat: 0.0 | Rhythm: 1.0s<br>
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
    
    // Cap dt to prevent huge jumps when tab is inactive
    if (dt > 0.1) dt = 0.1;
    time_elapsed += dt;

    // 1. Update Systems
    if (window.brain) {
        window.brain.update(dt);
        currentMood = window.brain.currentMood || "NORMAL";
        if (window.brain.sleepState) {
            // Force awake for the first 30 seconds
            if (time_elapsed < 30 && window.brain.sleepState === "SLEEPING") {
                window.brain.sleepState = "AWAKE";
            }
        }
    }

    if (window.dialogueEngine) {
        window.dialogueEngine.update(dt);
    }

    // 2. Update Engines
    if (window.choreographyEngine) {
        const formation = window.choreographyEngine.getFormation(
            window.brain && window.brain.sleepState === "SLEEPING" ? "HUDDLE" : "NORMAL", 
            window.innerWidth, window.innerHeight, time_elapsed
        );
        
        // Apply formation targets to state (simplified for this file)
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

    // 3. Creature Updates
    let activeTalker = null;
    
    for (const key in creatureState) {
        const c = creatureState[key];
        if (!c.el) continue;

        // Smooth movement towards target
        if (c.targetX !== undefined && c.targetY !== undefined) {
            c.x += (c.targetX - c.x) * 2 * dt;
            c.y += (c.targetY - c.y) * 2 * dt;
            c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
        }

        // Blink logic
        c.nextBlink -= dt;
        if (c.nextBlink <= 0) {
            c.blinkTimer = 0.15; // Blink duration
            c.nextBlink = 3 + Math.random() * 5; // Next blink in 3-8 seconds
        }

        // Sprite state swapping
        const isTalking = c.talkTimer > 0;
        if (isTalking) {
            c.talkTimer -= dt;
            activeTalker = key;
        }

        // Apply textures (Frame Swapping)
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

    // 4. The Chatter Trigger (NEW)
    // If mood is normal, no one is talking, and it's been quiet for a while...
    if (currentMood === "NORMAL" && !activeTalker && time_elapsed > 10) {
        idleTimer += dt;
        
        // 25 seconds of silence triggers a casual chat
        if (idleTimer > 25) {
            if (window.dialogueEngine) {
                const chatter = window.drawFromBank('chatter');
                if (chatter) {
                    window.dialogueEngine.queueSpeech(chatter);
                }
            }
            // Reset timer so it doesn't spam
            idleTimer = Math.random() * -10; // Stagger the next one
        }
    } else {
        idleTimer = 0; // Reset if someone is talking or mood changes
    }

    // 5. UI Updates
    uiTickTimer += dt;
    if (uiTickTimer > 0.5) {
        updateDebugHUD();
        uiTickTimer = 0;
    }
}

// =====================================================================
// BOOT
// =====================================================================

// Ensure the DOM is ready before booting
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}