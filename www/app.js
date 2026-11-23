const state = { time_elapsed: 0, base_scroll: 0 };

const creatures = {
    solon:  { phase: Math.random() * 6.28, baseX: 0.30, baseY: 0.55 },
    prism:  { phase: Math.random() * 6.28, baseX: 0.70, baseY: 0.55 },
    lumen:  { phase: Math.random() * 6.28, baseX: 0.20, baseY: 0.35 },
    ripple: { phase: Math.random() * 6.28, baseX: 0.75, baseY: 0.35 },
    vertex: { phase: Math.random() * 6.28, baseX: 0.50, baseY: 0.12 }
};

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

    // CREATURE LOGIC
    for (const [id, data] of Object.entries(creatures)) {
        const el = document.getElementById(id);
        if (!el) continue;

        const breathScale = 1.0 + (Math.sin(state.time_elapsed * 2.5 * speedMult + data.phase) * 0.03);
        const bobY = Math.sin(state.time_elapsed * 2.0 * speedMult + data.phase) * (window.innerHeight * 0.02);
        const driftX = Math.cos(state.time_elapsed * 1.5 * speedMult + data.phase) * (window.innerWidth * 0.02);

        const finalY = id === 'vertex' ? 0 : bobY;
        el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;

        // TEXTURE SWAPPING (TALK & BLINK)
        if (window.brain) {
            let stateStr = "";
            
            // 1. TALK PRIORITY
            if (window.brain.talkingCreature === id) {
                // Animate mouth every 0.15s
                if (Math.floor(state.time_elapsed / 0.15) % 2 === 0) stateStr = "_talk";
            } 
            // 2. BLINKING
            else if (window.brain.blinkTimer > 3.0 && window.brain.blinkTimer < 3.2) {
                stateStr = "_blink";
            }

            // Map IDs to file names (Solon uses _body_ for his files)
            let filePrefix = id;
            if (id === "solon") filePrefix = "solon_body";

            if (stateStr) {
                const newSrc = `assets/images/${filePrefix}${stateStr}.png`;
                if (el.src.indexOf(newSrc) === -1) {
                    el.src = newSrc;
                }
            } else {
                const baseSrc = `assets/images/${filePrefix}.png`;
                if (el.src.indexOf(baseSrc) === -1) {
                    el.src = baseSrc;
                }
            }
        }

        // SOLON SWIMMING (Flipper swap)
        if (id === "solon" && window.solonFins) {
            window.solonFins.update(state.time_elapsed);
        }

        // LUMEN TENTACLES
        if (id === "lumen" && window.lumenTentacles) {
            window.lumenTentacles.update(el);
        }
    }

    // Reset Blink Timer
    if (window.brain && window.brain.blinkTimer > 3.4) {
        window.brain.blinkTimer = 0;
    }

    // PARTICLES
    if (Math.random() < 0.1) {
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

// --- SOLON FINS ENGINE ---
window.solonFins = {
    frames: [],
    currentFrame: 0,
    timer: 0,
    init: function() {
        for (let i = 1; i <= 5; i++) {
            let l = new Image(); l.src = `assets/images/solon_left_fin_${i}.png`; this.frames.push(l);
        }
    },
    update: function(time) {
        if (this.timer > 0.15) {
            this.timer = 0;
            this.currentFrame = (this.currentFrame + 1) % 5;
        }
        this.timer += 0.016; // Approximate dt
    }
};
window.solonFins.init();

// --- LUMEN TENTACLES ENGINE ---
window.lumenTentacles = {
    update: function(el) {
        // In a future update, we draw SVG lines from the Lumen element.
        // For now, this is a stub to prevent crashes.
    }
};

// --- BOOT ---
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.addEventListener('click', () => {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 800);
        });
    }
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