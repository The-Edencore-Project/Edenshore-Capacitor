class SolonActor {
    constructor() {
        this.leftFrames = [];
        this.rightFrames = [];
        this.preload();
    }

    preload() {
        for (let i = 1; i <= 5; i++) {
            let l = new Image(); l.src = `assets/images/solon_left_fin_${i}.png`; this.leftFrames.push(l);
            let r = new Image(); r.src = `assets/images/solon_right_fin_${i}.png`; this.rightFrames.push(r);
        }
    }

    update(time_elapsed, mood, isTalking, isBlinking) {
        if (this.leftFrames.length === 0) return;

        let flapSpeed = 8.0;
        if (mood === "PLAYFUL") flapSpeed = 15.0;
        else if (mood === "SLEEPY") flapSpeed = 2.0;

        const frameIdx = Math.floor(time_elapsed * flapSpeed) % 5;
        
        const leftFinEl = document.getElementById('solon-left-fin');
        const rightFinEl = document.getElementById('solon-right-fin');
        const bodyEl = document.getElementById('solon-body');

        if (leftFinEl && leftFinEl.src.indexOf(`_${frameIdx + 1}.png`) === -1) {
            leftFinEl.src = `assets/images/solon_left_fin_${frameIdx + 1}.png`;
        }
        if (rightFinEl && rightFinEl.src.indexOf(`_${frameIdx + 1}.png`) === -1) {
            rightFinEl.src = `assets/images/solon_right_fin_${frameIdx + 1}.png`;
        }

        let stateStr = "";
        if (isTalking) {
            if (Math.floor(time_elapsed / 0.15) % 2 === 0) stateStr = "_talk";
        } else if (isBlinking) {
            stateStr = "_blink";
        }

        const newBodySrc = stateStr ? `assets/images/solon_body${stateStr}.png` : `assets/images/solon_body.png`;
        if (bodyEl && bodyEl.src.indexOf(newBodySrc) === -1) bodyEl.src = newBodySrc;
    }
}

window.solonActor = new SolonActor();