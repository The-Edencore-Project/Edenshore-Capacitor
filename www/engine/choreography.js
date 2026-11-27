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
