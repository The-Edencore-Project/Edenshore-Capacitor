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
            b.style.height = size + 'px';
            b.style.left = (Math.random() * 100) + '%';
            b.style.animationDuration = (16 + Math.random() * 18) + 's';
            b.style.animationDelay = (-Math.random() * 30) + 's';
            b.style.setProperty('--dx', ((Math.random() - 0.5) * 80) + 'px');
            layer.appendChild(b);
        }

        // Twinkling sparkles
        for (let i = 0; i < 8; i++) {
            const s = document.createElement('div');
            s.className = 'sparkle' + (Math.random() < 0.4 ? ' blue' : '');
            const size = 2 + Math.random() * 3;
            s.style.width = size + 'px';
            s.style.height = size + 'px';
            s.style.left = (Math.random() * 100) + '%';
            s.style.top = (8 + Math.random() * 80) + '%';
            s.style.animationDuration = (2 + Math.random() * 4) + 's';
            s.style.animationDelay = (-Math.random() * 6) + 's';
            layer.appendChild(s);
        }
    }

    update(dt, mood) {
        this.timer += dt;
        this.sway += dt;

        // Shift weather every 30 seconds
        if (this.timer > 30) {
            this.timer = 0;
            if (mood === "SLEEPY") {
                this.targetRayAlpha = 0.15;
                this.targetTint = [0, 0, 0.1, 0.2];
            } else if (mood === "PLAYFUL") {
                this.targetRayAlpha = 0.6;
                this.targetTint = [0.1, 0.1, 0, 0.05];
            } else {
                this.targetRayAlpha = 0.35;
                this.targetTint = [0, 0, 0, 0];
            }
        }

        const k = Math.min(1, dt * 0.5);
        for (let i = 0; i < 4; i++) {
            this.currentTint[i] += (this.targetTint[i] - this.currentTint[i]) * k;
        }
        this.currentRayAlpha += (this.targetRayAlpha - this.currentRayAlpha) * k;

        // Tint: repaint-heavy, so only 4 times a second
        this.tintTimer += dt;
        if (this.tintTimer > 0.25) {
            this.tintTimer = 0;
            const tintEl = document.getElementById('weather-tint');
            if (tintEl) {
                const t = this.currentTint;
                tintEl.style.backgroundColor =
                    `rgba(${Math.round(t[0] * 255)}, ${Math.round(t[1] * 255)}, ${Math.round(t[2] * 255)}, ${t[3].toFixed(3)})`;
            }
        }

        // Rays: opacity + translate only (compositor friendly)
        const raysEl = document.getElementById('god-rays');
        if (raysEl) {
            raysEl.style.opacity = this.currentRayAlpha.toFixed(3);
            raysEl.style.transform = `translate3d(${(Math.sin(this.sway * 0.15) * 6).toFixed(2)}%, 0, 0)`;
        }
    }
}

window.weatherEngine = new WeatherEngine();
// Alias so older code that says "atmosphereEngine" keeps working
window.atmosphereEngine = window.weatherEngine;
 =====================================================================
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