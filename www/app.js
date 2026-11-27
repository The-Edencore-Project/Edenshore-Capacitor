// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V5.0 - Aliveness Slice)
// V4 base + four new behaviours, all built from dialogue you already wrote:
//   1. Greeting on open (first visit / long absence / time of day)
//   2. Creatures notice where you tap (lean toward it, optional face flip)
//   3. Needs: food + attention drift up over real time, and they ask
//   4. Dreams while asleep (chosen by how neglected they feel)
// app.js is still the ONLY thing that writes a creature's transform.
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
let feedingTimer = 0;
let manualSleep = false;
let dimmed = false;
let volumeHigh = true;
let currentBiome = "LAGOON";

// --- Aliveness State ---
let greeted = false;
let firstVisit = false;
let awayMs = 0;
let lastHiddenAt = 0;
let requestTimer = 60;        // seconds until the first request is allowed
let dreamTimer = 12;          // seconds after falling asleep before the first dream
let saveTimer = 0;
let attention = null;         // { x, y, t } where the last tap landed
let wasBrainAsleep = false;

// --- Tuning (all in one place) ---
const GREET_AWAY_MS = 10 * 60 * 1000;      // shorter than this = just resumed, no greeting
const LONG_AWAY_MS = 6 * 60 * 60 * 1000;   // this long away = absence greeting
const FOOD_FULL_MS = 90 * 60 * 1000;       // food need reaches 1.0 after this long unfed
const ATTN_FULL_MS = 45 * 60 * 1000;       // attention need reaches 1.0 after this long untouched
const NEED_ASK = 0.6;                      // they start asking above this
const NEED_SEVERE = 0.8;                   // dreams turn sad above this
const REQUEST_GAP = 240;                   // seconds between requests
const ATTENTION_SECS = 3.5;                // how long a tap holds their interest

// Which way each sprite faces in its art: "left", "right", or null (front-on / no flip).
// Set these once you know your art and they will turn toward your taps.
const SPRITE_FACES = { solon: null, prism: null, lumen: null, ripple: null, vertex: null };

// Words used to pick a request that matches what they actually need
const REQUEST_MATCH = {
    food: /food|flake|feed|nutrition|eat/i,
    attention: /tap|hug|play|story|game/i
};

// --- Creature Registry ---
const CREATURE_IDS = ["solon", "prism", "lumen", "ripple", "vertex"];
const creatureState = {};
CREATURE_IDS.forEach(id => {
    creatureState[id] = {
        el: null,
        x: 0, y: 0,          // centre point (pixels)
        w: 100, h: 100,      // rendered size (pixels)
        offX: 0, offY: 0,    // bob/drift offsets written by physics.js
        flip: 1,             // 1 or -1 (mirror)
        talkTimer: 0,        // dialogue.js writes this through window.creatureState
        blinkTimer: 0,
        nextBlink: 0,
        sprite: ""
    };
});
window.creatureState = creatureState;   // dialogue.js reads it from here

const shadowEls = {};
const foods = [];

const sceneEl = document.getElementById('scene');
const shadowLayer = document.getElementById('shadow-layer');
const debugOverlay = document.getElementById('debug-overlay');

// =====================================================================
// SAVE + NEEDS
// =====================================================================

function getSave() {
    return window.brain ? window.brain.save : null;
}

function saveNow() {
    const s = getSave();
    if (s && window.saveData) window.saveData(s);
}

function stamp(field) {
    const s = getSave();
    if (!s) return;
    s[field] = Date.now();
    saveNow();
}

// 0.0 (satisfied) to 1.0 (needs it badly), based on real elapsed time
function need(field, fullMs) {
    const s = getSave();
    const t = s && s[field];
    if (!t) return 0;
    return Math.min(1, Math.max(0, (Date.now() - t) / fullMs));
}

function foodNeed() { return need('last_fed', FOOD_FULL_MS); }
function attentionNeed() { return need('last_touch', ATTN_FULL_MS); }

// =====================================================================
// SETUP HELPERS
// =====================================================================

function initShadows() {
    CREATURE_IDS.forEach(id => {
        const shadow = document.createElement('div');
        shadow.className = 'creature-shadow';
        shadow.id = `shadow-${id}`;
        if (shadowLayer) shadowLayer.appendChild(shadow);
        shadowEls[id] = shadow;
    });
}

function measureCreatures() {
    CREATURE_IDS.forEach(id => {
        const c = creatureState[id];
        if (!c.el) return;
        c.w = c.el.offsetWidth || 100;
        c.h = c.el.offsetHeight || c.w;
    });
}

