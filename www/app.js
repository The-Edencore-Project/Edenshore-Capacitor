import { loadSave, saveData } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";

let save = loadSave();

const creatures = {

    solon: {
        ax: 18,
        ay: 8,
        speed: 0.7
    },

    prism: {
        ax: 22,
        ay: 10,
        speed: 1.0
    },

    ripple: {
        ax: 12,
        ay: 14,
        speed: 1.3
    },

    lumen: {
        ax: 18,
        ay: 12,
        speed: 0.5
    },

    vertex: {
        ax: 6,
        ay: 3,
        speed: 0.4
    }
};

function updateBondDisplay() {

    const bond =
        document.getElementById(
            "bond-text"
        );

    if (!bond) return;

    bond.textContent =
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

function creatureTapped(name) {

    save.lastCreature = name;

    save = addBond(
        save,
        1
    );

    updateBondDisplay();

    showDialogue(
        getDialogue(name)
    );

    saveData(save);
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

function animate(time) {

    const t = time * 0.001;

    Object.entries(
        creatures
    ).forEach(
        ([id,data]) => {

            const el =
                document.getElementById(id);

            if (!el) return;

            const x =
                Math.sin(
                    t * data.speed
                ) * data.ax;

            const y =
                Math.cos(
                    t * data.speed * 1.2
                ) * data.ay;

            el.style.transform =
                `translate(${x}px,${y}px)`;
        }
    );

    requestAnimationFrame(
        animate
    );
}

function setBiome(name) {

    const bg =
        document.getElementById(
            "bg-gradient"
        );

    if (!bg) return;

    bg.className = name;

    document
        .querySelectorAll(
            ".biome-btn"
        )
        .forEach(
            b => b.classList.remove(
                "active"
            )
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

        document
            .getElementById(
                "lagoonBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    setBiome(
                        "biome-lagoon"
                    );

                    document
                        .getElementById(
                            "lagoonBtn"
                        )
                        ?.classList.add(
                            "active"
                        );
                }
            );

        document
            .getElementById(
                "shoreBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    setBiome(
                        "biome-shore"
                    );

                    document
                        .getElementById(
                            "shoreBtn"
                        )
                        ?.classList.add(
                            "active"
                        );
                }
            );

        document
            .getElementById(
                "twilightBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    setBiome(
                        "biome-twilight"
                    );

                    document
                        .getElementById(
                            "twilightBtn"
                        )
                        ?.classList.add(
                            "active"
                        );
                }
            );

        document
            .getElementById(
                "deepBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    setBiome(
                        "biome-deep"
                    );

                    document
                        .getElementById(
                            "deepBtn"
                        )
                        ?.classList.add(
                            "active"
                        );
                }
            );

        requestAnimationFrame(
            animate
        );
    }
);
