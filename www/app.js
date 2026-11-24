const state = { time_elapsed: 0, base_scroll: 0 };

function resize() {
    const baseSize = Math.min(window.innerWidth, window.innerHeight);
    document.querySelectorAll('.creature').forEach(el => {
        const scale = parseFloat(el.dataset.scale);
        const size = baseSize * scale;
        el.style.width = size + 'px';
        el.style.height = size + 'px'; // Force square container for Solon layers

        const id = el.id.replace("-group", "");
        if (window.CREATURES[id]) {
            const cx = window.innerWidth * window.CREATURES[id].x;
            const cy = window.innerHeight * (1.0 - window.CREATURES[id].y); 
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

// Solon Fin Animation State
const solonState = { frame: 1, timer: 0 };
const totalSolonFrames = 5;

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

    // Mood Multipliers
    let speedMult = 1.0;
    if (window.brain && window.brain.mood === "PLAYFUL") speedMult = 2.0; 
    if (window.brain && window.brain.mood === "SLEEPY") speedMult = 0.3;  

    // CREATURE ANIMATION LOOP
    for (const [id, data] of Object.entries(window.CREATURES)) {
        const elId = id === 'solon' ? 'solon-group' : id;
        const el = document.getElementById(elId);
        if (!el) continue;

        const breathScale = 1.0 + (Math.sin(state.time_elapsed * 2.5 * speedMult + data.phase) * 0.03);
        const bobY = Math.sin(state.time_elapsed * 2.0 * speedMult + data.phase) * (window.innerHeight * 0.02);
        const driftX = Math.cos(state.time_elapsed * 1.5 * speedMult + data.phase) * (window.innerWidth * 0.02);

        const finalY = id === 'vertex' ? 0 : bobY;
        el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;

        // TEXTURE SWAPPING (TALK & BLINK)
        if (window.brain) {
            let stateStr = "";
            // TALK PRIORITY
            if (window.brain.talkingCreature === id) {
                if (Math.floor(state.time_elapsed / 0.15) % 2 === 0) stateStr = "_talk";
            } 
            // BLINKING
            else if (window.brain.blinkTimer > 3.0 && window.brain.blinkTimer < 3.2) {
                stateStr = "_blink";
            }

            if (id === 'solon') {
                // Solon layered logic
                const bodyEl = document.getElementById('solon-body');
                const newSrc = `assets/images/solon_body${stateStr}.png`;
                if (bodyEl && bodyEl.src.indexOf(newSrc) === -1) bodyEl.src = newSrc;
                
                // Fin logic
                solonState.timer += safeDt;
                if (solonState.timer > 0.15 / speedMult) {
                    solonState.timer = 0;
                    solonState.frame = (solonState.frame % totalSolonFrames) + 1;
                    const lFin = document.getElementById('solon-left-fin');
                    const rFin = document.getElementById('solon-right-fin');
                    if (lFin) lFin.src = `assets/images/solon_left_fin_${solonState.frame}.png`;
                    if (rFin) rFin.src = `assets/images/solon_right_fin_${solonState.frame}.png`;
                }
            } else {
                // Other creatures simple swap
                const newSrc = stateStr ? `assets/images/${id}${stateStr}.png` : `assets/images/${id}.png`;
                if (el.src.indexOf(newSrc) === -1) el.src = newSrc;
            }
        }
    }

    // PARTICLES
    if (Math.random() < 0.02) spawnParticle(); // Reduced spawn rate
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