function preloadSprites() {
    // Solon preloads its own frames. The other four swap talk/blink sprites.
    CREATURE_IDS.forEach(id => {
        if (id === "solon") return;
        ["_talk", "_blink"].forEach(suffix => {
            const img = new Image();
            img.src = `assets/images/${id}${suffix}.png`;
        });
    });
}

function placeCreature(c) {
    c.el.style.transform =
        `translate(${(c.x - c.w / 2 + c.offX).toFixed(1)}px, ${(c.y - c.h / 2 + c.offY).toFixed(1)}px) scaleX(${c.flip})`;
}

function clampTarget(c, t) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const m = 8;
    t.x = Math.min(Math.max(t.x, c.w / 2 + m), W - c.w / 2 - m);
    t.y = Math.min(Math.max(t.y, c.h / 2 + 90), H - 64 - c.h / 2);   // keep clear of the HUD bars
}

function isAsleep() {
    return manualSleep || (window.brain && window.brain.sleepState === "SLEEPING");
}

function currentStateName() {
    if (manualSleep) return "SLEEPING";
    if (feedingTimer > 0) return "FEEDING";
    if (currentMood === "PLAYFUL") return "PLAYFUL";
    return "NORMAL";
}

// =====================================================================
// INIT
// =====================================================================

function init() {
    console.log("[Edencore] Initializing Orchestrator V5.0...");

    // Read the last visit BEFORE overwriting it, so the greeting knows how long you were gone
    const s = getSave();
    const now = Date.now();
    if (s) {
        firstVisit = !s.last_visit;
        awayMs = s.last_visit ? now - s.last_visit : 0;
        if (!s.last_fed) s.last_fed = now;      // a new save starts fed and un-neglected
        if (!s.last_touch) s.last_touch = now;
        s.last_visit = now;
        saveNow();
    }

    CREATURE_IDS.forEach(id => {
        const c = creatureState[id];
        c.el = document.getElementById(id);
        c.nextBlink = Math.random() * 5;
        if (c.el) {
            c.el.addEventListener('click', () => handleCreatureTap(id));
            if (c.el.tagName === 'IMG') c.el.addEventListener('load', measureCreatures);
        }
    });

    initShadows();
    resize();           // sets sandY and measures sizes
    preloadSprites();
    if (window.weatherEngine && window.weatherEngine.buildAmbience) window.weatherEngine.buildAmbience();

    // Start every creature at its home spot (no flying in from the corner)
    const formation = window.choreographyEngine.getFormation("NORMAL", window.innerWidth, window.innerHeight, 0);
    CREATURE_IDS.forEach(id => {
        const c = creatureState[id];
        if (!c.el) return;
        const t = { x: formation[id].x, y: formation[id].y };
        clampTarget(c, t);
        c.x = t.x;
        c.y = t.y;
        placeCreature(c);
    });

    wireButtons();

    // Any tap on the water: they notice where it landed, and you count as "attention"
    if (sceneEl) {
        sceneEl.addEventListener('click', (e) => {
            attention = { x: e.clientX, y: e.clientY, t: ATTENTION_SECS };
            stamp('last_touch');
        });
    }

    // Leaving and coming back
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            lastHiddenAt = Date.now();
            stamp('last_visit');
        } else if (lastHiddenAt) {
            const away = Date.now() - lastHiddenAt;
            lastHiddenAt = 0;
            stamp('last_visit');
            if (away >= GREET_AWAY_MS && !isAsleep()) greet(false, away);
        }
    });
    window.addEventListener('pagehide', () => stamp('last_visit'));

    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.addEventListener('click', () => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
            if (window.audio) window.audio.start();
        });
    }

    requestAnimationFrame(tick);
    window.__booted = true;
}

// =====================================================================
// PACING (Director Note #5)
// =====================================================================

window.calculateReadTime = function (conversation) {
    if (!conversation || !Array.isArray(conversation)) return 0;
    let totalWords = 0;
    conversation.forEach(line => {
        if (line[1]) totalWords += line[1].split(' ').length;
    });
    const time = (totalWords / 3) + (conversation.length * 2.5) + 2;
    readCooldown = Math.max(5, time);
    idleTimer = -10;
    return time;
};

function speak(conversation) {
    if (!conversation || !window.dialogueEngine) return;
    window.dialogueEngine.queueSpeech(conversation);
    window.calculateReadTime(conversation);
}

function speakFromBank(bankName) {
    if (readCooldown > 0 || !window.drawFromBank) return;
    speak(window.drawFromBank(bankName));
}

// =====================================================================
// 1. GREETING
// =====================================================================

