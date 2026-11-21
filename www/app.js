import { loadSave, saveData } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";
import { audio } from "./audio.js";
import { CREATURES } from "./creatures.js";

let save = loadSave();

let solonFrame = 1;
let solonFrameTimer = 0;

function updateBond(){

    const el =
        document.getElementById(
            "bond-text"
        );

    if(!el) return;

    el.textContent =
        `BOND: ${save.bond} - ${save.title}`;
}

function activateTalk(name){

    if(!CREATURES[name]) return;

    CREATURES[name].talking = true;

    CREATURES[name].talkTimer = 2.5;
}

function showDialogue(text){

    const box =
        document.getElementById(
            "dialogue-box"
        );

    if(box){
        box.textContent = text;
    }
}

function tapCreature(name){

    save.lastCreature = name;

    save =
        addBond(save,1);

    saveData(save);

    updateBond();

    activateTalk(name);

    showDialogue(
        getDialogue(name)
    );

    audio.sting(name);
}

function bindCreature(id){

    const el =
        document.getElementById(id);

    if(!el) return;

    el.addEventListener(
        "click",
        ()=>tapCreature(id)
    );
}

function updateState(name,dt){

    const c = CREATURES[name];

    c.blinkTimer -= dt;

    if(
        !c.talking &&
        c.blinkTimer <= 0 &&
        !c.blinking
    ){
        c.blinking = true;

        c.blinkTimer =
            c.blinkDuration;
    }

    if(
        c.blinking &&
        c.blinkTimer <= 0
    ){
        c.blinking = false;

        c.blinkTimer =
            c.blinkCooldown;
    }

    if(c.talking){

        c.talkTimer -= dt;

        if(c.talkTimer <= 0){

            c.talking = false;
        }
    }
}

function updateSprite(name){

    const c = CREATURES[name];

    const sprite =
        document.getElementById(
            name
        );

    if(!sprite) return;

    if(c.talking){

        sprite.src =
        `assets/images/${c.talk}.png`;

        return;
    }

    if(c.blinking){

        sprite.src =
        `assets/images/${c.blink}.png`;

        return;
    }

    sprite.src =
    `assets/images/${c.base}.png`;
}

function updateSolonFins(dt){

    solonFrameTimer += dt;

    if(solonFrameTimer < 0.12){
        return;
    }

    solonFrameTimer = 0;

    solonFrame++;

    if(solonFrame > 5){
        solonFrame = 1;
    }

    const left =
        document.getElementById(
            "solonLeftFin"
        );

    const right =
        document.getElementById(
            "solonRightFin"
        );

    if(left){

        left.src =
        `assets/images/solon_left_fin_${solonFrame}.png`;
    }

    if(right){

        right.src =
        `assets/images/solon_right_fin_${solonFrame}.png`;
    }
}

let lastTime = 0;

function animate(time){

    const now =
        time * 0.001;

    const dt =
        now - lastTime;

    lastTime = now;

    Object.entries(CREATURES)
    .forEach(([id,c])=>{

        updateState(
            id,
            dt
        );

        updateSprite(id);

        const el =
            document.getElementById(
                id
            );

        if(!el) return;

        const driftX =
            Math.sin(
                now*c.speed+
                c.phase
            )*
            c.drift;

        const driftY =
            Math.cos(
                now*c.speed*
                1.4+
                c.phase
            )*
            c.buoyancy;

        el.style.transform =
            `translate(${driftX}px,${driftY}px)`;
    });

    updateSolonFins(dt);

    requestAnimationFrame(
        animate
    );
}

window.addEventListener(
    "DOMContentLoaded",
    ()=>{

        save.visits++;

        saveData(save);

        updateBond();

        bindCreature("solon");
        bindCreature("prism");
        bindCreature("ripple");
        bindCreature("lumen");
        bindCreature("vertex");

        requestAnimationFrame(
            animate
        );
    }
);
