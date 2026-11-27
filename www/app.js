// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V4.0 - Clean Single Version)
// One file, one loop. app.js is the ONLY thing that writes a creature's
// transform: position (from choreography) + offset (from physics).
// =====================================================================

// --- Core State ---
let lastTime = 0;
let time_elapsed = 0;
let debugMode = false;

// --- Timers & Flags ---
let idleTimer = 0;
let uiTickTimer = 0;
let currentMood = "NORMAL";
let readCooldown = 0;
let feedingTimer = 0;
let manualSleep = false;
let dimmed = false;
let volumeHigh = true;
let currentBiome = "LAGOON";

// --- Creature Registry ---
const CREATURE_IDS = ["solon", "prism", "lumen", "ripple", "vertex"];
const creatureState = {};
CREATURE_IDS.forEach(id => {
    creatureState[id] = {
        el: null,
        x: 0, y: 0,          // centre point (pixels)
        w: 100, h: 100,      // rendered size (pixels)
        offX: 0, offY: 0,    // bob/drift offsets written by physics.js