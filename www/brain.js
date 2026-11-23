class EdenshoreBrain {
    constructor() {
        this.bond = 0;
        this.mood = "NORMAL";
        this.motion = 0.0;
        this.battery = 1.0;
        this.timeElapsed = 0;
        
        // ANIMATION STATES
        this.talkingCreature = null;
        this.talkTimer = 0;
        this.blinkTimer = 0;
        
        this.initSensors();
        this.updateUI();
    }

    initSensors() {
        window.addEventListener('devicemotion', (e) => {
            let acc = e.accelerationIncludingGravity;
            if (acc) {
                let mag = Math.sqrt((acc.x * acc.x) + (acc.y * acc.y) + (acc.z * acc.z));
                let mov = Math.abs(mag - 9.8);
                if (mov < 1.5) mov = 0.0; 
                this.motion = Math.min(1.0, mov / 10.0); 
            }
        });

        if (navigator.getBattery) {
            navigator.getBattery().then((b) => {
                this.battery = b.level;
                b.addEventListener('levelchange', () => this.battery = b.level);
            });
        }
    }

    setTalking(speaker, duration) {
        this.talkingCreature = speaker;
        this.talkTimer = duration;
    }

    update(dt) {
        this.timeElapsed += dt;
        
        // Mood Logic
        if (this.motion > 0.4) this.mood = "PLAYFUL";
        else if (this.battery < 0.15) this.mood = "SLEEPY";
        else this.mood = "NORMAL";

        if (window.audio) window.audio.setMood(this.mood);

        // TALK TIMER
        if (this.talkTimer > 0) this.talkTimer -= dt;
        else this.talkingCreature = null;

        // BLINK TIMER
        this.blinkTimer += dt;
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
        if (el) el.innerText = "BOND: " + this.bond + " - " + title;
    }
}

window.brain = new EdenshoreBrain();