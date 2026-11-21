import { loadSave } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";

let save = loadSave();

function updateBondDisplay() {

    const bondLabel =
        document.getElementById("bondLabel");

    if (!bondLabel) return;

    bondLabel.textContent =
        `BOND: ${save.bond} - ${save.title}`;
}

function showDialogue(text) {

    const dialogueBox =
        document.getElementById("dialogueBox");

    if (!dialogueBox) return;

    dialogueBox.textContent = text;
}

function creatureTapped(creature) {

    save.lastCreature = creature;

    save = addBond(save, 1);

    updateBondDisplay();

    const text =
        getDialogue(creature);

    showDialogue(text);

    console.log(
        `${creature} tapped. Bond = ${save.bond}`
    );
}

window.addEventListener(
    "DOMContentLoaded",
    () => {

        save.visits += 1;

        updateBondDisplay();

        const turtle =
            document.getElementById("solon");

        const crab =
            document.getElementById("vertex");

        const seahorse =
            document.getElementById("ripple");

        const fish =
            document.getElementById("prism");

        const jellyfish =
            document.getElementById("lumen");

        turtle?.addEventListener(
            "click",
            () => creatureTapped("solon")
        );

        crab?.addEventListener(
            "click",
            () => creatureTapped("vertex")
        );

        seahorse?.addEventListener(
            "click",
            () => creatureTapped("ripple")
        );

        fish?.addEventListener(
            "click",
            () => creatureTapped("prism")
        );

        jellyfish?.addEventListener(
            "click",
            () => creatureTapped("lumen")
        );
    }
);
