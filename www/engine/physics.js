// =====================================================================
// EDENCORE ENGINE - physics.js (V2 - Bob, Drift & Shadows)
// Does NOT touch the creature's transform. It only writes offsets
// (offX / offY) into creatureState. app.js combines position + offset
// into the single transform, so nothing fights over it.
// =====================================================================

class PhysicsEngine {
    constructor() {
        this.sandY = 0;
        this.phases = { solon: 0, prism: 1.5, lumen: 2.0, ripple: 3.0, vertex: 4.0 };
    }

    resize() {
        this.sandY = window.innerHeight * 0.95;
    }

    // states: window.creatureState   shadows: { id: element }
    update(dt, time_elapsed, mood, states, shadows) {
        let speedMult = 1.0;
        if (mood === "PLAYFUL") speedMult = 2.0;
        if (mood === "SLEEPY") speedMult = 0.3;

        const H = window.innerHeight;
        const sandY = this.sandY || H * 0.95;
        const maxH = H * 0.8;

        for (const id in states) {
            const c = states[id];
            if (!c || !c.el) continue;

            const phase = this.phases[id] || 0;
            const bobY = Math.sin(time_elapsed * 2.0 * speedMult + phase) * (H * 0.015);
            const driftX = Math.cos(time_elapsed * 1.5 * speedMult + phase) * (window.innerWidth * 0.015);

            c.offX = driftX;
            c.offY = (id === "vertex") ? 0 : bobY;   // the crab stays on the sand

            const sh = shadows ? shadows[id] : null;
            if (sh) {
                const cy = c.y + c.offY;
                const dist = Math.max(0, sandY - cy);
                const alpha = Math.max(0.1, 0.5 - (dist / maxH));
                const scale = Math.max(0.4, 1.0 - (dist / maxH));
                const sx = (c.w * 0.8 / 100) * scale;   // shadow base size is 100 x 20 px
                const sy = scale;
                sh.style.opacity = alpha;
                sh.style.transform = `translate(${c.x + c.offX - 50}px, ${sandY - 10}px) scale(${sx}, ${sy})`;
            }
        }
    }
}

window.physicsEngine = new PhysicsEngine();
