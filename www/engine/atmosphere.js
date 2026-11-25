// =====================================================================
// EDENCORE ENGINE - atmosphere.js (The Weather Engine)
// =====================================================================

class WeatherEngine {
    constructor() {
        this.currentTint = [0, 0, 0, 0];
        this.targetTint = [0, 0, 0, 0];
        this.currentRayAlpha = 0.15;
        this.targetRayAlpha = 0.15;
        this.timer = 0;
        this.rayAngle = 15;
    }

    update(dt, mood) {
        this.timer += dt;

        // Shift weather every 30 seconds
        if (this.timer > 30) {
            this.timer = 0;
            
            if (mood === "SLEEPY") {
                this.targetRayAlpha = 0.05;
                this.targetTint = [0, 0, 0.1, 0.2];
            } else if (mood === "PLAYFUL") {
                this.targetRayAlpha = 0.3;
                this.targetTint = [0.1, 0.1, 0, 0.05];
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
        
        const tintEl = document.getElementById('weather-tint');
        if (tintEl) {
            tintEl.style.backgroundColor = `rgba(${this.currentTint[0]*255}, ${this.currentTint[1]*255}, ${this.currentTint[2]*255}, ${this.currentTint[3]})`;
        }
        
        const raysEl = document.getElementById('god-rays');
        if (raysEl) {
            raysEl.style.opacity = this.currentRayAlpha;
            // Make the rays gently sway
            this.rayAngle = 15 + Math.sin(this.timer * 0.2) * 10;
            raysEl.style.background = `linear-gradient(${this.rayAngle}deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 220, 0.15) 40%, rgba(255, 255, 255, 0) 70%)`;
        }
    }
}

window.weatherEngine = new WeatherEngine();