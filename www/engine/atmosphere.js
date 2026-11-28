// =====================================================================
// EDENCORE ENGINE - atmosphere.js (V2 - Weather + Ambience)
// - Mood-driven tint and light rays (throttled, only opacity/transform
//   change per frame, so there are no full-screen repaints)
// - Builds the drifting bubbles and sparkles
// =====================================================================

class WeatherEngine {
    constructor() {
        this.currentTint = [0, 0, 0, 0];
        this.targetTint = [0, 0, 0, 0];
        this.currentRayAlpha = 0.35;
        this.targetRayAlpha = 0.35;
        this.timer = 0;
        this.sway = 0;
        this.tintTimer = 0;
        this.built = false;
    }

    buildAmbience() {
        if (this.built) return;
        this.built = true;
        const layer = document.getElementById('particle-layer');
        if (!layer) return;

        // Rising bubbles
        for (let i = 0; i < 8; i++) {   // kept light for older GPUs
            const b = document.createElement('div');
            b.className = 'bubble';
            const size = 4 + Math.random() * 14;
            b.style.width = size + 'px';