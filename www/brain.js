import { Arbiter } from './neural.js';
import { getBank } from './crosstalk.js';
import { addBond, getStatus } from './save.js';

class ShuffleBag {
    constructor(name, items, isPermanent = false) {
        this.name = name;
        this.items = items || [];
        this.isPermanent = isPermanent;
        this.drawn = [];
        this.recent = [];
    }
    draw() {
        if (!this.items || this.items.length === 0) return null;
        
        let available = this.items.filter((_, idx) => !this.drawn.includes(idx));
        
        if (available.length === 0) {
            // Remember last 20 draws to avoid immediate repeats
            this.recent = [...this.recent, ...this.drawn].slice(-20);
            this.drawn = [];
            available = this.items.filter((_, idx) => !this.recent.includes(idx));
            if (available.length === 0) available = [...this.items];
        }
        
        const choice = available[Math.floor(Math.random() * available.length)];
        this.drawn.push(this.items.indexOf(choice));
        return choice;
    }
    getState() { return { drawn: this.drawn, recent: this.recent }; }
    setState(saved) {
        if (saved) {
            this.drawn = saved.drawn || [];
            this.recent = saved.recent || [];
        }
    }
}

export class Brain {
    constructor(save) {
        this.save = save;
        this.arbiter = new Arbiter();

        // State
        this.cooldown = 5.0;
        this.hasGreeted = false;
        this.greetDelay = 0.5;
        this.forcedScene = null;
        this.currentMood = "NORMAL";
        this.brainActivity = [0,0,0,0,0,0,0,0];
        
        // Sleep/Wake
        this.sleepState = "AWAKE"; // AWAKE, RESISTING, SLEEPING, WAKING
        this.sleepTimer = 0.0;
        this.wakingLeader = null;
        
        // Riddle Game
        this.gameState = "normal"; // normal, riddle_setup, riddle_wait
        this.currentRiddle = null;
        this.riddleTimer = 0.0;
        
        // Heat & Interaction
        this.heat = 0;
        this.heatCoolTimer = 0.0;
        this.lastTapTime = Date.now();
        this.lastInteractionTime = Date.now();
        
        // Biomes
        this.currentBiome = "LAGOON";
        this.biomeCooldown = 0.0;
        
        // Vibe Engine
        this.pendingDream = null;
        this.pendingAbsence = false;
        this.vibeJournal = JSON.parse(localStorage.getItem('vibe_journal') || '[]');
        
        // Banks
        const bankNames = [
            "jokes", "stories", "facts", "poetry", "lyrics", "requests", "wisdom",
            "ambient", "council", "visitor", "greetings", "peering_eyes",
            "tap_reactions", "feed_reactions", "tap_grunts", "feed_grunts", "interjections",
            "huddle", "dream_nightmare", "dream_peaceful", "dream_playful", "dream_absence",
            "daily_morning", "daily_evening", "daily_night", "daily_absence", "daily_stress", "daily_busy", "daily_weather",
            "biome_LAGOON", "biome_SHORE", "biome_TWILIGHT", "biome_DEEP",
            "bedtime_resistance", "waking_nudge", "waking_others"
        ];
        
        this.bags = {};
        bankNames.forEach(name => {
            const isPerm = ["jokes","stories","facts","poetry","lyrics","requests","wisdom","biome_LAGOON","biome_SHORE","biome_TWILIGHT","biome_DEEP"].includes(name);
            this.bags[name] = new ShuffleBag(name, getBank(name), isPerm);
        });
        
        this.riddleBag = new ShuffleBag("riddles", getBank("riddles"), true);
    }

