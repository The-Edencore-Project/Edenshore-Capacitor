// =====================================================================
// EDENCORE ENGINE - physics.js (The Physics & Shadow Engine)
// =====================================================================

class PhysicsEngine {
    constructor() {
        this.sandY = 0;
        this.creatures = {};
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
        this.sandY = window.innerHeight * 0.95;
    }

    update(dt, time_elapsed, mood, shadowElements) {
        let speedMult = 1.0;
        if (mood === "PLAYFUL") speedMult = 2.0;
        if (mood === "SLEEPY") speedMult = 0.3;

        for (const [id, c] of Object.entries(this.creatures)) {
            const bobY = Math.sin(time_elapsed * 2.0 * speedMult + c.phase) * (window.innerHeight * 0.02);
            const driftX = Math.cos(time_elapsed * 1.5 * speedMult + c.phase) * (window.innerWidth * 0.02);

            const finalY = (id === 'vertex') ? 0 : bobY;

            const el = document.getElementById(id);
            if (el) {
                el.style.transform = `translate(${driftX}px, ${finalY}px)`;

                if (shadowElements[id]) {
                    const rect = el.getBoundingClientRect();
                    const currentCy = rect.top + (rect.height / 2);
                    
                    const shadowDist = Math.max(0, this.sandY - currentCy);
                    const maxH = window.innerHeight * 0.8;
                    
                    let shadowAlpha = Math.max(0.1, 0.5 - (shadowDist / maxH));
                    let shadowScale = Math.max(0.4, 1.0 - (shadowDist / maxH));

                    const shadowEl = shadowElements[id];
                    const shadowW = (window.innerWidth * c.scale * 0.8) * shadowScale;
                    const shadowH = (window.innerHeight * 0.03) * shadowScale;
                    
                    shadowEl.style.width = shadowW + 'px';
                    shadowEl.style.height = shadowH + 'px';
                    shadowEl.style.left = (rect.left + rect.width / 2 - shadowW / 2) + 'px';
                    shadowEl.style.top = (this.sandY - shadowH / 2) + 'px';
                    shadowEl.style.background = `rgba(0, 0, 0, ${shadowAlpha})`;
                    shadowEl.style.filter = `blur(${shadowScale * 6}px)`;
                }
            }
        }
    }
}

window.physicsEngine = new PhysicsEngine();