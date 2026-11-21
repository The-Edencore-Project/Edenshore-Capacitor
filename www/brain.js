import { Arbiter } from './neural.js';
import { getBank } from './crosstalk.js';
import { addBond } from './save.js';

export class Brain {
    constructor(save) {
        this.save = save;
        this.arbiter = new Arbiter();
        this.currentMood = "NORMAL";
        this.heat = 0;
        this.cooldown = 5.0;
        this.hasGreeted = false;
        this.greetDelay = 1.0;
        this.forcedScene = null;
        this.lastTapTime = Date.now();
        this.sleepState = "AWAKE";
        
        this.bags = {};
        ["jokes", "stories", "facts", "ambient", "council", "visitor", "greetings", "tap_reactions"].forEach(name => {
            this.bags[name] = new ShuffleBag(getBank(name));
        });
    }

    update(dt) {
        this.cooldown -= dt;
        if ((Date.now() - this.lastTapTime) / 1000 > 2.0) this.heat = 0;

        this.currentMood = this.sleepState === "AWAKE" ? this.arbiter.getMood(this) : "SLEEPY";

        if (!this.hasGreeted) {
            this.greetDelay -= dt;
            if (this.greetDelay <= 0) {
                this.hasGreeted = true;
                this.cooldown = 8.0;
                // It will draw from an empty bag and safely return null
                return this.bags["greetings"].draw(); 
            }
        }

        if (this.forcedScene) {
            let scene = this.forcedScene;
            this.forcedScene = null;
            return scene;
        }

        if (this.cooldown > 0 || this.sleepState !== "AWAKE") return null;

        if (Math.random() < 0.05) {
            let cat = this.currentMood === "CRISIS" ? "council" : "ambient";
            let scene = this.bags[cat].draw();
            if (scene) { this.cooldown = 5.0; return scene; }
        }
        return null;
    }

    onTap() {
        this.lastTapTime = Date.now();
        this.heat += 1;
        if (this.heat >= 3) {
            this.forcedScene = [["Solon", "Enough! The glass is not a toy."]];
            this.cooldown = 5.0;
        } else if (this.heat === 1) {
            let reaction = this.bags["tap_reactions"].draw();
            if (reaction) this.forcedScene = reaction;
        }
        return this.forcedScene;
    }

    onFeed() {
        this.lastTapTime = Date.now();
        this.heat += 1;
        return [["Vertex", "Food!"]];
    }
}

class ShuffleBag {
    constructor(items) { this.items = [...items]; this.drawn = []; }
    draw() {
        if (this.items.length === 0) return null; // Safely handle empty banks
        let available = this.items.filter(i => !this.drawn.includes(i));
        if (available.length === 0) { this.drawn = []; available = this.items; }
        let choice = available[Math.floor(Math.random() * available.length)];
        this.drawn.push(choice);
        return choice;
    }
}