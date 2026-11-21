import { loadSave, saveData } from "./save.js";
import { addBond } from "./bond.js";
import { getDialogue } from "./dialogue.js";
import { audio } from "./audio.js";
import { CREATURES } from "./creatures.js";

let save = loadSave();

let finFrame = 1;
let finTimer = 0;
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

function activateTalk(id){

if(!CREATURES[id]) return;

CREATURES[id].talkTimer =
Math.max(
1.5,
Math.min(
4,
getDialogue(id).length*.08
)
);
}

function tapCreature(id){

save.lastCreature = id;

save =
addBond(
save,
1
);

saveData(save);

const dialogue =
getDialogue(id);

showDialogue(
dialogue
);

CREATURES[id].talkTimer =
Math.max(
1.5,
Math.min(
4,
dialogue.length*.08
)
);

audio.sting(id);

updateBondDisplay();
}

function bindCreature(id){

const el =
document.getElementById(id);

if(!el) return;

el.addEventListener(
"click",
()=>tapCreature(id)
);
}

function updateBlinkState(c,dt){

if(c.talkTimer>0){

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

if(c.talkTimer > 0){

img.src = c.talk;

return;
}

if(c.blinking){

img.src = c.blink;

return;
}

img.src = c.base;
}

function updateSolonFins(dt){

finTimer += dt;

if(finTimer < .12){
return;
}

finTimer = 0;

finFrame++;

if(finFrame > 5){
finFrame = 1;
}

const left =
document.getElementById(
"solonLeftFin"
);

const right =
document.getElementById(
"solonRightFin"
);

if(left){
left.src =
`assets/images/solon_left_fin_${finFrame}.png`;
}

if(right){
right.src =
`assets/images/solon_right_fin_${finFrame}.png`;
}
}

function updateParallax(t){

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

if(mountains){
mountains.style.transform =
`translateX(${-(t*5)%1200}px)`;
}

if(pillars){
pillars.style.transform =
`translateX(${-(t*8)%1400}px)`;
}

if(dunes){
dunes.style.transform =
`translateX(${-(t*18)%1800}px)`;
}

if(grass){
grass.style.transform =
`translateX(${-(t*32)%2200}px)`;
}
}

function animate(time){

const now =
time*.001;

const dt =
now-lastTime;

lastTime = now;

Object.values(CREATURES)
.forEach(c=>{

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
(now*c.speed)+
c.phase
)*
c.drift;

const driftY =
Math.cos(
(now*c.speed*1.5)+
c.phase
)*
c.buoyancy;

sprite.style.transform =
`translate(${driftX}px,${driftY}px)`;
});

updateSolonFins(dt);

updateParallax(now);

requestAnimationFrame(
animate
);
}

function initBiomes(){

const bg =
document.getElementById(
"bg-gradient"
);

const map = {
lagoonBtn:"biome-lagoon",
shoreBtn:"biome-shore",
twilightBtn:"biome-twilight",
deepBtn:"biome-deep"
};

Object.entries(map)
.forEach(
([id,cls])=>{

document
.getElementById(id)
?.addEventListener(
"click",
()=>{

bg.className = cls;

document
.querySelectorAll(
".biome-btn"
)
.forEach(
btn =>
btn.classList.remove(
"active"
)
);

document
.getElementById(id)
.classList.add(
"active"
);

}
);

}
);
}

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

initBiomes();

requestAnimationFrame(
animate
);
}
);
