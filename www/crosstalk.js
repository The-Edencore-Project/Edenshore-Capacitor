// =====================================================================
// EDENCORE - crosstalk.js (The Dialogue Bridge)
// =====================================================================

// We cannot use ES6 imports in a classic Capacitor script, so we attach 
// the data to the window object so systems/dialogue.js can find it.

window.CROSSTALK_BANKS = {};

// This function will be called by index.html after all dialogue files load
window.initCrosstalk = function() {
    window.CROSSTALK_BANKS = {
        ambient: window.DIALOGUE_AMBIENT || [],
        council: window.DIALOGUE_COUNCIL || [],
        facts: window.DIALOGUE_FACTS || [],
        huddle: window.DIALOGUE_HUDDLE || [],
        jokes: window.DIALOGUE_JOKES || [],
        poetry: window.DIALOGUE_POETRY || [],
        wisdom: window.DIALOGUE_WISDOM || [],
        dreams: window.DIALOGUE_DREAMS || [],
        daily: window.DIALOGUE_DAILY || [],
        bedtime: window.DIALOGUE_BEDTIME || []
    };
    console.log("Crosstalk initialized with", Object.keys(window.CROSSTALK_BANKS).length, "dialogue banks.");
};

window.getBank = function(name) {
    if (window.CROSSTALK_BANKS[name]) {
        return window.CROSSTALK_BANKS[name];
    }
    console.warn("Bank not found:", name);
    return [];
};