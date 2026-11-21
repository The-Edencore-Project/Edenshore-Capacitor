import { loadSave, saveData } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";
import { audio } from "./audio.js";

let save = loadSave();

const creatures = {

    solon:{
        x:0.30,
        y:0.55,
        drift:40,
        buoyancy:10,
        speed:0.6,
        phase:0
    },

    prism:{
        x:0.70,
        y:0.55,
        drift:55,
        buoyancy:12,
        speed:1.1,
        phase:2
    },

    lumen:{
        x:0.20,
        y:0.35,
        drift:22,
        buoyancy:12,
        speed:0.5,
        phase:1
    },

    ripple:{
        x:0.75,
        y:0.35,
        drift:14,
        buoyancy:18,
        speed:0.8,
        phase:3
    },

    vertex:{
        x:0.50,
        y:0.15,
        drift:8,
        buoyancy:4,
        speed:0.4,
        phase:4
    }
};

function updateBond() {

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

function tapCreature(id) {

    save.lastCreature = id;

    save =
        addBond(save,1);

    saveData(save);

    audio.sting(id);

    updateBond();

    showDialogue(
        getDialogue(id)
    );
}

function hookCreature(id){

    const el =
        document.getElementById(id);

    if(!el) return;

    el.addEventListener(
        "click",
        () => tapCreature(id)
    );
}

function setBiome(name){

    const bg =
        document.getElementById(
            "bg-gradient"
        );

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

function loop(time){

    const t =
        time / 1000;

    Object.entries(creatures)
    .forEach(
        ([id,c]) => {

            const el =
                document.getElementById(id);

            if(!el) return;

            const x =
                Math.sin(
                    (t*c.speed)+c.phase
                ) * c.drift;

            const y =
                Math.cos(
                    (t*c.speed*1.4)+c.phase
                ) * c.buoyancy;

            el.style.transform =
                `translate(${x}px,${y}px)`;
        }
    );

    const mtn =
        document.getElementById(
            "mountains"
        );

    const pill =
        document.getElementById(
            "pillars"
        );

    const dune =
        document.getElementById(
            "dunes"
        );

    const grass =
        document.getElementById(
            "grass"
        );

    if(mtn){
        mtn.style.transform =
            `translateX(${
                -(t*6)%900
            }px)`;
    }

    if(pill){
        pill.style.transform =
            `translateX(${
                -(t*8)%1200
            }px)`;
    }

    if(dune){
        dune.style.transform =
            `translateX(${
                -(t*18)%1200
            }px)`;
    }

    if(grass){
        grass.style.transform =
            `translateX(${
                -(t*30)%1600
            }px)`;
    }

    requestAnimationFrame(loop);
}

window.addEventListener(
    "DOMContentLoaded",
    () => {

        save.visits++;

        saveData(save);

        updateBond();

        hookCreature("solon");
        hookCreature("prism");
        hookCreature("ripple");
        hookCreature("lumen");
        hookCreature("vertex");

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

                    lagoonBtn.classList.add(
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

                    shoreBtn.classList.add(
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

                    twilightBtn.classList.add(
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

                    deepBtn.classList.add(
                        "active"
                    );
                }
            );

        requestAnimationFrame(
            loop
        );
    }
);
