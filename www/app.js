// =====================================================================
// EDENCORE PROJECT - app.js (V0.1 Web Engine)
// =====================================================================

const state = {
    time_elapsed: 0,
    base_scroll: 0,
    current_biome: "LAGOON"
};

// Define the starting X/Y ratios for the Council
// Y-axis: 0.0 is bottom (sand), 1.0 is top (surface)
const creatures = {
    solon:  { phase: Math.random() * 6.28, baseX: 0.30, baseY: 0.55 },
    prism:  { phase: Math.random() * 6.28, baseX: 0.70, baseY: 0.55 },
    lumen:  { phase: Math.random() * 6.28, baseX: 0.20, baseY: 0.35 },
    ripple: { phase: Math.random() * 6.28, baseX: 0.75, baseY: 0.35 },
    vertex: { phase: Math.random() * 6.28, baseX: 0.50, baseY: 0.12 } // Vertex near sand
};

// 1. Resize Logic
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
            
            // THE FIX: Invert Y-axis (1.0 - baseY) because Web is top-left, not bottom-left
            const cy = window.innerHeight * (1.0 - creatures[id].baseY); 
            
            el.style.left = (cx - size / 2) + 'px';
            el.style.top = (cy - size / 2) + 'px';
        }
    });
}

// 2. The Main Loop
let lastTime = performance.now();

function tick(currentTime) {
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;
    
    const safeDt = Math.min(dt, 0.1); 
    state.time_elapsed += safeDt;

    // --- PARALLAX SCROLLING ---
    state.base_scroll += safeDt * 100; 
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    // --- CREATURE ANIMATION ---
    for (const [id, data] of Object.entries(creatures)) {
        const el = document.getElementById(id);
        if (!el) continue;

        const breathScale = 1.0 + (Math.sin(state.time_elapsed * 2.5 + data.phase) * 0.03);
        const bobY = Math.sin(state.time_elapsed * 2.0 + data.phase) * (window.innerHeight * 0.02);
        const driftX = Math.cos(state.time_elapsed * 1.5 + data.phase) * (window.innerWidth * 0.02);

        // THE FIX: Vertex stays grounded on the sand (no bobbing)
        const finalY = id === 'vertex' ? 0 : bobY;

        el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;
    }

    requestAnimationFrame(tick);
}

// 3. UI Interaction
document.querySelectorAll('.biome-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        state.current_biome = e.target.dataset.biome;
        const bg = document.getElementById('bg-gradient');
        
        bg.className = '';
        bg.classList.add(`biome-${state.current_biome.toLowerCase()}`);
    });
});

// 4. Initialize
window.addEventListener('resize', resize);
window.addEventListener('load', () => {
    resize(); 
    requestAnimationFrame(tick); 
});