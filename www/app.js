import { loadSave, saveData } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";
import { audio } from "./audio.js";
import { CREATURES } from "./creatures.js";
import { council } from "./ambient.js";
import { sleep } from "./sleep.js";
import { getMilestone } from "./milestones.js";

let save = loadSave();

let lastTime = 0;

function updateBondDisplay(){

    const el =
        document.getElementById(
            "bond-text"
        );

    if(!el) return;

    el.textContent =
        `BOND: ${save.bond} - ${save.title}`;
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

function activateTalk(id,duration=2.5){

    if(
        CREATURES[id]
    ){
        CREATURES[id]
        .talkTimer =
        duration;
    }
}

function creatureDialogue(id){

    const text =
        getDialogue(id);

    activateTalk(
        id,
        Math.max(
            1.5,
            text.length * .08
        )
    );

    showDialogue(text);
}

function bondMilestone(){

    const text =
        `Bond milestone reached: ${save.bond}`;

    showDialogue(text);
}

function tapCreature(id){

    sleep.registerActivity();

    save.lastCreature = id;

    save =
        addBond(save,1);

    saveData(save);

    updateBondDisplay();

    creatureDialogue(id);

    audio.sting(id);

    if(
        getMilestone(
            save.bond
        )
    ){
        bondMilestone();
    }
}

function bindCreature(id){

    const el =
        document.getElementById(id);

    if(!el) return;

    el.addEventListener(
        "click",
        ()=>{
            tapCreature(id);
        }
    );
}

function updateBlinkState(c,dt){

    if(
        c.talkTimer > 0
    ){
        c.talkTimer -= dt;
        return;
    }

    c.blinkTimer -= dt;

    if(
        !c.blinking &&
        c.blinkTimer <= 0
    ){
        c.blinking = true;
        c.blinkTimer =
            c.blinkLength;
    }
    else if(
        c.blinking &&
        c.blinkTimer <= 0
    ){
        c.blinking = false;
        c.blinkTimer =
            c.blinkCooldown;
    }
}

function updateSprite(c){

    const img =
        document.getElementById(
            c.id
        );

    if(!img) return;

    if(
        sleep.state ===
        "SLEEPING"
    ){
        img.src = c.blink;
        return;
    }

    if(
        c.talkTimer > 0
    ){
        img.src = c.talk;
        return;
    }

    if(
        c.blinking
    ){
        img.src = c.blink;
        return;
    }

    img.src = c.base;
}

function animate(time){

    const now =
        time * .001;

    const dt =
        now - lastTime;

    lastTime = now;

    council.update(dt);

    sleep.update(dt);

    Object.values(
        CREATURES
    ).forEach(c=>{

        updateBlinkState(
            c,
            dt
        );

        updateSprite(c);

        const sprite =
            document.getElementById(
                c.id
            );

        if(!sprite) return;

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

        sprite.style.transform =
            `translate(${driftX}px,${driftY}px)`;
    });

    requestAnimationFrame(
        animate
    );
}

window.addEventListener(
    "ambientDialogue",
    e=>{

        const speaker =
            e.detail.speaker;

        creatureDialogue(
            speaker
        );
    }
);

window.addEventListener(
    "DOMContentLoaded",
    ()=>{

        save.visits++;

        saveData(save);

        updateBondDisplay();

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
