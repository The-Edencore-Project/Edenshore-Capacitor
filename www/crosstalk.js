// Import your dialogue files here as you convert them from .py to .js
import { AMBIENT } from './dialogue/ambient.js';

export const DIALOGUE_BANK = {
    ambient: AMBIENT,
    // You will add jokes, stories, council, etc., here later
};

export function getBank(bankName) {
    return DIALOGUE_BANK[bankName] || [];
}