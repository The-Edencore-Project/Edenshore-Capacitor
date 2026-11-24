class EdenshoreBrain {
    constructor() {
        this.bond = 0;
        this.mood = "NORMAL";
        this.motion = 0.0;
        this.battery = 1.0;
        this.timeElapsed = 0;
        this.heat = 0;
        
        // State for animations
        this.talkingCreature = null;
        this.talkTimer = 0;
        this.blinkTimer = 0;

        // Hydrate from save
        this.save = window.loadSave ? window.loadSave() : { bond_score: 0, next_milestone: 50, visits: 0 };
        this.bond = this.save.bond_score;

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
                b.addEventListener('levelchange', () => { this.battery = b.level; });
            });
        }
    }

    update(dt) {
        this.timeElapsed += dt;
        this.heat = Math.max(0, this.heat - dt * 0.1); // heat decay

        // TALK PRIORITY
        if (this.talkTimer > 0) {
            this.talkTimer -= dt;
            if (this.talkTimer <= 0) {
                this.talkingCreature = null;
                this.talkTimer = 0;
            }
        }

        // Blink ticker
        this.blinkTimer += dt;
        if (this.blinkTimer > 3.4) this.blinkTimer = 0;

        // Base Mood Logic
        if (this.motion > 0.4) this.mood = "PLAYFUL";
        else if (this.battery < 0.15) this.mood = "SLEEPY";
        else this.mood = "NORMAL";

        // Neural Net Override
        if (window.arbiter) {
            this.mood = window.arbiter.getMood(this);
        }
    }

    setTalking(speaker, duration) {
        this.talkingCreature = speaker.toLowerCase();
        this.talkTimer = duration;
    }

    addBond(amount) {
        this.bond += amount;
        this.save.bond_score = this.bond;
        this.save.visits = (this.save.visits || 0) + 1;
        if (window.saveData) window.saveData(this.save);
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