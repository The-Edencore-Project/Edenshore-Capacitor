// ==============================================
// EDENSHORE AQUARIUM — FULL COMPLETE app.js
// ==============================================

// --------------------------
// GLOBAL VARIABLES
// --------------------------
let lastTime = 0;
let time_elapsed = 0;
let debugMode = false;

// NEW FEATURE VARIABLES
let tankDriftTimer = 0;
let idleChatTimer = 0;

// --------------------------
// LOAD ALL OUR MODULES
// --------------------------
// actors
importScripts("actors/creatures.js");
importScripts("actors/solon.js");

// dialogue systems
importScripts("dialogue/ambient.js");
importScripts("dialogue/bedtime.js");
importScripts("dialogue/biome.js");
importScripts("dialogue/council.js");
importScripts("dialogue/daily.js");
importScripts("dialogue/dreams.js");
importScripts("dialogue/facts.js");
importScripts("dialogue/huddle.js");
importScripts("dialogue/jokes.js");
importScripts("dialogue/lyrics.js");
importScripts("dialogue/poetry.js");
importScripts("dialogue/reactions.js");
importScripts("dialogue/requests.js");
importScripts("dialogue/riddles.js");
importScripts("dialogue/stories.js");
importScripts("dialogue/visitor.js");
importScripts("dialogue/wisdom.js");

// engine core
importScripts("engine/atmosphere.js");
importScripts("engine/choreography.js");
importScripts("engine/cinematics.js");
importScripts("engine/physics.js");

// game systems
importScripts("systems/audio.js");
importScripts("systems/brain.js");
importScripts("systems/dialogue.js");
importScripts("systems/neural.js");
importScripts("systems/save.js");

// cross talk
importScripts("crosstalk.js");

// --------------------------
// NEW FEATURE FUNCTIONS
// --------------------------
function hideSplash(){
    const splash = document.getElementById("splashScreen");
    if(splash) splash.style.display = "none";
}

// --------------------------
// INITIALISE GAME
// --------------------------
function init() {
    // NEW: SHOW SPLASH SCREEN FOR 1.8 SECONDS
    setTimeout(hideSplash, 1800);

    // INIT ALL YOUR ORIGINAL GAME SYSTEMS
    window.brain.init();
    window.dialogueEngine.init();
    window.physicsEngine.init();
    window.choreographyEngine.init();
    window.atmosphereEngine.init();

    requestAnimationFrame(tick);
}

// --------------------------
// MAIN GAME LOOP
// --------------------------
function tick(now){
    requestAnimationFrame(tick);
    try{
        let dt = (now - lastTime)/1000;
        lastTime = now;
        if(dt>0.1) dt =0.1;
        time_elapsed += dt;

        // NEW: TANK SIDE DRIFT
        tankDriftTimer += dt * 0.08;
        const globalDriftX = Math.sin(tankDriftTimer) * 18;
        const scene = document.getElementById("scene");
        if(scene) scene.style.transform = `translateX(${globalDriftX}px)`;

        // NEW: IDLE COUNCIL AMBIENT CHAT
        idleChatTimer += dt;
        if(idleChatTimer > 22){
            idleChatTimer = 0;
            window.dialogueEngine.triggerAmbientDialogue();
        }

        // RUN ALL YOUR ORIGINAL GAME ENGINE UPDATES
        window.brain.update(dt, time_elapsed);
        window.physicsEngine.update(dt, time_elapsed);
        window.choreographyEngine.update(dt, time_elapsed);
        window.atmosphereEngine.update(dt, time_elapsed);
        window.dialogueEngine.update(dt, time_elapsed);

    } catch(err) {
        console.error("GAME LOOP ERROR: ", err);
    }
}

window.addEventListener("load", init);
