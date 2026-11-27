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
