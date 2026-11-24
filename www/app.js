// =====================================================================
// EDENCORE - app.js (V0.3 Web Engine)
// =====================================================================

const state = { time_elapsed: 0, base_scroll: 0 };

const creatures = {
    solon:  { phase: Math.random() * 6.28, baseX: 0.30, baseY: 0.55 },
    prism:  { phase: Math.random() * 6.28, baseX: 0.70, baseY: 0.55 },
    lumen:  { phase: Math.random() * 6.28, baseX: 0.20, baseY: 0.35 },
    ripple: { phase: Math.random() * 6.28, baseX: 0.75, baseY: 0.35 },
    vertex: { phase: Math.random() * 6.28, baseX: 0.50, baseY: 0.12 }
};

let shadowElements = {};
let solonLeftFrames = [];
let solonRightFrames = [];

// Preload Solon Flipper Frames
function preloadSolonFins() {
    for (let i = 1; i <= 5; i++) {
        let l = new Image(); l.src = `assets/images/solon_left_fin_${i}.png`; solonLeftFrames.push(l);
        let r = new Image(); r.src = `assets/images/solon_right_fin_${i}.png`; solonRightFrames.push(r);
    }
}

function initShadows() {
    const shadowLayer = document.getElementById('shadow-layer');
    for (const id in creatures) {
        const shadow = document.createElement('div');
        shadow.className = 'creature-shadow';
        shadow.id = `shadow-${id}`;
        shadowLayer.appendChild(shadow);
        shadowElements[id] = shadow;
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
        if (creatures[id]) {
            const cx = window.innerWidth * creatures[id].baseX;
            const cy = window.innerHeight * (1.0 - creatures[id].baseY); 
            el.style.left = (cx - size / 2) + 'px';
            el.style.top = (cy - size / 2) + 'px';
        }
    });
}

// PARTICLES (Lumen Spores / Dust)
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

    let speedMult = 1.0;
    if (window.brain && window.brain.mood === "PLAYFUL") speedMult = 2.0; 
    if (window.brain && window.brain.mood === "SLEEPY") speedMult = 0.3;  

    // Sand Level (The "floor" of the terrarium)
    const sandY = window.innerHeight * 0.95; 

    // CREATURE LOGIC
    for (const [id, data] of Object.entries(creatures)) {
        const el = document.getElementById(id);
        if (!el) continue;

        const breathScale = 1.0 + (Math.sin(state.time_elapsed * 2.5 * speedMult + data.phase) * 0.03);
        const bobY = Math.sin(state.time_elapsed * 2.0 * speedMult + data.phase) * (window.innerHeight * 0.02);
        const driftX = Math.cos(state.time_elapsed * 1.5 * speedMult + data.phase) * (window.innerWidth * 0.02);

        // Vertex stays on the ground
        const finalY = id === 'vertex' ? 0 : bobY;
        
        // If Solon, we don't move the container transform directly, we use the flipper logic below
        if (id !== 'solon') {
            el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;
        }

        // --- SHADOWS ---
        if (shadowElements[id]) {
            const rect = el.getBoundingClientRect();
            const currentCy = rect.top + rect.height / 2; // Center Y of creature
            
            // Calculate distance from sand
            const shadowDist = Math.max(0, sandY - currentCy);
            
            // The higher the creature, the fainter and smaller the shadow
            const maxH = window.innerHeight * 0.8;
            let shadowAlpha = Math.max(0.05, 0.35 - (shadowDist / maxH));
            let shadowScale = Math.max(0.4, 1.0 - (shadowDist / maxH));

            const shadowEl = shadowElements[id];
            
            // Position shadow on the sand beneath the creature
            const shadowW = window.innerWidth * parseFloat(el.dataset.scale) * 0.8 * shadowScale;
            const shadowH = window.innerHeight * 0.03 * shadowScale;
            
            shadowEl.style.width = shadowW + 'px';
            shadowEl.style.height = shadowH + 'px';
            shadowEl.style.left = (rect.left + rect.width / 2 - shadowW / 2) + 'px';
            shadowEl.style.top = (sandY - shadowH / 2) + 'px';
            shadowEl.style.background = `rgba(0, 0, 0, ${shadowAlpha})`;
        }

        // --- SOLON SPECIAL LAYER LOGIC ---
        if (id === "solon") {
            // Solon Container Transform
            el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;

            // Flipper Animation
            if (solonLeftFrames.length > 0) {
                let flapSpeed = 8.0;
                if (window.brain && window.brain.mood === "PLAYFUL") flapSpeed = 15.0;
                else if (window.brain && window.brain.mood === "SLEEPY") flapSpeed = 2.0;

                const frameIdx = Math.floor(state.time_elapsed * flapSpeed) % 5;
                
                const leftFinEl = document.getElementById('solon-left-fin');
                const rightFinEl = document.getElementById('solon-right-fin');
                const bodyEl = document.getElementById('solon-body');

                if (leftFinEl.src.indexOf(`_${frameIdx + 1}.png`) === -1) leftFinEl.src = `assets/images/solon_left_fin_${frameIdx + 1}.png`;
                if (rightFinEl.src.indexOf(`_${frameIdx + 1}.png`) === -1) rightFinEl.src = `assets/images/solon_right_fin_${frameIdx + 1}.png`;

                // Texture Swapping for Solon Body
                let stateStr = "";
                if (window.brain && window.brain.talkingCreature === "solon") {
                    if (Math.floor(state.time_elapsed / 0.15) % 2 === 0) stateStr = "_talk";
                } else if (window.brain && window.brain.blinkTimer > 3.0 && window.brain.blinkTimer < 3.2) {
                    stateStr = "_blink";
                }

                const newBodySrc = stateStr ? `assets/images/solon_body${stateStr}.png` : `assets/images/solon_body.png`;
                if (bodyEl.src.indexOf(newBodySrc) === -1) bodyEl.src = newBodySrc;
            }
        } else {
            // Standard Texture Swapping for other creatures
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

    // Reset Blink Timer
    if (window.brain && window.brain.blinkTimer > 3.4) {
        window.brain.blinkTimer = 0;
    }

    // PARTICLES
    if (Math.random() < 0.05) {
        spawnParticle();
    }
    updateParticles(safeDt);

    // DIALOGUE
    dialogueCooldown += safeDt;
    if (dialogueCooldown > 15.0 && window.dialogue && !window.dialogue.isTalking) {
        dialogueCooldown = 0;
        let speaker = "Solon";
        if (window.brain.mood === "PLAYFUL") speaker = "Prism";
        else if (window.brain.mood === "SLEEPY") speaker = "Lumen";
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