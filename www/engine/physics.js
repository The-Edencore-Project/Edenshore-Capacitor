// =====================================================================
// EDENCORE ENGINE - physics.js (V3 - Living Drift)
// Restores the slow wandering "aquarium life" feeling from Kivy.
// Only writes offX/offY and shadows.
// app.js remains the sole owner of transforms.
// =====================================================================

class PhysicsEngine {
    constructor() {
        this.sandY = 0;

        this.phases = {
            solon: 0.0,
            prism: 1.5,
            lumen: 2.0,
            ripple: 3.0,
            vertex: 4.0
        };
    }

    resize() {
        this.sandY = window.innerHeight * 0.95;
    }

    update(dt, time_elapsed, mood, states, shadows) {

        const W = window.innerWidth;
        const H = window.innerHeight;

        const sandY = this.sandY || H * 0.95;
        const maxH = H * 0.8;

        let speedMult = 1.0;

        if (mood === "PLAYFUL") {
            speedMult = 1.6;
        }

        if (mood === "SLEEPY") {
            speedMult = 0.45;
        }

        for (const id in states) {

            const c = states[id];

            if (!c || !c.el) continue;

            const phase = this.phases[id] || 0;

            // -------------------------------------------------
            // Vertical floating
            // -------------------------------------------------

            const bobY =
                Math.sin(
                    time_elapsed * 1.4 * speedMult + phase
                ) * (H * 0.02);

            // -------------------------------------------------
            // Long horizontal aquarium drift
            // -------------------------------------------------

            const wanderX =
                Math.cos(
                    time_elapsed * 0.35 * speedMult + phase
                ) * (W * 0.035);

            const swayX =
                Math.sin(
                    time_elapsed * 0.9 * speedMult + phase
                ) * (W * 0.008);

            const driftX =
                wanderX + swayX;

            // -------------------------------------------------
            // Creature behaviour
            // -------------------------------------------------

            c.offX = driftX;

            if (id === "vertex") {
                c.offY =
                    Math.sin(
                        time_elapsed * 2.2 + phase
                    ) * (H * 0.003);
            } else {
                c.offY = bobY;
            }

            // -------------------------------------------------
            // Shadow projection
            // -------------------------------------------------

            const sh = shadows ? shadows[id] : null;

            if (sh) {

                const cy = c.y + c.offY;

                const dist =
                    Math.max(
                        0,
                        sandY - cy
                    );

                const alpha =
                    Math.max(
                        0.05,
                        0.55 - (dist / maxH)
                    );

                const scale =
                    Math.max(
                        0.35,
                        1.0 - (dist / maxH)
                    );

                const sx =
                    (c.w * 0.8 / 100) * scale;

                const sy = scale;

                sh.style.opacity = alpha;

                sh.style.transform =
                    `translate(${(c.x + c.offX - 50).toFixed(1)}px, ${(sandY - 10).toFixed(1)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
            }
        }
    }
}

window.physicsEngine = new PhysicsEngine();
