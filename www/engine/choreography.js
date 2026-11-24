// =====================================================================
// EDENCORE ENGINE - choreography.js (The Formation Engine)
// =====================================================================

class ChoreographyEngine {
    constructor() {
        this.sandY = 0;
    }

    resize() {
        this.sandY = window.innerHeight * 0.95;
    }

    // Returns an array of {x, y} coordinates for the 5 creatures
    getFormation(stateName, width, height, time, leaderName = null, feedingTimer = 0) {
        const coords = [];
        
        // Base positions (Idle)
        const basePos = [
            { x: 0.30, y: 0.55 }, // Solon
            { x: 0.70, y: 0.55 }, // Prism
            { x: 0.20, y: 0.35 }, // Lumen
            { x: 0.75, y: 0.35 }, // Ripple
            { x: 0.50, y: 0.12 }  // Vertex
        ];

        if (stateName === "SLEEPING") {
            // Huddle at the bottom center
            const huddleX = width * 0.5;
            const huddleY = this.sandY - (height * 0.15);
            for (let i = 0; i < 5; i++) {
                coords.push({
                    x: huddleX + Math.sin(time + i) * (width * 0.1),
                    y: huddleY + Math.cos(time + i) * (height * 0.05)
                });
            }
        } 
        else if (stateName === "WAKING") {
            // Leader floats up first, others follow
            for (let i = 0; i < 5; i++) {
                const isLeader = (i === 0); // Assuming Solon is leader index 0
                const delay = isLeader ? 0 : 1.5; 
                const progress = Math.max(0, Math.min(1, (time - delay) / 2.0));
                
                const targetY = height * (1.0 - basePos[i].y);
                const startY = this.sandY - (height * 0.15);
                
                coords.push({
                    x: width * basePos[i].x,
                    y: startY + ((targetY - startY) * progress)
                });
            }
        }
        else if (stateName === "FEEDING") {
            // Circle formation around the center, moving inward/outward
            const centerX = width * 0.5;
            const centerY = height * 0.5;
            const radius = width * 0.25;
            
            // Shrink the circle as they eat
            const currentRadius = radius * Math.max(0.3, (feedingTimer / 10.0));
            
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + (time * 0.5);
                coords.push({
                    x: centerX + Math.cos(angle) * currentRadius,
                    y: centerY + Math.sin(angle) * currentRadius
                });
            }
        }
        else if (stateName === "PLAYFUL") {
            // Fast, erratic chasing
            for (let i = 0; i < 5; i++) {
                coords.push({
                    x: width * basePos[i].x + Math.sin(time * 3 + i) * (width * 0.15),
                    y: height * (1.0 - basePos[i].y) + Math.cos(time * 3 + i) * (height * 0.1)
                });
            }
        }
        else {
            // NORMAL idle - gentle drifting
            for (let i = 0; i < 5; i++) {
                coords.push({
                    x: width * basePos[i].x + Math.sin(time * 0.5 + i) * (width * 0.05),
                    y: height * (1.0 - basePos[i].y) + Math.cos(time * 0.5 + i) * (height * 0.02)
                });
            }
        }

        return coords;
    }
}

window.choreographyEngine = new ChoreographyEngine();