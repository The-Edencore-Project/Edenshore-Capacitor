const state = { time_elapsed: 0, base_scroll: 0 };

const creatureData = {
    solon:  { baseX: 0.30, baseY: 0.55, scale: 0.20 },
    prism:  { baseX: 0.70, baseY: 0.55, scale: 0.26 },
    lumen:  { baseX: 0.20, baseY: 0.35, scale: 0.18 },
    ripple: { baseX: 0.75, baseY: 0.35, scale: 0.36 },
    vertex: { baseX: 0.50, baseY: 0.12, scale: 0.24 }
};

let shadowElements = {};

function initShadows() {
    const shadowLayer = document.getElementById('shadow-layer');
    if (!shadowLayer) return;
    
    for (const id in creatureData) {
        const shadow = document.createElement('div');
        shadow.className = 'creature-shadow';
        shadow.id = `shadow-${id}`;
        shadowLayer.appendChild(shadow);
        shadowElements[id] = shadow;
        
        if (window.physicsEngine) {
            window.physicsEngine.registerCreature(id, creatureData[id].baseX, creatureData[id].baseY, creatureData[id].scale);
        }
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
    
    if (window.physicsEngine) window.physicsEngine.resize();
    if (window.choreographyEngine) window.choreographyEngine.resize();
}

const particleLayer = document.createElement('div');
particleLayer.id = 'particle-layer';
particleLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; pointer-events:none;';
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.getElementById('scene');
    if (scene) scene.appendChild(particleLayer);
});

let lastTime = performance.now();
let dialogueCooldown = 0;

function tick(currentTime) {
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;
    const safeDt = Math.min(dt, 0.1); 

    state.time_elapsed += safeDt;
    if (window.brain) window.brain.update(safeDt); 

    state.base_scroll += safeDt * 100; 
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    const currentMood = window.brain ? window.brain.mood : "NORMAL";
    
    if (window.weatherEngine) window.weatherEngine.update(safeDt, currentMood);
    if (window.cinematicEngine) window.cinematicEngine.update(safeDt);
    
    if (window.physicsEngine) {
        window.physicsEngine.update(safeDt, state.time_elapsed, currentMood, shadowElements);
    }

    if (window.choreographyEngine) {
        const formation = window.choreographyEngine.getFormation(
            currentMood, window.innerWidth, window.innerHeight, state.time_elapsed
        );
        
        for (let i = 0; i < Object.keys(creatureData).length; i++) {
            const id = Object.keys(creatureData)[i];
            if (window.physicsEngine.creatures[id] && formation[i]) {
                const c = window.physicsEngine.creatures[id];
                c.x += (formation[i].x - c.x) * safeDt * 1.5;
                c.y += (formation[i].y - c.y) * safeDt * 1.5;
                
                const el = document.getElementById(id);
                if (el) el.style.transform = `translate(${c.x - (window.innerWidth * creatureData[id].baseX)}px, ${c.y - (window.innerHeight * (1.0 - creatureData[id].baseY))}px)`;
            }
        }
    }

    for (const [id, data] of Object.entries(creatureData)) {
        const el = document.getElementById(id);
        if (!el) continue;

        const isTalking = window.brain && window.brain.talkingCreature === id;
        const isBlinking = window.brain && window.brain.blinkTimer > 3.0 && window.brain.blinkTimer < 3.2;

        if (id === "solon" && window.solonActor) {
            window.solonActor.update(state.time_elapsed, currentMood, isTalking, isBlinking);
        } else {
            if (window.brain) {
                let stateStr = "";
                if (isTalking) {
                    if (Math.floor(state.time_elapsed / 0.15) % 2 === 0) stateStr = "_talk";
                } else if (isBlinking) {
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

    // DIALOGUE ENGINE TRIGGER
    dialogueCooldown += safeDt;
    if (dialogueCooldown > 20.0 && window.dialogue && !window.dialogue.isTalking) {
        dialogueCooldown = 0;
        
        // Pick a bank based on current context
        let bank = "ambient";
        if (currentMood === "PLAYFUL") bank = "jokes";
        else if (currentMood === "SLEEPY") bank = "lyrics";
        else if (currentMood === "CRISIS") bank = "huddle";
        else if (Math.random() > 0.5) bank = "council"; // 50% chance to just banter
        
        window.dialogue.triggerBank(bank);
    }

    requestAnimationFrame(tick);
}

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

document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.addEventListener('click', () => {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 800);
        });
    }
    
    // Initialize Dialogue Bridge
    if (window.initCrosstalk) window.initCrosstalk();
    
    initShadows();
    resize();
    requestAnimationFrame(tick); 
});

window.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('biome-btn')) return;
    if (window.brain) window.brain.addBond(1);
    
    // Tap reaction
    if (window.dialogue && !window.dialogue.isTalking && Math.random() > 0.7) {
        window.dialogue.triggerBank("reactions");
    }
}, { passive: true });

document.querySelectorAll('.biome-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const bg = document.getElementById('bg-gradient');
        if (bg) {
            bg.className = '';
            bg.classList.add(`biome-${e.target.dataset.biome.toLowerCase()}`);
        }
    });
});

window.addEventListener('resize', resize);