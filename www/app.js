// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V5.1 - Bulletproof Aliveness)
// =====================================================================

// --- Core State ---
let lastTime = 0;
let time_elapsed = 0;
let debugMode = false;

// --- Timers & Flags ---
let idleTimer = 0; 
let uiTickTimer = 0;
let currentMood = "NORMAL";
let readCooldown = 0; 
let firstGreetingDone = false;

// --- Aliveness State ---
let requestTimer = 60;        
let dreamTimer = 12;          

let attention = null;         

// --- Tuning ---
const GREET_AWAY_MS = 10 * 60 * 1000;      
const LONG_AWAY_MS = 6 * 60 * 60 * 1000;   
const FOOD_FULL_MS = 90 * 60 * 1000;       
const ATTN_FULL_MS = 45 * 60 * 1000;       
const NEED_ASK = 0.6;                      
const NEED_SEVERE = 0.8;                   
const REQUEST_GAP = 240;                   
const ATTENTION_SECS = 3.5;                

// --- Creature Registry ---
// We define the base state here. If actors/creatures.js exists, it can override.
const creatureState = window.creatureState || {
    solon:  { el: null, x: 0, y: 0, w: 150, h: 150, offX: 0, offY: 0, flip: 1, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    prism:  { el: null, x: 0, y: 0, w: 133, h: 133, offX: 0, offY: 0, flip: 1, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    lumen:  { el: null, x: 0, y: 0, w: 92,  h: 92,  offX: 0, offY: 0, flip: 1, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    ripple: { el: null, x: 0, y: 0, w: 184, h: 184, offX: 0, offY: 0, flip: 1, talkTimer: 0, blinkTimer: 0, nextBlink: 0 },
    vertex: { el: null, x: 0, y: 0, w: 122, h: 122, offX: 0, offY: 0, flip: 1, talkTimer: 0, blinkTimer: 0, nextBlink: 0 }
};
window.creatureState = creatureState;

// --- DOM Elements ---
const sceneEl = document.getElementById('scene');
const shadowLayer = document.getElementById('shadow-layer');
const debugOverlay = document.getElementById('debug-overlay');
const dimOverlay = document.getElementById('dim-overlay');

// =====================================================================
// SAVE + NEEDS
// =====================================================================
function getSave() {
    if (window.loadSave) return window.loadSave();
    return {};
}
function saveNow() {
    if (window.saveData) window.saveData(getSave());
}
function stamp(field) {
    const s = getSave();
    s[field] = Date.now();
    saveNow();
}
function need(field, fullMs) {
    const s = getSave();
    if (!s[field]) return 0;
    const elapsed = Date.now() - s[field];
    return Math.min(1, elapsed / fullMs);
}
function foodNeed() { return need('last_fed', FOOD_FULL_MS); }
function attentionNeed() { return need('last_touched', ATTN_FULL_MS); }

// =====================================================================
// SETUP HELPERS
// =====================================================================
function initShadows() {
    if (!shadowLayer) return;
    shadowLayer.innerHTML = '';
    for (const key in creatureState) {
        const shadow = document.createElement('div');
        shadow.className = 'creature-shadow';
        shadow.id = `shadow-${key}`;
        shadowLayer.appendChild(shadow);
    }
}

function measureCreatures() {
    for (const key in creatureState) {
        const c = creatureState[key];
        c.el = document.getElementById(key);
        if (c.el) {
            // Force CSS sizing
            if (c.el.tagName === 'IMG' && c.el.dataset.scale) {
                const scale = parseFloat(c.el.dataset.scale);
                const renderWidth = 512 * scale;
                c.el.style.width = `${renderWidth}px`;
                c.el.style.height = 'auto';
                c.w = renderWidth;
                c.h = renderWidth; // approximation
            }
        }
    }
}

function placeCreature(c) {
    if (!c.el) return;
    c.x = window.innerWidth / 2;
    c.y = window.innerHeight / 2;
    c.el.style.transform = `translate(${c.x - c.w/2}px, ${c.y - c.h/2}px)`;
}

function clampTarget(c, t) {
    t.y = Math.min(Math.max(t.y, c.h / 2 + 90), window.innerHeight - 64 - c.h / 2);
}

function isAsleep() {
    return window.brain && window.brain.sleepState === "SLEEPING";
}

function currentStateName() {
    if (isAsleep()) return "HUDDLE";
    return "NORMAL";
}

// =====================================================================
// INIT
// =====================================================================
function init() {
    console.log("[Edencore] Initializing Orchestrator V5.1...");

    // 1. Measure and setup DOM references safely
    measureCreatures();
    initShadows();

    // 2. Place creatures centrally
    for (const key in creatureState) {
        placeCreature(creatureState[key]);
    }

    // 3. Wire the Splash Screen
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.addEventListener('click', () => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
            if (window.audioManager) window.audioManager.start();
            
            // Trigger greeting now that we are "in"
            if (!firstGreetingDone) {
                setTimeout(() => { 
                    greet(true, 0); 
                    firstGreetingDone = true; 
                }, 2000);
            }
        });
    }

    // 4. Wire Taps
    if (sceneEl) {
        sceneEl.addEventListener('pointerdown', (e) => {
            attention = { x: e.clientX, y: e.clientY, t: time_elapsed };
            const s = getSave();
            s.last_touched = Date.now();
            saveNow();
        });
    }

    // 5. Wire HUD Buttons
    const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    };
    bind('btn-feed', spawnFood);
    bind('btn-sleep', toggleSleep);
    bind('btn-dim', toggleDim);
    bind('btn-vol', toggleVolume);
    bind('btn-menu', toggleMenu);

    // 6. Start the loop
    requestAnimationFrame(tick);

    // 7. Ping boot successful
    window.__booted = true;
}

