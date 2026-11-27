// =====================================================================
// EDENCORE ENGINE - choreography.js (V2 - Formation Engine)
// Returns an OBJECT keyed by creature id. Every position is a CENTER
// point in PIXELS, so app.js can use it directly.
// =====================================================================

class ChoreographyEngine {
    constructor() {
        this.sandY = 0;
        this.creatureKeys = ["solon", "prism", "lumen", "ripple", "vertex"];

        // Home positions as fractions of the screen, measured from the TOP.
        // Layout matches the "AI Screensaver" reference video.
        this.home = {
            solon:  { x: 0.36, y: 0.36 },  // turtle, upper centre-left
            prism:  { x: 0.74, y: 0.42 },  // goldfish, upper right
            lumen:  { x: 0.24, y: 0.66 },  // jellyfish, lower left
            ripple: { x: 0.78, y: 0.60 },  // seahorse, mid right
            vertex: { x: 0.56, y: 0.80 }   // crab, on the sand
        };
    }

    resize() {
        this.sandY = window.innerHeight * 0.95;
    }

    getFormation(stateName, width, height, time, feedingTimer = 0) {
        const out = {};
        const keys = this.creatureKeys;

        const isSleeping = (window.brain && window.brain.sleepState !== "AWAKE") || stateName === "SLEEPING";

        if (isSleeping) {
            // Huddle on the sand
            const huddleY = (this.sandY || height * 0.95) - (height * 0.15);
            keys.forEach((k, i) => {
                out[k] = {
                    x: width * 0.5 + (i - 2) * (width * 0.08) + Math.sin(time * 0.6 + i) * (width * 0.01),
                    y: huddleY + Math.cos(time * 0.6 + i) * (height * 0.008)
                };
            });
        } else if (stateName === "FEEDING") {
            // Circle that tightens as the feeding timer runs down
            const centerX = width * 0.5;
            const centerY = height * 0.62;
            const radius = width * 0.20 * Math.max(0.4, feedingTimer / 10.0);
            keys.forEach((k, i) => {
                const angle = (i / keys.length) * Math.PI * 2 + (time * 0.5);
                out[k] = {
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                };
            });
        } else if (stateName === "PLAYFUL") {
            keys.forEach((k, i) => {
                const h = this.home[k];
                out[k] = {
                    x: width * h.x + Math.sin(time * 3 + i) * (width * 0.12),
                    y: height * h.y + Math.cos(time * 3 + i) * (height * 0.06)
                };
            });
        } else {
            // NORMAL: gentle sway around home
            keys.forEach((k, i) => {
                const h = this.home[k];
                out[k] = {
                    x: width * h.x + Math.sin(time * 0.5 + i) * (width * 0.02),
                    y: height * h.y + (k === "vertex" ? 0 : Math.cos(time * 0.5 + i) * (height * 0.015))
                };
            });
        }

        return out;
    }
}

window.choreographyEngine = new ChoreographyEngine();
