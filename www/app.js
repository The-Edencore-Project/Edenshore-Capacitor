// =====================================================================
// EDENCORE - app.js (Physics + Brain Link)
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

function tick(currentTime) {
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;
    const safeDt = Math.min(dt, 0.1); 
    
    state.time_elapsed += safeDt;
    brain.update(safeDt); // Update APM

    // Parallax
    state.base_scroll += safeDt * 100; 
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    // Creature Movement (Reacts to Brain Mood)
    let speedMult = 1.0;
    if (brain.mood === "PLAYFUL") speedMult = 2.0; // Move faster
    if (brain.mood === "SLEEPY") speedMult = 0.3;  // Move slower

    for (const [id, data] of Object.entries(creatures)) {
        const el = document.getElementById(id);
        if (!el) continue;

        const breathScale = 1.0 + (Math.sin(state.time_elapsed * 2.5 * speedMult + data.phase) * 0.03);
        const bobY = Math.sin(state.time_elapsed * 2.0 * speedMult + data.phase) * (window.innerHeight * 0.02);
        const driftX = Math.cos(state.time_elapsed * 1.5 * speedMult + data.phase) * (window.innerWidth * 0.02);

        const finalY = id === 'vertex' ? 0 : bobY;
        el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;
    }

    requestAnimationFrame(tick);
}

// Tap Screen to add Bond
window.addEventListener('touchstart', (e) => {
    brain.addBond(1); // Each tap = +1 Bond
});

// Biome Buttons
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
window.addEventListener('load', () => {
    resize(); 
    requestAnimationFrame(tick); 
});