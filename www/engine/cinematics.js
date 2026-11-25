// =====================================================================
// EDENCORE ENGINE - cinematics.js (The Camera Engine)
// =====================================================================

class CinematicEngine {
    constructor() {
        this.active = false;
        this.timer = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.targetScale = 1.0;
    }

    trigger() {
        this.active = true;
        this.timer = 0;
        // Pick a random point to pan/zoom to
        this.targetX = (Math.random() * 0.4) + 0.3; // Middle 40% of screen
        this.targetY = (Math.random() * 0.4) + 0.3;
        this.targetScale = 1.2 + (Math.random() * 0.3); // Zoom in 20-50%
    }

    update(dt) {
        if (!this.active) return;

        this.timer += dt;

        // Cinematic lasts for 8 seconds
        if (this.timer > 8.0) {
            this.active = false;
            this.applyCamera(0.5, 0.5, 1.0); // Reset to center
            return;
        }

        // Smooth ease-in-out curve
        const p = this.timer / 8.0;
        const ease = (p < 0.5) ? (2 * p * p) : 1 - Math.pow(-2 * p + 2, 2) / 2;

        const currentX = 0.5 + (this.targetX - 0.5) * ease;
        const currentY = 0.5 + (this.targetY - 0.5) * ease;
        const currentScale = 1.0 + (this.targetScale - 1.0) * ease;

        this.applyCamera(currentX, currentY, currentScale);
    }

    applyCamera(x, y, scale) {
        const scene = document.getElementById('scene');
        if (!scene) return;

        // Pan and zoom the whole scene
        const translateX = (0.5 - x) * window.innerWidth;
        const translateY = (0.5 - y) * window.innerHeight;

        scene.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        scene.style.transition = 'transform 0.1s linear';
    }
}

window.cinematicEngine = new CinematicEngine();