function pickGreetingBank(first, away) {
    if (first) return 'greetings';
    if (away >= LONG_AWAY_MS) return 'daily_absence';
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'daily_morning';
    if (h >= 17 && h < 22) return 'daily_evening';
    if (h >= 22 || h < 5) return 'daily_late';
    return 'visitor';
}

function greet(first, away) {
    if (!window.drawFromBank) return;
    if (!first && away < GREET_AWAY_MS) return;   // you only just left
    const convo = window.drawFromBank(pickGreetingBank(first, away));
    if (!convo) return;
    speak(convo);
    // Coming back after at least an hour is worth a little bond
    if (!first && away >= 60 * 60 * 1000 && window.brain) window.brain.addBond(1);
}

// =====================================================================
// 3. NEEDS -> REQUESTS
// =====================================================================

function drawRequestFor(kind) {
    let last = null;
    for (let i = 0; i < 12; i++) {
        const convo = window.drawFromBank('requests');
        if (!convo) return null;
        last = convo;
        if (convo.some(line => REQUEST_MATCH[kind].test(line[1]))) return convo;
    }
    return last;   // nothing matched in 12 draws, any request is still in character
}

function maybeRequest() {
    if (requestTimer > 0 || !window.drawFromBank) return false;
    const food = foodNeed();
    const attn = attentionNeed();
    if (food < NEED_ASK && attn < NEED_ASK) return false;
    const convo = drawRequestFor(food >= attn ? 'food' : 'attention');
    if (!convo) return false;
    speak(convo);
    requestTimer = REQUEST_GAP;
    return true;
}

// =====================================================================
// 4. DREAMS
// =====================================================================

function pickDreamBank() {
    if (attentionNeed() >= NEED_SEVERE) return 'dreams_absence';   // they dreamed you left
    if (foodNeed() >= NEED_SEVERE) return 'dreams_nightmare';
    const bond = window.brain ? window.brain.bond : 0;
    if (bond >= 50 && Math.random() < 0.5) return 'dreams_playful';
    return 'dreams_peaceful';
}

// =====================================================================
// RESIZE
// =====================================================================

function resize() {
    if (window.physicsEngine) window.physicsEngine.resize();
    if (window.choreographyEngine) window.choreographyEngine.resize();
    measureCreatures();
}
window.addEventListener('resize', resize);

// =====================================================================
// INTERACTION
// =====================================================================

function handleCreatureTap(id) {
    if (readCooldown > 0) return;
    if (window.audio) window.audio.sting(id);
    if (window.brain) window.brain.addBond(1);
    idleTimer = 0;
    speakFromBank('reactions_tap');
}

function spawnFood() {
    for (let i = 0; i < 6; i++) {
        const el = document.createElement('div');
        el.className = 'food-particle';
        const f = {
            el: el,
            x: window.innerWidth * (0.2 + Math.random() * 0.6),
            y: -10 - Math.random() * 120,
            vy: 90 + Math.random() * 40,
            phase: Math.random() * 6.28
        };
        el.style.transform = `translate(${f.x}px, ${f.y}px)`;
        if (sceneEl) sceneEl.appendChild(el);
        foods.push(f);
    }
    if (!manualSleep) feedingTimer = 10;

    // Feeding satisfies both needs (it is also attention)
    const s = getSave();
    if (s) {
        const now = Date.now();
        s.last_fed = now;
        s.last_touch = now;
        saveNow();
    }

    if (readCooldown <= 0 && window.drawFromBank) {
        if (window.brain) window.brain.addBond(1);
        speak(window.drawFromBank('reactions_feed'));
    }
}

function updateFood(dt) {
    for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        f.y += f.vy * dt;
        f.x += Math.sin(time_elapsed * 2 + f.phase) * 12 * dt;
        f.el.style.transform = `translate(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px)`;
        if (f.y > window.innerHeight * 0.9) {
            f.el.remove();
            foods.splice(i, 1);
        }
    }
}

function toggleSleep() {
    manualSleep = !manualSleep;
    const btn = document.getElementById('btn-sleep');
    if (btn) btn.textContent = manualSleep ? 'WAKE' : 'SLEEP';
    if (manualSleep) {
        feedingTimer = 0;
        dreamTimer = 12;
        speakFromBank('bedtime');
    } else {
        speakFromBank('waking_nudge');
    }
}

function toggleDim() {
    dimmed = !dimmed;
    const overlay = document.getElementById('dim-overlay');
    if (overlay) overlay.classList.toggle('on', dimmed);
    const btn = document.getElementById('btn-dim');
    if (btn) btn.textContent = dimmed ? 'BRIGHT' : 'DIM';
}

