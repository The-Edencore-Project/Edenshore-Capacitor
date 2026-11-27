class ShuffleBag {
    constructor(items) {
        this.items = items || [];
        this.drawn = [];
        this.recent = [];
        this.maxRecent = 20;
    }
    _hash(item) { return JSON.stringify(item); }
    draw() {
        if (this.items.length === 0) return null;
        if (this.drawn.length >= this.items.length) this.drawn = [];
        let available = this.items.filter(item => {
            const h = this._hash(item);
            return !this.drawn.includes(h) && !this.recent.includes(h);
        });
        if (available.length === 0) {
            available = this.items.filter(item => !this.drawn.includes(this._hash(item)));
        }
        if (available.length === 0) available = this.items;
        const chosen = available[Math.floor(Math.random() * available.length)];
        const h = this._hash(chosen);
        this.drawn.push(h);
        this.recent.push(h);
        if (this.recent.length > this.maxRecent) this.recent.shift();
        return chosen;
    }
}

const bankMap = {
    ambient: () => window.DIALOGUE_AMBIENT,
    bedtime: () => window.DIALOGUE_BEDTIME_RESISTANCE,
    waking_nudge: () => window.DIALOGUE_WAKING_NUDGE,
    waking_others: () => window.DIALOGUE_WAKING_OTHERS,
    biome: () => window.DIALOGUE_BIOME,
    daily_morning: () => window.DIALOGUE_DAILY_MORNING,
    daily_evening: () => window.DIALOGUE_DAILY_EVENING,
    daily_late: () => window.DIALOGUE_DAILY_LATE_NIGHT,
    daily_absence: () => window.DIALOGUE_DAILY_ABSENCE,
    daily_stress: () => window.DIALOGUE_DAILY_STRESS,
    daily_busy: () => window.DIALOGUE_DAILY_BUSY,
    daily_weather: () => window.DIALOGUE_DAILY_WEATHER,
    dreams_nightmare: () => window.DIALOGUE_DREAMS_NIGHTMARE,
    dreams_peaceful: () => window.DIALOGUE_DREAMS_PEACEFUL,
    dreams_playful: () => window.DIALOGUE_DREAMS_PLAYFUL,
    dreams_absence: () => window.DIALOGUE_DREAMS_ABSENCE,
    huddle: () => window.DIALOGUE_HUDDLE,
    lyrics: () => window.DIALOGUE_LYRICS,
    poetry: () => window.DIALOGUE_POETRY,
    reactions_tap: () => window.DIALOGUE_TAP_REACTIONS,
    reactions_feed: () => window.DIALOGUE_FEED_REACTIONS,
    tap_grunts: () => window.DIALOGUE_TAP_GRUNTS,
    feed_grunts: () => window.DIALOGUE_FEED_GRUNTS,
    interjections: () => window.DIALOGUE_INTERJECTIONS,
    requests: () => window.DIALOGUE_REQUESTS,
    riddles: () => window.DIALOGUE_RIDDLES,
    stories: () => window.DIALOGUE_STORIES,
    visitor: () => window.DIALOGUE_VISITOR,
    greetings: () => window.DIALOGUE_GREETINGS,
    peering_eyes: () => window.DIALOGUE_PEERING_EYES,
    wisdom: () => window.DIALOGUE_WISDOM,
    council: () => window.DIALOGUE_COUNCIL,
    facts: () => window.DIALOGUE_FACTS,
    jokes: () => window.DIALOGUE_JOKES,
    chatter: () => window.DIALOGUE_CHATTER
};

const bags = {};
function getBag(bankName) {
    if (!bags[bankName]) {
        const data = bankMap[bankName] ? bankMap[bankName]() : null;
        if (!data) return null;
        if (bankName === 'biome') {
            bags[bankName] = {};
            for (const key in data) bags[bankName][key] = new ShuffleBag(data[key]);
        } else {
            bags[bankName] = new ShuffleBag(data);
        }
    }
    return bags[bankName];
}

function drawFromBank(bankName, subKey = null) {
    const bag = getBag(bankName);
    if (!bag) return null;
    if (bankName === 'biome') {
        if (subKey && bag[subKey]) return bag[subKey].draw();
        return null;
    }
    return bag.draw();
}
window.drawFromBank = drawFromBank;
