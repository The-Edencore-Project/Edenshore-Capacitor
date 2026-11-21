const SAVE_KEY = "edenshore_save";

const DEFAULT_SAVE = {
    bond_score: 0,
    next_milestone: 50,
    user_name: "Guest",
    last_visit_time: Date.now(),
    vibe_journal: [],
    max_heat_seen: 0
};

export function loadSave() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) {
            localStorage.setItem(SAVE_KEY, JSON.stringify(DEFAULT_SAVE));
            return { ...DEFAULT_SAVE };
        }
        return JSON.parse(saved);
    } catch (e) {
        return { ...DEFAULT_SAVE };
    }
}

export function saveData(data) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("Could not save data");
    }
}

export function addBond(save, amount) {
    save.bond_score += amount;
    let milestoneReached = false;
    if (save.bond_score >= save.next_milestone) {
        save.next_milestone += 50;
        milestoneReached = true;
    }
    saveData(save);
    return milestoneReached;
}

export function getStatus(save) {
    let score = save.bond_score;
    let tier = "Stranger";
    if (score > 10) tier = "Acquaintance";
    if (score > 50) tier = "Friend";
    if (score > 100) tier = "Companion";
    if (score > 500) tier = "Family";
    return `BOND: ${score} - ${tier}`;
}