function toggleVolume() {
    volumeHigh = !volumeHigh;
    const level = volumeHigh ? 0.30 : 0.10;
    if (window.audio) {
        window.audio.volume = level;
        if (window.audio.music) window.audio.music.volume = level;
    }
    const btn = document.getElementById('btn-vol');
    if (btn) btn.textContent = volumeHigh ? 'VOL HI' : 'VOL LO';
}

function toggleMenu() {
    // No menu exists yet, so for now this shows/hides the debug panel.
    debugMode = !debugMode;
    updateDebugHUD();
}

function setBiome(name) {
    if (name === currentBiome) return;
    currentBiome = name;

    const bg = document.getElementById('bg-gradient');
    if (bg) bg.className = 'biome-' + name.toLowerCase();

    document.querySelectorAll('.biome-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.biome === name);
    });

    // The biome bank is ONE fixed conversation per biome (a flat list of lines),
    // so it is played directly instead of drawn line-by-line through the ShuffleBag.
    if (readCooldown <= 0 && window.DIALOGUE_BIOME && window.DIALOGUE_BIOME[name]) {
        speak(window.DIALOGUE_BIOME[name]);
    }
}

function wireButtons() {
    const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    };
    bind('btn-feed', spawnFood);
    bind('btn-sleep', toggleSleep);
    bind('btn-dim', toggleDim);
    bind('btn-vol', toggleVolume);
    bind('btn-menu', toggleMenu);

    document.querySelectorAll('.biome-btn').forEach(btn => {
        btn.addEventListener('click', () => setBiome(btn.dataset.biome));
    });
}

// =====================================================================
// DEBUG HUD
// =====================================================================

function updateDebugHUD() {
    if (!debugOverlay) return;
    if (!debugMode) {
        debugOverlay.style.display = 'none';
        return;
    }
    debugOverlay.style.display = 'block';
    const net = window.brain && window.brain.lastNetOutput
        ? window.brain.lastNetOutput.map(n => n.toFixed(2)).join(', ') : 'N/A';
    debugOverlay.innerHTML = `
        <div style="color:#8fe; font-family:monospace; font-size:12px; line-height:1.4; padding:10px; background:rgba(0,0,0,0.7); border:1px solid #8fe; border-radius:5px; width:fit-content;">
            Mood: ${currentMood}<br>
            Sleep: ${window.brain ? window.brain.sleepState : 'N/A'}${manualSleep ? ' (manual)' : ''}<br>
            Read lock: ${readCooldown > 0 ? readCooldown.toFixed(1) + 's' : 'OFF'}<br>
            Idle: ${idleTimer > 0 ? idleTimer.toFixed(1) + 's' : '0s'}<br>
            Food need: ${foodNeed().toFixed(2)}<br>
            Attention need: ${attentionNeed().toFixed(2)}<br>
            Next request: ${requestTimer > 0 ? requestTimer.toFixed(0) + 's' : 'ready'}<br>
            Net: [${net}]
        </div>`;
}

// =====================================================================
// MASTER TICK LOOP
// =====================================================================

