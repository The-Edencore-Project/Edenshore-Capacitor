function spawnBubble(speaker, text) {
    let c = CREATURES.find(x => x.name === speaker) || CREATURES.find(x => x.name === "Vertex");
    if (!c) return;

    let el = c.id === "solon" ? document.getElementById("solon-group") : document.getElementById(c.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + (rect.width / 2);
    
    let spawnY = rect.top - 40; 
    if (spawnY < 100) spawnY = rect.bottom + 20; 

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    
    // THE FIX: Set the text BEFORE appending to the DOM
    bubble.innerText = text; 
    
    // THE FIX: Only set X and Y, let CSS handle the width
    bubble.style.left = `${cx}px`; 
    bubble.style.top = `${spawnY}px`; 
    // We still need this to center the bubble over the creature
    bubble.style.transform = `translateX(-50%)`; 
    
    document.body.appendChild(bubble);

    let startTime = performance.now();
    activeBubbles.push({ el: bubble, startTime: startTime, life: 6000, startX: cx, startY: spawnY });
    c.talkTimer = 2.0;
}

// Update the animation loop to maintain the centering transform
function updateBubbles(now) {
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        let b = activeBubbles[i];
        let progress = (now - b.startTime) / b.life;
        if (progress >= 1.0) { b.el.remove(); activeBubbles.splice(i, 1); continue; }
        
        let alpha = 1.0;
        if (progress < 0.1) alpha = progress / 0.1;
        if (progress > 0.7) alpha = (1.0 - progress) / 0.3;
        
        // Float up and keep it centered with -50%
        b.el.style.transform = `translate(-50%, -${progress * 50}px)`;
        b.el.style.opacity = alpha;
    }
}