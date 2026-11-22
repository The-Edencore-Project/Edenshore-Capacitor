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
    bubble.innerText = text; 
    
    // 1. Append to DOM first so the browser calculates the width
    document.body.appendChild(bubble);

    // 2. Get the calculated width
    const bubbleWidth = bubble.offsetWidth;
    
    // 3. Position it exactly. Left = Center - (Width / 2)
    bubble.style.left = `${cx - (bubbleWidth / 2)}px`; 
    bubble.style.top = `${spawnY}px`; 
    
    let startTime = performance.now();
    
    // 4. Store the exact left position for the float animation
    activeBubbles.push({ el: bubble, startTime: startTime, life: 6000, startX: cx - (bubbleWidth / 2), startY: spawnY });
    c.talkTimer = 2.0;
}

function updateBubbles(now) {
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        let b = activeBubbles[i];
        let progress = (now - b.startTime) / b.life;
        if (progress >= 1.0) { b.el.remove(); activeBubbles.splice(i, 1); continue; }
        
        let alpha = 1.0;
        if (progress < 0.1) alpha = progress / 0.1;
        if (progress > 0.7) alpha = (1.0 - progress) / 0.3;
        
        // 5. Float up using standard translateY. No centering transform needed anymore!
        b.el.style.transform = `translateY(-${progress * 50}px)`;
        b.el.style.opacity = alpha;
    }
}