function tick(now) {
    requestAnimationFrame(tick);   // first line: the loop survives any error below

    try {
        if (!lastTime) lastTime = now;
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        if (dt > 0.1) dt = 0.1;
        time_elapsed += dt;

        if (readCooldown > 0) readCooldown -= dt;
        if (feedingTimer > 0) feedingTimer -= dt;
        if (requestTimer > 0) requestTimer -= dt;

        if (window.brain) {
            window.brain.update(dt);
            currentMood = window.brain.mood || "NORMAL";
        }
        if (window.dialogueEngine) window.dialogueEngine.update(dt);

        // 1. Greeting, once, shortly after the scene settles
        if (!greeted && time_elapsed > 2.5) {
            greeted = true;
            greet(firstVisit, awayMs);
        }

        // 2. WHERE should everyone be?
        const W = window.innerWidth;
        const H = window.innerHeight;
        const stateName = currentStateName();
        const formation = window.choreographyEngine.getFormation(stateName, W, H, time_elapsed, Math.max(0, feedingTimer));

        // Tap attention fades out; only awake, free-roaming creatures react to it
        let pull = 0;
        if (attention) {
            attention.t -= dt;
            if (attention.t <= 0) attention = null;
            else if (stateName === "NORMAL" || stateName === "PLAYFUL") pull = Math.min(1, attention.t / ATTENTION_SECS) * 0.22;
        }

        // 3. Glide toward the target
        const k = Math.min(1, 2 * dt);
        CREATURE_IDS.forEach(id => {
            const c = creatureState[id];
            if (!c.el || !formation[id]) return;
            const t = { x: formation[id].x, y: formation[id].y };

            if (attention && pull > 0 && id !== "vertex") {   // the crab stays on the sand
                t.x += (attention.x - t.x) * pull;
                t.y += (attention.y - t.y) * pull * 0.5;
            }
            // Turn toward the tap if this sprite has a known facing
            const face = SPRITE_FACES[id];
            if (face && attention && pull > 0) {
                const wantRight = attention.x > c.x;
                c.flip = ((face === "right") === wantRight) ? 1 : -1;
            }

            clampTarget(c, t);
            c.x += (t.x - c.x) * k;
            c.y += (t.y - c.y) * k;
        });

        // 4. Bob / drift offsets + shadows
        if (window.physicsEngine) window.physicsEngine.update(dt, time_elapsed, currentMood, creatureState, shadowEls);
        if (window.weatherEngine) window.weatherEngine.update(dt, currentMood);
        updateFood(dt);

        // 5. Draw + sprites (talk priority: talking is checked before blinking)
        let activeTalker = null;
        CREATURE_IDS.forEach(id => {
            const c = creatureState[id];
            if (!c.el) return;
            placeCreature(c);

            const isTalking = c.talkTimer > 0;
            if (isTalking) {
                c.talkTimer -= dt;
                activeTalker = id;
            } else {
                c.nextBlink -= dt;
                if (c.nextBlink <= 0) {
                    c.blinkTimer = 0.15;
                    c.nextBlink = 3 + Math.random() * 5;
                }
            }
            const isBlinking = !isTalking && c.blinkTimer > 0;
            if (c.blinkTimer > 0) c.blinkTimer -= dt;

            if (id === "solon") {
                if (window.solonActor) window.solonActor.update(time_elapsed, currentMood, isTalking, isBlinking);
            } else if (c.el.tagName === 'IMG') {
                let suffix = "";
                if (isTalking) {
                    if (Math.floor(time_elapsed / 0.15) % 2 === 0) suffix = "_talk";
                } else if (isBlinking) {
                    suffix = "_blink";
                }
                const wanted = `assets/images/${id}${suffix}.png`;
                if (c.sprite !== wanted) {
                    c.sprite = wanted;
                    c.el.src = wanted;
                }
            }
        });

        // 6. Sleep: dreams, and waking up on their own
        const brainAsleep = !!(window.brain && window.brain.sleepState === "SLEEPING");
        if (isAsleep()) {
            dreamTimer -= dt;
            if (dreamTimer <= 0 && readCooldown <= 0 && window.drawFromBank) {
                speak(window.drawFromBank(pickDreamBank()));
                dreamTimer = 45 + Math.random() * 30;
            }
        } else {
            dreamTimer = 12;
        }
        if (wasBrainAsleep && !brainAsleep && !manualSleep) speakFromBank('waking_nudge');
        wasBrainAsleep = brainAsleep;

        // 7. Requests (from needs) and idle chatter
        if (readCooldown <= 0 && currentMood === "NORMAL" && !activeTalker && !isAsleep() && time_elapsed > 15) {
            idleTimer += dt;
            if (idleTimer > 25) {
                if (!maybeRequest() && window.dialogueEngine && window.drawFromBank) {
                    const chatter = window.drawFromBank('chatter');
                    if (chatter) speak(chatter);
                }
                idleTimer = 0;
            }
        } else if (readCooldown > 0 || activeTalker) {
            idleTimer = 0;
        }

        // 8. Slow housekeeping (twice a second)
        uiTickTimer += dt;
        if (uiTickTimer > 0.5) {
            saveTimer += uiTickTimer;
            uiTickTimer = 0;
            measureCreatures();
            if (debugMode) updateDebugHUD();
            if (saveTimer > 60) {      // "last seen" stays fresh even if the app is killed
                saveTimer = 0;
                stamp('last_visit');
            }
        }

    } catch (e) {
        console.error("TICK ERROR:", e);
        if (!window.__tickErrShown && window.__showBootError) {
            window.__tickErrShown = true;
            window.__showBootError('TICK ERROR: ' + (e && e.message ? e.message : e));
        }
    }
}

// =====================================================================
// BOOT
// =====================================================================

function safeInit() {
    try {
        init();
    } catch (e) {
        console.error("INIT ERROR:", e);
        if (window.__showBootError) window.__showBootError('INIT ERROR: ' + (e && e.message ? e.message : e));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
} else {
    safeInit();
}
