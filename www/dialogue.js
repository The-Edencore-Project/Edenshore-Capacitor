const dialogueData = {
    "Solon": ["Tears in the water.", "No one can see.", "Cry if you need.", "Old bones. Old water.", "Rest now."],
    "Prism": ["Yay!", "Look at this!", "Temporary.", "So bright!", "What is that?", "Shiny."],
    "Lumen": ["Soft.", "Glowing.", "Feel the pulse.", "Quiet.", "Floating.", "Hush."],
    "Ripple": ["Hold on.", "Following.", "Safe here.", "Drifting.", "Found it.", "Patience."],
    "Vertex": ["Watching.", "Solid ground.", "Under the sand.", "Step by step.", "Here.", "Down."]
};

class DialogueEngine {
    constructor() {
        this.queue = [];
        this.isTalking = false;
        this.timer = null;
    }

    triggerRandom(speaker) {
        let lines = dialogueData[speaker];
        if (!lines) return;
        let text = lines[Math.floor(Math.random() * lines.length)];
        this.queueSpeech([[speaker, text]]);
    }

    queueSpeech(conversation) {
        this.queue = this.queue.concat(conversation);
        if (!this.isTalking) this.processNext();
    }

    processNext() {
        if (this.queue.length === 0) { this.isTalking = false; return; }
        
        this.isTalking = true;
        const [speaker, text] = this.queue.shift();

        if (window.audio) window.audio.sting(speaker.toLowerCase());
        if (window.brain) window.brain.setTalking(speaker, text.length * 0.1); // Triggers mouth movement

        this.showBubble(speaker, text);

        this.timer = setTimeout(() => {
            this.hideBubble();
            setTimeout(() => { this.processNext(); }, 1000);
        }, 5000); 
    }

    showBubble(speaker, text) {
        const bubble = document.getElementById('ghost-bubble');
        const textEl = document.getElementById('bubble-text');
        const creatureEl = document.getElementById(speaker.toLowerCase());
        
        if (!bubble || !textEl || !creatureEl) return;

        // Position bubble above creature
        const rect = creatureEl.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top - 40;

        bubble.style.left = startX + 'px';
        bubble.style.top = startY + 'px';
        
        textEl.innerText = text;
        textEl.style.color = this.getSpeakerColor(speaker);

        // Fade in
        bubble.style.opacity = '1';
        
        // FLOATING ANIMATION (V4.4 Float Up)
        bubble.style.animation = 'none'; // Reset
        void bubble.offsetWidth; // Trigger reflow
        bubble.style.animation = 'floatUp 5s ease-out forwards';
    }

    hideBubble() {
        const bubble = document.getElementById('ghost-bubble');
        if (bubble) {
            bubble.style.opacity = '0';
            bubble.style.animation = 'none';
        }
    }

    getSpeakerColor(speaker) {
        const colors = { "Vertex": "#ff7366", "Solon": "#8cd98c", "Lumen": "#ff99cc", "Ripple": "#80ccff", "Prism": "#ffd980" };
        return colors[speaker] || "#ffffff";
    }
}

window.dialogue = new DialogueEngine();