    // ============================================================
    // SENSOR PARAMS (Mock for 32-input NN)
    // ============================================================
    get32Params() {
        const now = new Date();
        const idle = (Date.now() - this.lastTapTime) / 1000;
        
        const v1 = [0.8, 0.0, 0.0, 0.1, 1.0, 0.0, 0.5, 0.0]; // Light, Motion, etc
        const v2 = [now.getHours()/23, now.getDay()/6, 0, 0, 0, 0, 0, now.getMonth()/12];
        const v3 = [Math.min(this.heat/20,1), 0, Math.min(idle/300,1), Math.min(this.save.bond_score/1000,1), Math.min(this.heat/10,1), 0.5, 0, 0];
        const v4 = [0.5, 0.5, 0.25, 0, 0, 0, 0, 0]; 
        
        return [...v1, ...v2, ...v3, ...v4];
    }

    // ============================================================
    // ACTIONS
    // ============================================================
    onTap() {
        this.lastTapTime = Date.now();
        this.lastInteractionTime = Date.now();

        if (this.sleepState !== "AWAKE") {
            this.wakeUp();
            return null;
        }
        
        if (this.gameState === "riddle_wait") return null; // Ignore world taps during riddle

        this.heat++;
        this.heatCoolTimer = 0;

        if (this.heat >= 6) {
            this.cooldown = 0;
            this.forcedScene = this.bags["huddle"].draw();
            return;
        }
        
        if (this.heat === 1) {
            const reaction = this.bags["tap_reactions"].draw();
            const pivot = this.bags[Math.random() > 0.5 ? "ambient" : "council"].draw();
            if (reaction) this.forcedScene = [...reaction, ...(pivot || [])];
            this.cooldown = 5.0;
        } else if (this.heat === 2) {
            this.forcedScene = this.bags["tap_grunts"].draw();
            this.cooldown = 4.0;
        }
        return this.forcedScene;
    }

    onCreatureTap(creatureName) {
        this.lastInteractionTime = Date.now();
        if (this.gameState !== "riddle_wait") return;
        
        this.gameState = "normal";
        this.riddleTimer = 0;
        
        if (creatureName === this.currentRiddle.correct_speaker) {
            addBond(this.save, 5);
            this.forcedScene = this.currentRiddle.correct_reply;
        } else {
            this.forcedScene = this.currentRiddle.wrong_reply;
        }
        this.cooldown = 8.0;
    }

    onFeed() {
        if (this.gameState !== "normal" || this.sleepState !== "AWAKE") return null;
        this.lastInteractionTime = Date.now();
        this.heat++;
        
        if (this.heat === 1) {
            const reaction = this.bags["feed_reactions"].draw();
            const pivot = this.bags[Math.random() > 0.5 ? "ambient" : "council"].draw();
            if (reaction) this.forcedScene = [...reaction, ...(pivot || [])];
            this.cooldown = 5.0;
            return this.bags["visitor"].draw();
        } else if (this.heat === 2) {
            this.forcedScene = this.bags["feed_grunts"].draw();
            this.cooldown = 4.0;
        }
        return null;
    }

    onBiomeSwitch(biomeName) {
        this.currentBiome = biomeName;
        addBond(this.save, 1);
        this.heat++;
        this.lastInteractionTime = Date.now();
        
        if (this.biomeCooldown <= 0) {
            const scene = this.bags[`biome_${biomeName}`].draw();
            if (scene) this.forcedScene = [scene];
            this.cooldown = 4.0;
            this.biomeCooldown = 6.0;
        }
    }

    triggerSleep() {
        if (this.sleepState === "AWAKE") {
            this.sleepState = "RESISTING";
            this.sleepTimer = 15.0;
            this.lastInteractionTime = Date.now();
        }
    }

    wakeUp() {
        if (this.sleepState === "SLEEPING" || this.sleepState === "RESISTING") {
            this.sleepState = "WAKING";
            this.sleepTimer = 12.0;
            const leaders = ["Ripple", "Prism", "Solon", "Lumen"];
            this.wakingLeader = leaders[Math.floor(Math.random() * leaders.length)];
            this.lastInteractionTime = Date.now();
            this.lastTapTime = Date.now();
        }
    }

