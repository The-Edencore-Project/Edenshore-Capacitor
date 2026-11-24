// =====================================================================
// EDENCORE ENGINE - physics.js (The Physics & Shadow Engine)
// =====================================================================

class PhysicsEngine {
    constructor() {
        this.sandY = 0; // Will be calculated on resize
        this.creatures = {}; // Will hold actual x, y, and shadow data
    }

    registerCreature(id, baseX, baseY, scale) {
        this.creatures[id] = {
            id: id,
            x: window.innerWidth * baseX,
            y: window.innerHeight * (1.0 - baseY),
            vx: 0,
            vy: 0,
            scale: scale,
            phase: Math.random() * 6.28
        };
    }

    resize() {
        // The sand is the bottom 5% of the screen
        this.sandY = window.innerHeight * 0.95;
    }

    update(dt, time_elapsed, mood, shadowElements) {
        let speedMult = 1.0;
        if (mood === "PLAYFUL") speedMult = 2.0;
        if (mood === "SLEEPY") speedMult = 0.3;

        for (const [id, c] of Object.entries(this.creatures)) {
            // 1. Calculate natural bobbing (like Python's math.sin)
            const bobY = Math.sin(time_elapsed * 2.0 * speedMult + c.phase) * (window.innerHeight * 0.02);
            const driftX = Math.cos(time_elapsed * 1.5 * speedMult + c.phase) * (window.innerWidth * 0.02);

            // 2. Vertex sits on the ground, everyone else floats
            const finalY = (id === 'vertex') ? 0 : bobY;

            // 3. Apply to DOM (The actual movement)
            const el = document.getElementById(id);
            if (el) {
                // If it's Solon, we animate the container.
                el.style.transform = `translate(${driftX}px, ${finalY}px)`;
            }

            // 4. Calculate the Shadow
            if (shadowElements[id]) {
                // Get the actual screen position of the creature
                const rect = el.getBoundingClientRect();
                const currentCy = rect.top + (rect.height / 2);
                
                // Distance from the sand
                const shadowDist = Math.max(0, this.sandY - currentCy);
                const maxH = window.innerHeight * 0.8;
                
                // The higher up, the fainter and smaller the shadow
                let shadowAlpha = Math.max(0.1, 0.5 - (shadowDist / maxH));
                let shadowScale = Math.max(0.4, 1.0 - (shadowDist / maxH));

                const shadowEl = shadowElements[id];
                const shadowW = (window.innerWidth * c.scale * 0.8) * shadowScale;
                const shadowH = (window.innerHeight * 0.03) * shadowScale;
                
                shadowEl.style.width = shadowW + 'px';
                shadowEl.style.height = shadowH + 'px';
                shadowEl.style.left = (rect.left + rect.width / 2 - shadowW / 2) + 'px';
                shadowEl.style.top = (this.sandY - shadowH / 2) + 'px';
                // A deep black with a blur to match your Python shadows
                shadowEl.style.background = `rgba(0, 0, 0, ${shadowAlpha})`;
                shadowEl.style.filter = `blur(${shadowScale * 6}px)`;
            }
        }
    }
}

// Attach to window so app.js can use it
window.physicsEngine = new PhysicsEngine();