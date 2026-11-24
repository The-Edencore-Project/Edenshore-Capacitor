// =====================================================================
// EDENCORE - app.js (V0.4 Engine Driven)
// =====================================================================

const state = { time_elapsed: 0, base_scroll: 0 };

// Data definitions
const creatureData = {
    solon:  { baseX: 0.30, baseY: 0.55, scale: 0.20 },
    prism:  { baseX: 0.70, baseY: 0.55, scale: 0.26 },
    lumen:  { baseX: 0.20, baseY: 0.35, scale: 0.18 },
    ripple: { baseX: 0.75, baseY: 0.35, scale: 0.36 },
    vertex: { baseX: 0.50, baseY: 0.12, scale: 0.24 }
};

let shadowElements = {};
let solonLeftFrames = [];
let solonRightFrames = [];

function preloadSolonFins() {
    for (let i = 1; i <= 5; i++) {
        let l = new Image(); l.src = `assets/images/solon_left_fin_${i}.png`; solonLeftFrames.push(l);
        let r = new Image(); r.src = `assets/images/solon_right_fin_${i}.png`; solonRightFrames.push(r);
    }
}

function initShadows() {
    const shadowLayer = document.getElementById('shadow-layer');
    for (const id in creatureData) {
        const shadow = document.createElement('div');
        shadow.className = 'creature-shadow';
        shadow.id = `shadow-${id}`;
        shadowLayer.appendChild(shadow);
        shadowElements[id] = shadow;
        
        // Register with physics engine
        window.physicsEngine.registerCreature(id, creatureData[id].baseX, creatureData[id].baseY, creatureData[id].scale);
    }
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
    
    window.physicsEngine.resize();
}

// Particles
const particleLayer = document.createElement('div');
particleLayer.id = 'particle-layer';
particleLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; pointer-events:none;';
document.getElementById('scene').appendChild(particleLayer);

let lastTime = performance.now();
let dialogueCooldown = 0;

function tick(currentTime) {
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;
    const safeDt = Math.min(dt, 0.1); 

    state.time_elapsed += safeDt;
    if (window.brain) window.brain.update(safeDt); 

    // Parallax
    state.base_scroll += safeDt * 100; 
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    // Update Physics & Shadows
    const currentMood = window.brain ? window.brain.mood : "NORMAL";
    window.physicsEngine.update(safeDt, state.time_elapsed, currentMood, shadowElements);

    // Animation & Texture Swaps
    for (const [id, data] of Object.entries(creatureData)) {
        const el = document.getElementById(id);
        if (!el) continue;

        // Solon Flipper Animation
        if (id === "solon" && solonLeftFrames.length > 0) {
            let flapSpeed = 8.0;
            if (currentMood === "PLAYFUL") flapSpeed = 15.0;
            else if (currentMood === "SLEEPY") flapSpeed = 2.0;

            const frameIdx = Math.floor(state.time_elapsed * flapSpeed) % 5;
            
            const leftFinEl = document.getElementById('solon-left-fin');
            const rightFinEl = document.getElementById('solon-right-fin');
            const bodyEl = document.getElementById('solon-body');

            if (leftFinEl && leftFinEl.src.indexOf(`_${frameIdx + 1}.png`) === -1) {
                leftFinEl.src = `assets/images/solon_left_fin_${frameIdx + 1}.png`;
            }
            if (rightFinEl && rightFinEl.src.indexOf(`_${frameIdx + 1}.png`) === -1) {
                rightFinEl.src = `assets/images/solon_right_fin_${frameIdx + 1}.png`;
            }

            // Solon Texture Swap
            let stateStr = "";
            if (window.brain && window.brain.talkingCreature === "solon") {
                if (Math.floor(state.time_elapsed / 0.15) % 2 === 0) stateStr = "_talk";
            } else if (window.brain && window.brain.blinkTimer > 3.0 && window.brain.blinkTimer < 3.2) {
                stateStr = "_blink";
            }

            const newBodySrc = stateStr ? `assets/images/solon_body${stateStr}.png` : `assets/images/solon_body.png`;
            if (bodyEl && bodyEl.src.indexOf(newBodySrc) === -1) bodyEl.src = newBodySrc;
        } else {
            // Standard creatures
            if (window.brain) {
                let stateStr = "";
                if (window.brain.talkingCreature === id) {
                    if (Math.floor(state.time_elapsed / 0.15) % 2 === 0) stateStr = "_talk";
                } else if (window.brain.blinkTimer > 3.0 && window.brain.blinkTimer < 3.2) {
                    stateStr = "_blink";
                }

                let filePrefix = id;
                if (stateStr) {
                    const newSrc = `assets/images/${filePrefix}${stateStr}.png`;
                    if (el.src.indexOf(newSrc) === -1) el.src = newSrc;
                } else {
                    const baseSrc = `assets/images/${filePrefix}.png`;
                    if (el.src.indexOf(baseSrc) === -1) el.src = baseSrc;
                }
            }
        }
    }

    if (window.brain && window.brain.blinkTimer > 3.4) {
        window.brain.blinkTimer = 0;
    }

    if (Math.random() < 0.05) spawnParticle();
    updateParticles(safeDt);

    dialogueCooldown += safeDt;
    if (dialogueCooldown > 15.0 && window.dialogue && !window.dialogue.isTalking) {
        dialogueCooldown = 0;
        let speaker = "Solon";
        if (currentMood === "PLAYFUL") speaker = "Prism";
        else if (currentMood === "SLEEPY") speaker = "Lumen";
        window.dialogue.triggerRandom(speaker);
    }

    requestAnimationFrame(tick);
}

// --- PARTICLES LOGIC ---
const particles = [];
function spawnParticle() {
    const p = document.createElement('div');
    p.style.cssText = `position:absolute; border-radius:50%; background:rgba(0,255,255,0.6); width:4px; height:4px; pointer-events:none; filter:blur(1px);`;
    const x = Math.random() * window.innerWidth;
    const y = window.innerHeight + 10;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    particleLayer.appendChild(p);
    particles.push({ el: p, x: x, y: y, vy: -Math.random() * 50 - 20, life: 1.0 });
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.y += p.vy * dt;
        p.el.style.top = p.y + 'px';
        p.life -= dt * 0.05;
        p.el.style.opacity = p.life;

        if (p.y < -10 || p.life <= 0) {
            p.el.remove();
            particles.splice(i, 1);
        }
    }
}

// --- BOOT ---
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.addEventListener('click', () => {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 800);
        });
    }
    
    preloadSolonFins();
    initShadows();
    resize();
    requestAnimationFrame(tick); 
});

window.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('biome-btn')) return;
    if (window.brain) window.brain.addBond(1);
}, { passive: true });

document.querySelectorAll('.biome-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const bg = document.getElementById('bg-gradient');
        bg.className = '';
        bg.classList.add(`biome-${e.target.dataset.biome.toLowerCase()}`);
    });
});

window.addEventListener('resize', resize);