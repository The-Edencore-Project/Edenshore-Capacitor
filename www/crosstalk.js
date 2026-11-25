// =====================================================================
// EDENCORE - crosstalk.js (The Dialogue Bridge + Anti-Repeat)
// =====================================================================

class ShuffleBag {
    constructor(items) {
        this.items = items || [];
        this.drawn = [];        // hashes already drawn this cycle
        this.recent = [];       // last 20 draws to prevent immediate repeats
        this.isPermanent = true;
    }

    // Simple hash so we don't compare huge arrays
    _hash(item) {
        return JSON.stringify(item).slice(0, 100);
    }

    draw() {
        if (this.items.length === 0) return null;

        // Build the set of items not yet drawn this cycle
        const drawnHashes = new Set(this.drawn.map(i => this._hash(i)));
        let available = this.items.filter(item => !drawnHashes.has(this._hash(item)));

        // If we've exhausted the bag, reset it
        if (available.length === 0) {
            // Roll the drawn hashes into the recent memory
            this.recent = [...this.recent, ...this.drawn].slice(-20);
            this.drawn = [];

            // Filter out items in the recent memory
            const recentHashes = new Set(this.recent.map(i => this._hash(i)));
            available = this.items.filter(item => !recentHashes.has(this._hash(item)));

            // If everything is in recent memory, fall back to full bank
            if (available.length === 0) available = [...this.items];
        }

        // Pick a random item from the available pool
        const chosen = available[Math.floor(Math.random() * available.length)];
        this.drawn.push(chosen);
        return chosen;
    }
}

// ---- The Banks ----
window.getBank = function(name) {
    const banks = {
        ambient: window.DIALOGUE_AMBIENT,
        council: window.DIALOGUE_COUNCIL,
        facts: window.DIALOGUE_FACTS,
        huddle: window.DIALOGUE_HUDDLE,
        jokes: window.DIALOGUE_JOKES,
        lyrics: window.DIALOGUE_LYRICS,
        poetry: window.DIALOGUE_POETRY,
        requests: window.DIALOGUE_REQUESTS,
        riddles: window.DIALOGUE_RIDDLES,
        stories: window.DIALOGUE_STORIES,
        wisdom: window.DIALOGUE_WISDOM,
        visitor: window.DIALOGUE_VISITOR,
        greetings: window.DIALOGUE_GREETINGS,
        peering_eyes: window.DIALOGUE_PEERING_EYES,
        tap_reactions: window.DIALOGUE_TAP_REACTIONS,
        feed_reactions: window.DIALOGUE_FEED_REACTIONS,
        tap_grunts: window.DIALOGUE_TAP_GRUNTS,
        feed_grunts: window.DIALOGUE_FEED_GRUNTS,
        interjections: window.DIALOGUE_INTERJECTIONS,
        daily_morning: window.DIALOGUE_DAILY_MORNING,
        daily_evening: window.DIALOGUE_DAILY_EVENING,
        daily_night: window.DIALOGUE_DAILY_LATE_NIGHT,
        daily_absence: window.DIALOGUE_DAILY_ABSENCE,
        daily_stress: window.DIALOGUE_DAILY_STRESS,
        daily_busy: window.DIALOGUE_DAILY_BUSY,
        daily_weather: window.DIALOGUE_DAILY_WEATHER,
        dream_nightmare: window.DIALOGUE_DREAMS_NIGHTMARE,
        dream_peaceful: window.DIALOGUE_DREAMS_PEACEFUL,
        dream_playful: window.DIALOGUE_DREAMS_PLAYFUL,
        dream_absence: window.DIALOGUE_DREAMS_ABSENCE,
        bedtime_resistance: window.DIALOGUE_BEDTIME_RESISTANCE,
        waking_nudge: window.DIALOGUE_WAKING_NUDGE,
        waking_others: window.DIALOGUE_WAKING_OTHERS,
        biome_LAGOON: window.DIALOGUE_BIOME ? window.DIALOGUE_BIOME["LAGOON"] : [],
        biome_SHORE: window.DIALOGUE_BIOME ? window.DIALOGUE_BIOME["SHORE"] : [],
        biome_TWILIGHT: window.DIALOGUE_BIOME ? window.DIALOGUE_BIOME["TWILIGHT"] : [],
        biome_DEEP: window.DIALOGUE_BIOME ? window.DIALOGUE_BIOME["DEEP"] : []
    };
    
    if (banks[name]) return banks[name];
    console.warn("Bank not found:", name);
    return [];
};

// ---- ShuffleBag Registry (one bag per bank) ----
const bags = {};
function getBag(bankName) {
    if (!bags[bankName]) {
        bags[bankName] = new ShuffleBag(window.getBank(bankName));
    }
    return bags[bankName];
}

// ---- The Draw Function (used by dialogue.js) ----
window.drawFromBank = function(bankName) {
    const bag = getBag(bankName);
    return bag.draw();
};