// =====================================================================
// EDENCORE - crosstalk.js (The Dialogue Bridge + Anti-Repeat)
// =====================================================================

class ShuffleBag {
    constructor(items) {
        this.items = items;
        this.drawn = [];        // hashes already drawn this cycle
        this.recent = [];       // last 20 draws to prevent immediate repeats
        this.maxRecent = 20;
    }

    // Simple hash so we don't compare huge arrays
    _hash(item) {
        return JSON.stringify(item);
    }

    draw() {
        if (!this.items || this.items.length === 0) return null;

        // If we've exhausted the bag, reset it
        if (this.drawn.length >= this.items.length) {
            this.drawn = [];
        }

        // Filter out items in the recent memory
        let available = this.items.filter(item => {
            const h = this._hash(item);
            return !this.drawn.includes(h) && !this.recent.includes(h);
        });

        // If everything is in recent memory, fall back to full bank minus drawn
        if (available.length === 0) {
            available = this.items.filter(item => {
                const h = this._hash(item);
                return !this.drawn.includes(h);
            });
        }

        // Absolute fallback if the bank is tiny
        if (available.length === 0) {
            available = this.items;
        }

        // Pick a random item from the available pool
        const chosen = available[Math.floor(Math.random() * available.length)];
        const chosenHash = this._hash(chosen);

        // Roll the drawn hashes into the recent memory
        this.drawn.push(chosenHash);
        this.recent.push(chosenHash);

        // Keep recent memory trimmed
        if (this.recent.length > this.maxRecent) {
            this.recent.shift();
        }

        return chosen;
    }
}

// ---- The Banks ----
// We map the global variables (which are loaded via <script> tags in index.html)
// to a clean dictionary for the engine to access.
const bankMap = {
    ambient:        () => window.DIALOGUE_AMBIENT || [],
    bedtime:        () => window.DIALOGUE_BEDTIME_RESISTANCE || [],
    waking_nudge:   () => window.DIALOGUE_WAKING_NUDGE || [],
    waking_others:  () => window.DIALOGUE_WAKING_OTHERS || [],
    biome:          () => window.DIALOGUE_BIOME || {},
    daily_morning:  () => window.DIALOGUE_DAILY_MORNING || [],
    daily_evening:  () => window.DIALOGUE_DAILY_EVENING || [],
    daily_late:     () => window.DIALOGUE_DAILY_LATE_NIGHT || [],
    daily_absence:  () => window.DIALOGUE_DAILY_ABSENCE || [],
    daily_stress:   () => window.DIALOGUE_DAILY_STRESS || [],
    daily_busy:     () => window.DIALOGUE_DAILY_BUSY || [],
    daily_weather:  () => window.DIALOGUE_DAILY_WEATHER || [],
    dreams_nightmare: () => window.DIALOGUE_DREAMS_NIGHTMARE || [],
    dreams_peaceful:  () => window.DIALOGUE_DREAMS_PEACEFUL || [],
    dreams_playful:   () => window.DIALOGUE_DREAMS_PLAYFUL || [],
    dreams_absence:   () => window.DIALOGUE_DREAMS_ABSENCE || [],
    huddle:         () => window.DIALOGUE_HUDDLE || [],
    lyrics:         () => window.DIALOGUE_LYRICS || [],
    poetry:         () => window.DIALOGUE_POETRY || [],
    reactions_tap:  () => window.DIALOGUE_TAP_REACTIONS || [],
    reactions_feed: () => window.DIALOGUE_FEED_REACTIONS || [],
    tap_grunts:     () => window.DIALOGUE_TAP_GRUNTS || [],
    feed_grunts:    () => window.DIALOGUE_FEED_GRUNTS || [],
    interjections:  () => window.DIALOGUE_INTERJECTIONS || [],
    requests:       () => window.DIALOGUE_REQUESTS || [],
    riddles:        () => window.DIALOGUE_RIDDLES || [],
    stories:        () => window.DIALOGUE_STORIES || [],
    visitor:        () => window.DIALOGUE_VISITOR || [],
    greetings:      () => window.DIALOGUE_GREETINGS || [],
    peering_eyes:   () => window.DIALOGUE_PEERING_EYES || [],
    wisdom:         () => window.DIALOGUE_WISDOM || [],
    council:        () => window.DIALOGUE_COUNCIL || [],
    facts:          () => window.DIALOGUE_FACTS || [],
    jokes:          () => window.DIALOGUE_JOKES || [],
    
    // THE NEW NATURAL SPEECH BANK
    chatter:        () => window.DIALOGUE_CHATTER || []
};

// ---- ShuffleBag Registry (one bag per bank) ----
const bags = {};

function getBag(bankName) {
    if (!bags[bankName]) {
        const bankData = bankMap[bankName];
        if (bankData) {
            const resolvedData = bankData();
            // Handle biome which is an object of arrays, not a direct array
            if (bankName === 'biome') {
                bags[bankName] = {}; 
                for (const key in resolvedData) {
                    bags[bankName][key] = new ShuffleBag(resolvedData[key]);
                }
            } else {
                bags[bankName] = new ShuffleBag(resolvedData);
            }
        } else {
            console.warn(`[Crosstalk] Bank not found: ${bankName}`);
            return null;
        }
    }
    return bags[bankName];
}

// ---- The Draw Function (used by dialogue.js) ----
function drawFromBank(bankName, subKey = null) {
    const bag = getBag(bankName);
    if (!bag) return null;

    if (bankName === 'biome') {
        // Biome requires a subKey (e.g., 'LAGOON', 'DEEP')
        if (subKey && bag[subKey]) {
            return bag[subKey].draw();
        }
        return null;
    }

    return bag.draw();
}

// Make globally available for dialogue.js
window.drawFromBank = drawFromBank;