// =====================================================================
// EDENCORE ENGINE - choreography.js
// =====================================================================

class ChoreographyEngine {
    constructor() {
        this.sandY = 0;
        this.creatureKeys = ["solon", "prism", "lumen", "ripple", "vertex"];
    }

    resize() {
        this.sandY = window.innerHeight * 0.95;
    }

    getFormation(stateName, width, height, time, feedingTimer = 0) {
        const coords = [];
        
        const basePos = [
            { x: 0.30, y: 0.55 }, // Solon
            { x: 0.70, y: 0.55 }, // Prism
            { x: 0.20, y: 0.35 }, // Lumen
            { x: 0.75, y: 0.35 }, // Ripple
            { x: 0.50, y: 0.12 }  // Vertex
        ];

        // THE SLEEP FIX: If the brain says SLEEPING, force the huddle
        const isSleeping = (window.brain && window.brain.sleepState !== "AWAKE") || stateName === "SLEEPING";

        if (isSleeping) {
            const huddleX = width * 0.5;
            const huddleY = this.sandY - (height * 0.15);
            for (let i = 0; i < 5; i++) {
                coords.push({
                    x: huddleX + Math.sin(time + i) * (width * 0.05),
                    y: huddleY + Math.cos(time + i) * (height * 0.03)
                });
            }
        } 
        else if (stateName === "FEEDING") {
            // The Theatre of Feeding (Circle Formation)
            const centerX = width * 0.5;
            const centerY = height * 0.65;
            const radius = width * 0.20;
            
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + (time * 0.5);
                // Contract the circle as the timer runs down
                const currentRadius = radius * Math.max(0.4, (feedingTimer / 10.0));
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
                    x: width * basePos[i].x + Math.sin(time * 0.5 + i) * (width * 0.03),
                    y: height * (1.0 - basePos[i].y) + Math.cos(time * 0.5 + i) * (height * 0.02)
                });
            }
        }

        return coords;
    }
}

window.choreographyEngine = new ChoreographyEngine();