import { DIALOGUE } from './dialogue/index.js';

export function getBank(name) {
    return DIALOGUE[name] || [];
}

export function getAllBanks() {
    return DIALOGUE;
}