// =====================================================================
// PACING (Director Note #5)
// =====================================================================
window.calculateReadTime = function(conversation) {
    if (!conversation || !Array.isArray(conversation)) return;
    let totalWords = 0;
    conversation.forEach(line => {
        if (line[1]) totalWords += line[1].split(' ').length;
    });
    let time = (totalWords / 3) + (conversation.length * 2.5) + 2;
    readCooldown = Math.max(5, time);
    idleTimer = -10; 
};

function speakFromBank(bankName) {
    if (window.drawFromBank && window.dialogueEngine) {
        const convo = window.drawFromBank(bankName);
        if (convo) {
            window.dialogueEngine.queueSpeech(convo);
            window.calculateReadTime(convo);
        }
    }
}

// =====================================================================
// 1. GREETING
// =====================================================================
function greet(first, away) {
    if (!first && away < GREET_AWAY_MS) return;
    
    if (first) {
        speakFromBank('greetings');
    } else if (away > LONG_AWAY_MS) {
        speakFromBank('daily_absence');
    } else {
        speakFromBank('daily_morning');
    }
}

// =====================================================================
// 3. NEEDS -> REQUESTS
// =====================================================================
function maybeRequest() {
    if (readCooldown > 0) return;
    if (isAsleep()) return;
    
    requestTimer -= 1; // Assuming called once per second
    if (requestTimer > 0) return;
    
    const fNeed = foodNeed();
    const aNeed = attentionNeed();
    
    if (fNeed > NEED_ASK) {
        speakFromBank('requests_feed');
        requestTimer = REQUEST_GAP;
    } else if (aNeed > NEED_ASK) {
        speakFromBank('requests_attention');
        requestTimer = REQUEST_GAP;
    }
}

// =====================================================================
// 4. DREAMS
// =====================================================================
function pickDreamBank() {
    const aNeed = attentionNeed();
    if (aNeed >= NEED_SEVERE) return 'dreams_absence';
    if (currentMood === "CRISIS") return 'dreams_nightmare';
    if (currentMood === "PLAYFUL") return 'dreams_playful';
    return 'dreams_peaceful';
}

// =====================================================================
// INTERACTION
// =====================================================================
function handleCreatureTap(id) {
    if (readCooldown > 0) return;
    if (window.audioManager) window.audioManager.sting(id);
    if (window.brain) window.brain.addBond(1);
    idleTimer = 0;
    speakFromBank('reactions_tap');
}

function spawnFood() {
    if (readCooldown > 0) return;
    
    const foodEl = document.createElement('div');
    foodEl.className = 'food-particle';
    foodEl.style.left = `${20 + Math.random() * 60}%`;
    foodEl.style.top = `-20px`;
    if (sceneEl) sceneEl.appendChild(foodEl);

    const s = getSave();
    s.last_fed = Date.now();
    saveNow();
    
    speakFromBank('reactions_feed');
}

function updateFood(dt) {
    const foods = document.querySelectorAll('.food-particle');
    foods.forEach(food => {
        let top = parseFloat(food.style.top) || 0;
        top += 50 * dt; 
        food.style.top = `${top}px`;
        if (top > window.innerHeight) food.remove();
    });
}

function toggleSleep() {
    if (window.brain) {
        window.brain.sleepState = window.brain.sleepState === "SLEEPING" ? "AWAKE" : "SLEEPING";
    }
}

function toggleDim() {
    if (dimOverlay) dimOverlay.classList.toggle('on');
}

function toggleVolume() {
    // Handled by audio system in future
}

