// This is your Bridge. We are leaving it empty for now.
// Later, we will import your 5,000 lines here.

const BANK = {
    jokes: [], stories: [], facts: [], ambient: [], council: [], 
    visitor: [], greetings: [], tap_reactions: []
};

export function getBank(name) {
    return BANK[name] || [];
}