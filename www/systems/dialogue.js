// =====================================================================
// EDENCORE - systems/dialogue.js (The Dialogue Player)
// =====================================================================

class DialogueEngine {
    constructor() {
        this.queue = [];
        this.isTalking = false;
        this.timer = null;
        this.conversationIndex = 0;
    }

    // Triggers a specific bank (e.g., 'council', 'jokes', 'ambient')
    triggerBank(bankName) {
        if (!window.getBank) return;
        
        const bank = window.getBank(bankName);
        if (!bank || bank.length === 0) {
            console.warn("Dialogue bank empty or missing:", bankName);
            return;
        }

        // Pick a random conversation from the bank
        const conversation = bank[Math.floor(Math.random() * bank.length)];
        this.queueSpeech(conversation);
    }

    // Triggers the old flat random speech (kept as a fallback)
    triggerRandom(speaker) {
        const fallbackData = {
            "Solon": ["Tears in the water.", "No one can see."],
            "Prism": ["Yay!", "Look at this!"],
            "Lumen": ["Soft.", "Glowing."],
            "Ripple": ["Hold on.", "Following."],
            "Vertex": ["Watching.", "Solid ground."]
        };
        let lines = fallbackData[speaker];
        if (!lines) return;
        let text = lines[Math.floor(Math.random() * lines.length)];
        this.queueSpeech([[speaker, text]]);
    }

    queueSpeech(conversation) {
        this.queue = this.queue.concat(conversation);
        if (!this.isTalking) this.processNext();
    }

    processNext() {
        if (this.queue.length === 0) { 
            this.isTalking = false; 
            return; 
        }

        this.isTalking = true;
        const [speaker, text] = this.queue.shift();

        // Play sting
        if (window.audio) window.audio.sting(speaker.toLowerCase());
        
        // Set talking state on the brain
        if (window.brain) window.brain.setTalking(speaker, text.length * 0.08);

        this.showBubble(speaker, text);

        // Duration based on text length (approx 60ms per character + buffer)
        const readTime = Math.max(3000, text.length * 60 + 1000); 

        this.timer = setTimeout(() => {
            this.hideBubble();
            // Wait a moment before the next speaker chimes in
            setTimeout(() => { this.processNext(); }, 1500);
        }, readTime); 
    }

    showBubble(speaker, text) {
        const bubble = document.getElementById('ghost-bubble');
        const textEl = document.getElementById('bubble-text');
        const creatureEl = document.getElementById(speaker.toLowerCase());

        if (!bubble || !textEl || !creatureEl) return;

        const rect = creatureEl.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top - 40;

        bubble.style.left = startX + 'px';
        bubble.style.top = startY + 'px';

        textEl.innerText = text;
        textEl.style.color = this.getSpeakerColor(speaker);

        bubble.style.opacity = '1';
        bubble.style.animation = 'none'; 
        void bubble.offsetWidth; 
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