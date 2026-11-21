import { getDialogue } from "./dialogue.js";

const AMBIENT_CREATURES = [
    "solon",
    "prism",
    "ripple",
    "lumen",
    "vertex"
];

class AmbientCouncil {

    constructor() {

        this.timer =
            this.randomTime();

        this.enabled = true;
    }

    randomTime() {

        return (
            12 +
            Math.random() * 18
        );
    }

    update(dt) {

        if (!this.enabled) return;

        this.timer -= dt;

        if (this.timer > 0) return;

        this.timer =
            this.randomTime();

        const speaker =
            AMBIENT_CREATURES[
                Math.floor(
                    Math.random() *
                    AMBIENT_CREATURES.length
                )
            ];

        window.dispatchEvent(
            new CustomEvent(
                "ambientDialogue",
                {
                    detail:{
                        speaker
                    }
                }
            )
        );
    }
}

export const council =
    new AmbientCouncil();
