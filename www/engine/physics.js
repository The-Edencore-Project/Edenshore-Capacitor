// =====================================================================
// EDENCORE ENGINE - physics.js (V3 - Living Drift)
// Restores the slow wandering aquarium feel of the Golden Code.
// Writes ONLY offX/offY and shadows.
// app.js remains the sole owner of creature transforms.
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
            speedMult = 1.5;
        }

        if (mood === "SLEEPY") {
            speedMult = 0.4;
        }

        for (const id in states) {

            const c = states[id];

            if (!c || !c.el) continue;

            const phase = this.phases[id] || 0;

            // --------------------------------------------------
            // Gentle vertical buoyancy
            // --------------------------------------------------

            const bobY =
                Math.sin(
                    time_elapsed * 1.4 * speedMult + phase
                ) * (H * 0.02);

            // --------------------------------------------------
            // Slow horizontal wandering
            // --------------------------------------------------

            const longDrift =
                Math.cos(
                    time_elapsed * 0.30 * speedMult + phase
                ) * (W * 0.04);

            const shortSway =
                Math.sin(
                    time_elapsed * 1.0 * speedMult + phase
                ) * (W * 0.01);

            const driftX =
                longDrift + shortSway;

            // --------------------------------------------------
            // Apply offsets
            // --------------------------------------------------

            c.offX = driftX;

            if (id === "vertex") {

                // Tiny crab breathing movement

                c.offY =
                    Math.sin(
                        time_elapsed * 2.5 + phase
                    ) * (H * 0.0025);

            } else {

                c.offY = bobY;
            }

            // --------------------------------------------------
            // Dynamic shadows
            // --------------------------------------------------

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
