// =====================================================================
// EDENCORE - brain.js (V0.1 Syntax-Repaired)
// =====================================================================

class EdenshoreBrain {
    constructor() {
        this.bond = 0;
        this.mood = "NORMAL";
        this.motion = 0.0;
        this.battery = 1.0;
        this.timeElapsed = 0;
        
        this.initSensors();
        this.updateUI();
    }

    initSensors() {
        // 1. Motion Sensor
        window.addEventListener('devicemotion', (e) => {
            let acc = e.accelerationIncludingGravity;
            if (acc) {
                let mag = Math.sqrt((acc.x * acc.x) + (acc.y * acc.y) + (acc.z * acc.z));
                let mov = Math.abs(mag - 9.8);
                if (mov < 1.5) {
                    mov = 0.0; 
                }
                this.motion = Math.min(1.0, mov / 10.0); 
            }
        });

        // 2. Battery Sensor
        if (navigator.getBattery) {
            navigator.getBattery().then((b) => {
                this.battery = b.level;
                b.addEventListener('levelchange', () => {
                    this.battery = b.level;
                });
            });
        }
    }

    update(dt) {
        this.timeElapsed += dt;
        
        // Mood Logic
        if (this.motion > 0.4) {
            this.mood = "PLAYFUL";
        } else if (this.battery < 0.15) {
            this.mood = "SLEEPY";
        } else {
            this.mood = "NORMAL";
        }
    }

    addBond(amount) {
        this.bond += amount;
        this.updateUI();
    }

    updateUI() {
        let title = "Stranger";
        if (this.bond >= 10) title = "Acquaintance";
        if (this.bond >= 50) title = "Friend";
        if (this.bond >= 100) title = "Council Member";
        
        const el = document.getElementById("bond-text");
        if (el) {
            el.innerText = "BOND: " + this.bond + " - " + title;
        }
    }
}

// Attach to window so app.js can always find it
window.brain = new EdenshoreBrain();