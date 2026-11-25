// =====================================================================
// EDENCORE ENGINE - atmosphere.js (The Weather Engine)
// =====================================================================

class WeatherEngine {
    constructor() {
        this.currentTint = [0, 0, 0, 0]; // RGBA
        this.targetTint = [0, 0, 0, 0];
        this.currentRayAlpha = 0.15;
        this.targetRayAlpha = 0.15;
        this.timer = 0;
    }

    update(dt, mood) {
        this.timer += dt;

        // Every 30 seconds, shift the weather slightly
        if (this.timer > 30) {
            this.timer = 0;
            
            if (mood === "SLEEPY") {
                this.targetRayAlpha = 0.05;
                this.targetTint = [0, 0, 0.1, 0.2]; // Blueish dark tint
            } else if (mood === "PLAYFUL") {
                this.targetRayAlpha = 0.3;
                this.targetTint = [0.1, 0.1, 0, 0.05]; // Golden tint
            } else {
                this.targetRayAlpha = 0.15;
                this.targetTint = [0, 0, 0, 0];
            }
        }

        // Smoothly interpolate
        for (let i = 0; i < 4; i++) {
            this.currentTint[i] += (this.targetTint[i] - this.currentTint[i]) * dt * 0.5;
        }
        this.currentRayAlpha += (this.targetRayAlpha - this.currentRayAlpha) * dt * 0.5;
        
        // Apply to CSS (We will add the god-rays div in HTML)
        const tintEl = document.getElementById('weather-tint');
        if (tintEl) {
            tintEl.style.backgroundColor = `rgba(${this.currentTint[0]*255}, ${this.currentTint[1]*255}, ${this.currentTint[2]*255}, ${this.currentTint[3]})`;
        }
        
        const raysEl = document.getElementById('god-rays');
        if (raysEl) {
            raysEl.style.opacity = this.currentRayAlpha;
        }
    }
}

window.weatherEngine = new WeatherEngine();