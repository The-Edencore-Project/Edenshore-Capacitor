class EdenshoreBrain {
    constructor() {
        this.bond = 0;
        this.mood = "NORMAL";
        this.sleepState = "AWAKE";
        this.motion = 0.0;
        this.battery = 1.0;
        this.timeElapsed = 0;
        this.heat = 0;
        this.talkingCreature = null;
        this.talkTimer = 0;
        this.blinkTimer = 0;
        this.lastNetOutput = [0.25, 0.25, 0.25, 0.25];

        this.tankCycle = "NORMAL";
        this.cycleTimer = 0;
        this.feedingTimer = 0;

        this.save = window.loadSave ? window.loadSave() : { bond_score: 0, next_milestone: 50, visits: 0 };
        this.bond = this.save.bond_score;
        this.forceAwakeUntil = 30.0;
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
        this.heat = Math.max(0, this.heat - dt * 0.1);

        this.cycleTimer += dt;
        if(this.tankCycle === "FEEDING") this.feedingTimer = Math.max(0, this.feedingTimer - dt);

        if (this.talkTimer > 0) {
            this.talkTimer -= dt;
            if (this.talkTimer <= 0) {
                this.talkingCreature = null;
                this.talkTimer = 0;
            }
        }
        this.blinkTimer += dt;
        if (this.blinkTimer > 3.4) this.blinkTimer = 0;

        if (window.arbiter) {
            this.mood = window.arbiter.getMood(this);
            if (window.arbiter.net && window.arbiter.net.lastOutput) {
                this.lastNetOutput = window.arbiter.net.lastOutput;
            }
        } else {
            if (this.motion > 0.4) this.mood = "PLAYFUL";
            else if (this.battery < 0.15) this.mood = "SLEEPY";
            else this.mood = "NORMAL";
        }

        if (this.forceAwakeUntil > 0) {
            this.forceAwakeUntil -= dt;
            this.mood = "NORMAL";
            this.sleepState = "AWAKE";
            return;
        }

        if (this.sleepState === "AWAKE") {
            if(this.tankCycle === "NORMAL" && this.cycleTimer > 22){
                this.tankCycle = "PLAYFUL";
                this.cycleTimer = 0;
            }else if(this.tankCycle === "PLAYFUL" && this.cycleTimer > 18){
                this.tankCycle = "FEEDING";
                this.feedingTimer = 10;
                this.cycleTimer = 0;
            }else if(this.tankCycle === "FEEDING" && this.cycleTimer >15){
                this.tankCycle = "DUSK";
                this.cycleTimer =0;
            }else if(this.tankCycle === "DUSK" && this.cycleTimer>12){
                this.tankCycle = "SLEEPING";
                this.cycleTimer =0;
            }
        }
        if(this.sleepState === "SLEEPING" && this.cycleTimer>35){
            this.sleepState = "WAKING";
            this.wakeTimer =12;
            this.tankCycle = "NORMAL";
            this.cycleTimer =0;
        }
        if (this.sleepState === "WAKING") {
            this.wakeTimer -= dt;
            if (this.wakeTimer <= 0) {
                this.sleepState = "AWAKE";
            }
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
