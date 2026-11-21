import { AMBIENT } from './dialogue/ambient.js';

const BANK = {
    ambient: AMBIENT,
    jokes: [],
    stories: [],
    facts: [],
    council: [],
    visitor: [],
    greetings: [["Vertex", "Hello! You're back!"]], 
    tap_reactions: [["Solon", "Watch the glass."]]
};

export function getBank(name) {
    return BANK[name] || [];
}