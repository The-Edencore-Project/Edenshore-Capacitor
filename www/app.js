import { loadSave } from "./save.js";
import { saveData } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";

let save = loadSave();

function updateBondDisplay() {

    const bond =
        document.getElementById("bond-text");

    if (!bond) return;

    bond.textContent =
        `BOND: ${save.bond} - ${save.title}`;
}

function showDialogue(text) {

    const box =
        document.getElementById("dialogue-box");

    if (!box) return;

    box.textContent = text;
}

function creatureTapped(creature) {

    save.lastCreature = creature;

    save = addBond(save, 1);

    updateBondDisplay();

    showDialogue(
        getDialogue(creature)
    );
}

function bindCreature(id) {

    const el =
        document.getElementById(id);

    if (!el) return;

    el.addEventListener(
        "click",
        () => creatureTapped(id)
    );
}

window.addEventListener(
    "DOMContentLoaded",
    () => {

        save.visits++;

        saveData(save);

        updateBondDisplay();

        bindCreature("solon");
        bindCreature("vertex");
        bindCreature("ripple");
        bindCreature("prism");
        bindCreature("lumen");
    }
);
