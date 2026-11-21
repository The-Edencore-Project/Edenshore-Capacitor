import { loadSave, saveData } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";

let save = loadSave();

const biomeMap = {
    lagoonBtn: "biome-lagoon",
    shoreBtn: "biome-shore",
    twilightBtn: "biome-twilight",
    deepBtn: "biome-deep"
};

const creatures = {

    solon:{
        x:28,
        y:42,
        phase:0,
        speed:.55,
        drift:40,
        rise:10
    },

    prism:{
        x:66,
        y:38,
        phase:1.5,
        speed:1.15,
        drift:55,
        rise:12
    },

    ripple:{
        x:74,
        y:56,
        phase:3.2,
        speed:.9,
        drift:18,
        rise:16
    },

    lumen:{
        x:20,
        y:69,
        phase:2.1,
        speed:.45,
        drift:30,
        rise:14
    },

    vertex:{
        x:40,
        y:84,
        phase:.8,
        speed:.35,
        drift:8,
        rise:6
    }
};

function updateBondDisplay() {

    const el =
        document.getElementById(
            "bond-text"
        );

    if (!el) return;

    el.textContent =
        `BOND: ${save.bond} - ${save.title}`;
}

function showDialogue(text) {

    const box =
        document.getElementById(
            "dialogue-box"
        );

    if (!box) return;

    box.textContent = text;
}

function creatureTapped(creature) {

    save.lastCreature = creature;

    save = addBond(save,1);

    updateBondDisplay();

    showDialogue(
        getDialogue(creature)
    );

    saveData(save);
}

function bindCreature(name) {

    const el =
        document.getElementById(name);

    if (!el) return;

    el.addEventListener(
        "click",
        () => creatureTapped(name)
    );
}

function animate(time) {

    const t = time * .001;

    Object.entries(creatures)
    .forEach(([id,data]) => {

        const el =
            document.getElementById(id);

        if (!el) return;

        const driftX =
            Math.sin(
                t * data.speed +
                data.phase
            ) * data.drift;

        const driftY =
            Math.cos(
                t * data.speed * 1.5 +
                data.phase
            ) * data.rise;

        el.style.transform =
            `translate(${driftX}px,${driftY}px)`;
    });

    const mountains =
        document.getElementById(
            "mountains"
        );

    const pillars =
        document.getElementById(
            "pillars"
        );

    const dunes =
        document.getElementById(
            "dunes"
        );

    const grass =
        document.getElementById(
            "grass"
        );

    if(mountains)
        mountains.style.transform =
        `translateX(${
            -(t*5)%800
        }px)`;

    if(pillars)
        pillars.style.transform =
        `translateX(${
            -(t*8)%1000
        }px)`;

    if(dunes)
        dunes.style.transform =
        `translateX(${
            -(t*18)%1200
        }px)`;

    if(grass)
        grass.style.transform =
        `translateX(${
            -(t*35)%1600
        }px)`;

    requestAnimationFrame(
        animate
    );
}

function setBiome(cls,id){

    const bg =
        document.getElementById(
            "bg-gradient"
        );

    bg.className = cls;

    document
    .querySelectorAll(
        ".biome-btn"
    )
    .forEach(btn =>
        btn.classList
        .remove("active")
    );

    document
    .getElementById(id)
    ?.classList
    .add("active");
}

window.addEventListener(
"DOMContentLoaded",
() => {

    save.visits++;

    saveData(save);

    updateBondDisplay();

    bindCreature("solon");
    bindCreature("prism");
    bindCreature("ripple");
    bindCreature("lumen");
    bindCreature("vertex");

    Object.entries(
        biomeMap
    ).forEach(
        ([id,cls]) => {

            document
            .getElementById(id)
            ?.addEventListener(
                "click",
                () => setBiome(
                    cls,
                    id
                )
            );
        }
    );

    requestAnimationFrame(
        animate
    );
});