function toggleMenu() {
    debugMode = !debugMode;
}

// =====================================================================
// DEBUG HUD
// =====================================================================
function updateDebugHUD() {
    if (!debugMode || !debugOverlay) {
        if (debugOverlay) debugOverlay.style.display = 'none';
        return;
    }
    debugOverlay.style.display = 'block';
    
    // Check if arbiter exists before accessing
    const netOutput = (window.arbiter && window.arbiter.lastOutput) ? window.arbiter.lastOutput.map(n => n.toFixed(2)).join(', ') : "N/A";
    
    debugOverlay.innerHTML = `
        <div style="color: #0f0; font-family: monospace; font-size: 12px; padding: 10px; background: rgba(0,0,0,0.7); border: 1px solid #0f0; border-radius: 5px;">
            Mood: ${currentMood}<br>
            Sleep: ${window.brain ? window.brain.sleepState : 'N/A'}<br>
            Read Lock: ${readCooldown > 0 ? readCooldown.toFixed(1) + 's' : 'OFF'}<br>
            Idle: ${idleTimer > 0 ? idleTimer.toFixed(1) + 's' : '0s'}<br>
            Net: [${netOutput}]
        </div>
    `;
}

// =====================================================================
// MASTER TICK LOOP (BULLETPROOF)
// =====================================================================
function tick(now) {
    requestAnimationFrame(tick); // Keep loop alive regardless of errors

    try {
        if (!lastTime) lastTime = now;
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        
        if (dt > 0.1) dt = 0.1; // Cap delta time
        time_elapsed += dt;

        if (readCooldown > 0) readCooldown -= dt;

        // 1. Update Brain
        if (window.brain) {
            window.brain.update(dt);
            currentMood = window.brain.currentMood || "NORMAL";
        }

        // 2. Update Dialogue
        if (window.dialogueEngine) {
            window.dialogueEngine.update(dt);
        }

        // 3. Formation & Movement
        let formation = null;
        if (window.choreographyEngine) {
            formation = window.choreographyEngine.getFormation(
                currentStateName(), 
                window.innerWidth, window.innerHeight, time_elapsed
            );
        }

        let activeTalker = null;

        for (const key in creatureState) {
            const c = creatureState[key];
            if (!c.el) continue;

            // Determine Target
            let targetX = window.innerWidth / 2;
            let targetY = window.innerHeight / 2;

            if (formation && formation[key]) {
                targetX = formation[key].x - c.w / 2;
                targetY = formation[key].y - c.h / 2;
            } else {
                // Fallback positions if choreography fails
                targetX = (window.innerWidth * 0.5) - c.w / 2;
                targetY = (window.innerHeight * 0.5) - c.h / 2;
            }

            // Smooth movement
            c.x += (targetX - c.x) * 2 * dt;
            c.y += (targetY - c.y) * 2 * dt;

            // Apply Physics Offsets safely
            const phX = c.offX || 0;
            const phY = c.offY || 0;

            c.el.style.transform = `translate(${c.x + phX}px, ${c.y + phY}px)`;

            // Blinking logic
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
                if (isTalking) c.el.src = `${baseSrc}_talk.png`;
                else if (c.blinkTimer > 0) {
                    c.el.src = `${baseSrc}_blink.png`;
                    c.blinkTimer -= dt;
                } else c.el.src = `${baseSrc}.png`;
            }
        }

        // 4. Update Physics Engine
        if (window.physicsEngine && window.physicsEngine.update) {
            const shadows = {};
            for (const key in creatureState) {
                shadows[key] = document.getElementById(`shadow-${key}`);
            }
            window.physicsEngine.update(dt, time_elapsed, currentMood, creatureState, shadows);
        }

        // 5. Chatter / Requests
        if (readCooldown <= 0 && currentMood === "NORMAL" && !activeTalker && time_elapsed > 15) {
            idleTimer += dt;
            if (idleTimer > 25) {
                if (window.drawFromBank && window.dialogueEngine) {
                    const chatter = window.drawFromBank('chatter');
                    if (chatter) {
                        window.dialogueEngine.queueSpeech(chatter);
                        window.calculateReadTime(chatter);
                    }
                }
                idleTimer = 0; 
            }
        } else if (readCooldown > 0 || activeTalker) {
            idleTimer = 0; 
        }

        // 6. UI Housekeeping (twice per second)
        uiTickTimer += dt;
        if (uiTickTimer > 0.5) {
            updateDebugHUD();
            maybeRequest();
            updateFood(dt);
            uiTickTimer = 0;
        }

    } catch (e) {
        console.error("CRITICAL TICK ERROR:", e);
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