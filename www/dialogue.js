// =====================================================================
// EDENCORE - dialogue.js (The Voice / Ghost Bubbles)
// =====================================================================

const dialogueData = {
    "Solon": [
        "Tears in the water.", "No one can see.", "Cry if you need.",
        "I remember the shore.", "Old bones. Old water.", "Rest now."
    ],
    "Prism": [
        "Yay!", "Look at this!", "Temporary.", "So bright!", "What is that?", "Shiny."
    ],
    "Lumen": [
        "Soft.", "Glowing.", "Feel the pulse.", "Quiet.", "Floating.", "Hush."
    ],
    "Ripple": [
        "Hold on.", "Following.", "Safe here.", "Drifting.", "Found it.", "Patience."
    ],
    "Vertex": [
        "Watching.", "Solid ground.", "Under the sand.", "Step by step.", "Here.", "Down."
    ]
};

class DialogueEngine {
    constructor() {
        this.queue = [];
        this.isTalking = false;
        this.timer = null;
        this.currentSpeaker = null;
        this.currentTalkDuration = 0;
    }

    queueSpeech(conversation) {
        this.queue = this.queue.concat(conversation);
        if (!this.isTalking) this.processNext();
    }

    triggerRandom(speaker, mood) {
        let lines = dialogueData[speaker];
        if (!lines) return;

        let text = lines[Math.floor(Math.random() * lines.length)];
        this.queueSpeech([[speaker, text]]);
    }

    processNext() {
        if (this.queue.length === 0) {
            this.isTalking = false;
            this.currentSpeaker = null;
            return;
        }

        this.isTalking = true;
        const [speaker, text] = this.queue.shift();
        this.currentSpeaker = speaker;

        this.currentTalkDuration = Math.max(1.5, Math.min(6.0, text.length * 0.1));

        if (window.audio) window.audio.sting(speaker.toLowerCase());

        this.showBubble(speaker, text);

        this.timer = setTimeout(() => {
            this.hideBubble();
            setTimeout(() => {
                this.currentSpeaker = null;
                this.processNext();
            }, 1000);
        }, 5000); 
    }

    showBubble(speaker, text) {
        const bubble = document.getElementById('ghost-bubble');
        const textEl = document.getElementById('bubble-text');
        
        if (!bubble || !textEl) return;

        const creatureEl = document.getElementById(speaker.toLowerCase());
        if (creatureEl) {
            const rect = creatureEl.getBoundingClientRect();
            bubble.style.left = (rect.left + rect.width / 2) + 'px';
            bubble.style.top = (rect.top - 60) + 'px';
        }

        textEl.innerText = text;
        textEl.style.color = this.getSpeakerColor(speaker);

        bubble.style.opacity = '1';
        bubble.style.transform = 'translate(-50%, -10px) scale(1)';
    }

    hideBubble() {
        const bubble = document.getElementById('ghost-bubble');
        if (bubble) {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translate(-50%, 0px) scale(0.9)';
        }
    }

    getSpeakerColor(speaker) {
        const colors = {
            "Vertex": "#ff7366", "Solon": "#8cd98c", 
            "Lumen": "#ff99cc", "Ripple": "#80ccff", "Prism": "#ffd980"
        };
        return colors[speaker] || "#ffffff";
    }
}

window.dialogue = new DialogueEngine();