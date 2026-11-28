// =====================================================================
// EDENCORE ORCHESTRATOR - app.js (V5.0 - Aliveness Slice)
// V4 base + four new behaviours, all built from dialogue you already wrote:
//   1. Greeting on open (first visit / long absence / time of day)
//   2. Creatures notice where you tap (lean toward it, optional face flip)
//   3. Needs: food + attention drift up over real time, and they ask
//   4. Dreams while asleep (chosen by how neglected they feel)
// app.js is still the ONLY thing that writes a creature's transform.
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

// --- Aliveness State ---
let greeted = false;
let firstVisit = false;
let awayMs = 0;
let lastHiddenAt = 0;