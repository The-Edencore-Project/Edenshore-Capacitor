// =====================================================================
// EDENCORE PROJECT - app.js (V0.1 Web Engine)
// =====================================================================

const state = {
    time_elapsed: 0,
    base_scroll: 0,
    current_biome: "LAGOON"
};

// Define the starting X/Y ratios for the Council
const creatures = {
    solon:  { phase: Math.random() * 6.28, baseX: 0.30, baseY: 0.50 },
    prism:  { phase: Math.random() * 6.28, baseX: 0.70, baseY: 0.55 },
    lumen:  { phase: Math.random() * 6.28, baseX: 0.20, baseY: 0.35 },
    ripple: { phase: Math.random() * 6.28, baseX: 0.75, baseY: 0.35 },
    vertex: { phase: Math.random() * 6.28, baseX: 0.50, baseY: 0.15 }
};

// 1. Resize Logic (Calculates exact pixel sizes and initial positions)
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
            const cy = window.innerHeight * creatures[id].baseY; 
            
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
        // Modulo math creates the infinite loop effect
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    // --- CREATURE ANIMATION (Breathing & Bobbing) ---
    for (const [id, data] of Object.entries(creatures)) {
        const el = document.getElementById(id);
        if (!el) continue;

        const breathScale = 1.0 + (Math.sin(state.time_elapsed * 2.5 + data.phase) * 0.03);
        const bobY = Math.sin(state.time_elapsed * 2.0 + data.phase) * (window.innerHeight * 0.02);
        const driftX = Math.cos(state.time_elapsed * 1.5 + data.phase) * (window.innerWidth * 0.02);

        // Vertex stays on the sand (bobs less)
        const finalY = id === 'vertex' ? (bobY * 0.2) : bobY;

        el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;
    }

    requestAnimationFrame(tick);
}

// 3. UI Interaction (Biome Switching)
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