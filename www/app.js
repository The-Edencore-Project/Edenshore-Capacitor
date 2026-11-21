import { loadSave, saveData } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";

let save = loadSave();

const creatures = {
    solon: {
        x: 26,
        y: 33,
        ampX: 15,
        ampY: 8,
        speed: 0.7
    },

    prism: {
        x: 64,
        y: 29,
        ampX: 20,
        ampY: 10,
        speed: 1.0
    },

    ripple: {
        x: 69,
        y: 52,
        ampX: 12,
        ampY: 14,
        speed: 0.9
    },

    lumen: {
        x: 18,
        y: 62,
        ampX: 18,
        ampY: 12,
        speed: 0.6
    },

    vertex: {
        x: 40,
        y: 80,
        ampX: 8,
        ampY: 5,
        speed: 0.5
    }
};

function updateBondDisplay() {

    const bondText =
        document.getElementById("bond-text");

    if (!bondText) return;

    bondText.textContent =
        `BOND: ${save.bond} - ${save.title}`;
}

function showDialogue(text) {

    const box =
        document.getElementById("dialogue-box");

    if (!box) return;

    box.textContent = text;
}

function creatureTapped(name) {

    save.lastCreature = name;

    save = addBond(save, 1);

    updateBondDisplay();

    showDialogue(
        getDialogue(name)
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

    const t = time * 0.001;

    Object.entries(creatures).forEach(
        ([id, data]) => {

            const el =
                document.getElementById(id);

            if (!el) return;

            const driftX =
                Math.sin(
                    t * data.speed
                ) * data.ampX;

            const driftY =
                Math.cos(
                    t * data.speed * 1.3
                ) * data.ampY;

            el.style.transform =
                `translate(${driftX}px, ${driftY}px)`;
        }
    );

    requestAnimationFrame(
        animate
    );
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

        requestAnimationFrame(
            animate
        );
    }
);
