// =====================================================================
// EDENCORE - systems/dialogue.js (The Dialogue Player)
// =====================================================================

class DialogueEngine {
    constructor() {
        this.queue = [];
        this.isTalking = false;
        this.timer = null;
    }

    triggerBank(bankName) {
        if (!window.drawFromBank) return;
        const conversation = window.drawFromBank(bankName);
        if (!conversation) return;
        this.queueSpeech(conversation);
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

        if (window.audio) window.audio.sting(speaker.toLowerCase());
        if (window.brain) window.brain.setTalking(speaker, text.length * 0.08);

        this.showBubble(speaker, text);

        const readTime = Math.max(3000, text.length * 60 + 1000); 
        this.timer = setTimeout(() => {
            this.hideBubble();
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
        bubble.style.animation = 'riseAndFade 5s ease-out forwards';
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