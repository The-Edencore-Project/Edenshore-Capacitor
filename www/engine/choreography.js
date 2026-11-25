// =====================================================================
// EDENCORE ENGINE - choreography.js (The Formation Engine)
// =====================================================================

class ChoreographyEngine {
    constructor() {
        this.sandY = 0;
        this.creatureKeys = ["solon", "prism", "lumen", "ripple", "vertex"];
    }

    resize() {
        this.sandY = window.innerHeight * 0.95;
    }

    getFormation(stateName, width, height, time, leaderName = null, feedingTimer = 0) {
        const coords = [];
        
        // Base idle positions
        const basePos = [
            { x: 0.30, y: 0.55 }, // Solon
            { x: 0.70, y: 0.55 }, // Prism
            { x: 0.20, y: 0.35 }, // Lumen
            { x: 0.75, y: 0.35 }, // Ripple
            { x: 0.50, y: 0.12 }  // Vertex
        ];

        if (stateName === "SLEEPING") {
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
            for (let i = 0; i < 5; i++) {
                const isLeader = (this.creatureKeys[i] === leaderName);
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
            const centerX = width * 0.5;
            const centerY = height * 0.55;
            const radius = width * 0.2;
            
            // Shrink the circle as they eat
            const currentRadius = radius * Math.max(0.4, (feedingTimer / 10.0));
            
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + (time * 0.8);
                coords.push({
                    x: centerX + Math.cos(angle) * currentRadius,
                    y: centerY + Math.sin(angle) * currentRadius
                });
            }
        }
        else if (stateName === "PLAYFUL") {
            for (let i = 0; i < 5; i++) {
                coords.push({
                    x: width * basePos[i].x + Math.sin(time * 3 + i) * (width * 0.15),
                    y: height * (1.0 - basePos[i].y) + Math.cos(time * 3 + i) * (height * 0.1)
                });
            }
        }
        else {
            // NORMAL
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