// =====================================================================
// EDENCORE - app.js (Clean Boot, No Injection)
// =====================================================================

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

let lastTime = performance.now();
let dialogueCooldown = 0;

function tick(currentTime) {
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;
    const safeDt = Math.min(dt, 0.1); 
    
    state.time_elapsed += safeDt;
    
    if (window.brain) {
        window.brain.update(safeDt); 
    }

    state.base_scroll += safeDt * 100; 
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    let speedMult = 1.0;
    if (window.brain && window.brain.mood === "PLAYFUL") speedMult = 2.0; 
    if (window.brain && window.brain.mood === "SLEEPY") speedMult = 0.3;  

    for (const [id, data] of Object.entries(creatures)) {
        const el = document.getElementById(id);
        if (!el) continue;

        const breathScale = 1.0 + (Math.sin(state.time_elapsed * 2.5 * speedMult + data.phase) * 0.03);
        const bobY = Math.sin(state.time_elapsed * 2.0 * speedMult + data.phase) * (window.innerHeight * 0.02);
        const driftX = Math.cos(state.time_elapsed * 1.5 * speedMult + data.phase) * (window.innerWidth * 0.02);

        const finalY = id === 'vertex' ? 0 : bobY;
        el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;
    }

    // Dialogue Trigger System
    dialogueCooldown += safeDt;
    // Trigger a line every 15 seconds if no one is talking
    if (dialogueCooldown > 15.0 && window.dialogue && !window.dialogue.isTalking) {
        dialogueCooldown = 0;
        let speaker = "Solon";
        if (window.brain) {
            if (window.brain.mood === "PLAYFUL") speaker = "Prism";
            else if (window.brain.mood === "SLEEPY") speaker = "Lumen";
        }
        window.dialogue.triggerRandom(speaker, window.brain.mood);
    }

    requestAnimationFrame(tick);
}

// --- SPLASH SCREEN DISMISSAL ---
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.addEventListener('click', () => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 800);
        });
    }

    resize();
    requestAnimationFrame(tick); 
});

// --- TAP TO ADD BOND ---
window.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('biome-btn')) return;
    if (window.brain) window.brain.addBond(1);
}, { passive: true });

// --- BIOME SWITCHING ---
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