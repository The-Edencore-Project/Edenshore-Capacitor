// =====================================================================
// EDENCORE PROJECT - app.js (V0.1 Web Engine)
// =====================================================================

const state = {
    time_elapsed: 0,
    base_scroll: 0,
    current_biome: "LAGOON"
};

// 1. Resize Logic (Handles different phone screens)
function resize() {
    // We calculate scale based on the smallest dimension (like V4.4)
    const baseSize = Math.min(window.innerWidth, window.innerHeight);
    
    // Scale Solon (0.20 base scale from V4.4)
    const solon = document.getElementById('solon');
    const solonScale = baseSize * 0.20;
    solon.style.width = solonScale + 'px';
    solon.style.height = 'auto';
    
    // Position Solon in the center for now
    solon.style.left = (window.innerWidth / 2) - (solonScale / 2) + 'px';
    solon.style.top = (window.innerHeight / 2) - (solonScale / 2) + 'px';
}

// 2. The Main Loop
let lastTime = performance.now();

function tick(currentTime) {
    // Calculate Delta Time (dt)
    const dt = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;
    
    // Cap dt to prevent massive jumps if the app lags
    const safeDt = Math.min(dt, 0.1); 
    state.time_elapsed += safeDt;

    // --- PARALLAX SCROLLING ---
    state.base_scroll += safeDt * 100; // Scroll speed

    const parallaxElements = document.querySelectorAll('.parallax');
    parallaxElements.forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        // Math to loop the background infinitely
        const offset = -(state.base_scroll * speed) % (window.innerWidth);
        el.style.transform = `translateX(${offset}px)`;
    });

    // --- CREATURE MOVEMENT (Solon Test) ---
    const solon = document.getElementById('solon');
    // Gentle Sine wave bobbing up and down (V4.4 breathing logic)
    const bobY = Math.sin(state.time_elapsed * 2.0) * (window.innerHeight * 0.02);
    
    // Apply translation to Solon (keeping him centered horizontally for now)
    solon.style.transform = `translateY(${bobY}px)`;

    // Request the next frame
    requestAnimationFrame(tick);
}

// 3. UI Interaction (Biome Switching)
document.querySelectorAll('.biome-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active class from all
        document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
        // Add to clicked
        e.target.classList.add('active');
        
        // Change Background
        const biome = e.target.dataset.biome;
        state.current_biome = biome;
        const bg = document.getElementById('bg-gradient');
        
        // Remove old classes
        bg.className = '';
        // Add new class
        bg.classList.add(`biome-${biome.toLowerCase()}`);
    });
});

// 4. Initialize
window.addEventListener('resize', resize);
window.addEventListener('load', () => {
    resize(); // Initial setup
    requestAnimationFrame(tick); // Start the engine
});