    resolveRequest(count) {
        if (count === 2) { this.startRiddle(); return; }
        const category = count === 1 ? "lyrics" : count === 3 ? "jokes" : count === 4 ? "facts" : "stories";
        const scene = this.bags[category].draw();
        if (scene) {
            this.forcedScene = scene;
            this.cooldown = 6.0;
        }
    }

    startRiddle() {
        const riddle = this.riddleBag.draw();
        if (!riddle) {
            this.forcedScene = [["Solon", "My mind is blank. No more riddles today."]];
            this.cooldown = 8.0;
            return;
        }
        this.currentRiddle = riddle;
        this.gameState = "riddle_setup";
        this.forcedScene = riddle.setup;
        this.cooldown = 15.0;
    }

    // ============================================================
    // MAIN UPDATE LOOP
    // ============================================================
    update(dt) {
        const now = Date.now();
        const idleSec = (now - this.lastTapTime) / 1000;

        // Sleep Timers
        if (this.sleepState === "RESISTING") {
            this.sleepTimer -= dt;
            if (this.sleepTimer <= 0) { this.sleepState = "SLEEPING"; this.forcedScene = null; }
        } else if (this.sleepState === "WAKING") {
            this.sleepTimer -= dt;
            if (this.sleepTimer <= 0) { this.sleepState = "AWAKE"; }
        } else if (this.sleepState === "AWAKE" && idleSec > 300) {
            this.sleepState = "SLEEPING";
        }

        // Riddle Timer
        if (this.gameState === "riddle_wait") {
            this.riddleTimer -= dt;
            if (this.riddleTimer <= 0) {
                this.gameState = "normal";
                this.forcedScene = [["Solon", "Too slow. The moment has passed."]];
                this.cooldown = 8.0;
            }
            return null;
        }

        if (this.gameState === "riddle_setup") {
            this.gameState = "riddle_wait";
            this.riddleTimer = 10.0;
            return this.forcedScene;
        }

        if (this.forcedScene) {
            const scene = this.forcedScene;
            this.forcedScene = null;
            return scene;
        }

        if (this.cooldown > 0) {
            this.cooldown -= dt;
            return null;
        }

        // Heat Decay
        this.heatCoolTimer += dt;
        if (this.heatCoolTimer >= 5.0) {
            this.heat = Math.max(0, this.heat - 1);
            this.heatCoolTimer = 0;
        }

        // Biomes
        if (this.biomeCooldown > 0) this.biomeCooldown -= dt;

        // Greeting
        if (!this.hasGreeted) {
            this.greetDelay -= dt;
            if (this.greetDelay <= 0) {
                this.hasGreeted = true;
                this.cooldown = 8.0;
                return this.bags["greetings"].draw();
            }
            return null;
        }

        if (this.sleepState !== "AWAKE") return null;

        // Neural Net Mood Update
        const params = this.get32Params();
        this.currentMood = this.arbiter.getMood(this);
        this.brainActivity = this.arbiter.getActivity();

        // Random Event Rolls
        if (Math.random() < 0.02) {
            const prompt = this.bags["requests"].draw();
            if (prompt) {
                this.forcedScene = prompt;
                this.cooldown = 10.0;
                return this.forcedScene;
            }
        }

        if (Math.random() < 0.35) {
            const interjection = this.bags["interjections"].draw();
            if (interjection) {
                this.cooldown = 3.0;
                return interjection;
            }
        }

        // Mood-based selection
        let cat = "ambient";
        if (this.currentMood === "CRISIS") cat = "huddle";
        else if (this.currentMood === "SLEEPY") cat = "lyrics";
        else if (this.currentMood === "PLAYFUL") cat = Math.random() > 0.5 ? "jokes" : "stories";

        const scene = this.bags[cat].draw();
        if (scene) {
            this.cooldown = 5.0;
            return scene;
        }
        return null;
    }
}