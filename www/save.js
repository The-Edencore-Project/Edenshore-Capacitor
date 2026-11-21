const SAVE_KEY = "edenshore_save";
const DEFAULT_SAVE = { bond_score: 0, next_milestone: 50, visits: 0 };

export function loadSave() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        return saved ? JSON.parse(saved) : { ...DEFAULT_SAVE };
    } catch (e) { return { ...DEFAULT_SAVE }; }
}

export function saveData(data) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
}

export function addBond(save, amount) {
    save.bond_score += amount;
    if (save.bond_score >= save.next_milestone) {
        save.next_milestone += 50;
        saveData(save);
        return true;
    }
    saveData(save);
    return false;
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