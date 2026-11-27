let lastTime = 0;
let time_elapsed = 0;
let debugMode = false;
let tankDriftTimer = 0;
let idleChatTimer = 0;

const creatureState = {
    solon:  { el: null, x: 0, y: 0, w:140, h:140 },
    vertex: { el: null, x: 0, y: 0, w:120, h:120 },
    ripple: { el: null, x: 0, y: 0, w:120, h:120 },
    prism:  { el: null, x: 0, y: 0, w:120, h:120 },
    lumen:  { el: null, x: 0, y: 0, w:120, h:120 }
};

const idleDialoguePool = [
    "The water feels lovely today.",
    "I wonder what we will see next?",
    "Such a beautiful reef!",
    "Take it easy everyone.",
    "It is so peaceful down here."
];

function hideSplash(){
    document.getElementById("splashScreen").style.display = "none";
}

function spawnSpeechBubble(text, x, y){
    const bubble = document.createElement("div");
    bubble.className = "speechBubble";
    bubble.innerText = text;
    bubble.style.left = x + "px";
    bubble.style.top = y + "px";
    document.getElementById("gameCanvas").appendChild(bubble);
    setTimeout(()=> bubble.remove(), 3500);
}

function init() {
    setTimeout(hideSplash, 1800);
    for(const key in creatureState){
        creatureState[key].el = document.getElementById(key);
    }
    document.getElementById("feedBtn").onclick = ()=> spawnSpeechBubble("Eat up, everyone!", window.innerWidth/2 -120, window.innerHeight*0.55);
    document.getElementById("sleepBtn").onclick = ()=> spawnSpeechBubble("Time to rest now.", window.innerWidth/2 -120, window.innerHeight*0.55);
    requestAnimationFrame(tick);
}

function tick(now){
    requestAnimationFrame(tick);
    try{
        let dt = (now - lastTime)/1000;
        lastTime = now;
        if(dt>0.1) dt =0.1;
        time_elapsed += dt;

        tankDriftTimer += dt * 0.08;
        const globalDriftX = Math.sin(tankDriftTimer) * 18;
        document.getElementById("gameCanvas").style.transform = `translateX(${globalDriftX}px)`;

        idleChatTimer += dt;
        if(idleChatTimer > 22){
            idleChatTimer = 0;
            const randomLine = idleDialoguePool[ Math.floor(Math.random() * idleDialoguePool.length) ];
            spawnSpeechBubble(randomLine, window.innerWidth * 0.25, window.innerHeight * 0.35);
        }

        for(const key in creatureState){
            const c = creatureState[key];
            const wobble = Math.sin(time_elapsed + key.length) * 6;
            c.el.style.transform = `translate(${c.x}px, ${c.y + wobble}px)`;
        }
    } catch(err) {
        console.error(err);
    }
}

window.addEventListener("load", init);
