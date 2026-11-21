// =====================================================================
// EDENCORE PROJECT - app.js (V0.1 Web Engine - The Council)
// =====================================================================

const state = {
    time_elapsed: 0,
    base_scroll: 0,
    current_biome: "LAGOON"
};

// Store creature data so we can animate them
const creatures = {
    solon:  { phase: Math.random() * 6.28, baseX: 0.30, baseY: 0.55 },
    prism:  { phase: Math.random() * 6.28, baseX: 0.70, baseY: 0.55 },
    lumen:  { phase: Math.random() * 6.28, baseX: 0.20, baseY: 0.35 },
    ripple: { phase: Math.random() * 6.28, baseX: 0.75, baseY: 0.35 },
    vertex: { phase: Math.random() * 6.28, baseX: 0.50, baseY: 0.15 }
};

// 1. Resize Logic
function resize() {
    const baseSize = Math.min(window.innerWidth, window.innerHeight);
    
    document.querySelectorAll('.creature').forEach(el => {
        const scale = parseFloat(el.dataset.scale);
        const size = baseSize * scale;
        
        // Set size
        el.style.width = size + 'px';
        el.style.height = 'auto';
        
        // Set base positions (using the data object above)
        const id = el.id;
        if (creatures[id]) {
            const cx = window.innerWidth * creatures[id].baseX;
            // Adjust Y based on screen height. Vertex stays near the sand.
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
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    // --- CREATURE ANIMATION ---
    // Loop through each creature and apply the V4.4 math
    for (const [id, data] of Object.entries(creatures)) {
        const el = document.getElementById(id);
        if (!el) continue;

        // Breathing scale (subtle 3% pulse)
        const breathScale = 1.0 + (Math.sin(state.time_elapsed * 2.5 + data.phase) * 0.03);
        
        // Bobbing Y offset (2% of screen height)
        const bobY = Math.sin(state.time_elapsed * 2.0 + data.phase) * (window.innerHeight * 0.02);
        
        // Floating X offset (slow drift left and right)
        const driftX = Math.cos(state.time_elapsed * 1.5 + data.phase) * (window.innerWidth * 0.02);

        // Apply transforms. 
        // Vertex (the crab) doesn't bob as much because he's on the ground.
        const finalY = id === 'vertex' ? (bobY * 0.2) : bobY;

        el.style.transform = `translate(${driftX}px, ${finalY}px) scale(${breathScale})`;
    }

    requestAnimationFrame(tick);
}

// 3. UI Interaction
document.querySelectorAll('.biome-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const biome = e.target.dataset.biome;
        state.current_biome = biome;
        const bg = document.getElementById('bg-gradient');
        
        bg.className = '';
        bg.classList.add(`biome-${biome.toLowerCase()}`);
    });
});

// 4. Initialize
window.addEventListener('resize', resize);
window.addEventListener('load', () => {
    resize(); 
    requestAnimationFrame(tick); 
});