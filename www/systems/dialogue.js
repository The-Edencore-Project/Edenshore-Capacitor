// =====================================================================
// EDENCORE - systems/dialogue.js (The Dialogue Player V2)
// =====================================================================

class DialogueEngine {
    constructor() {
        this.queue = [];
        this.activeConversation = null;
        this.lineIndex = 0;
        this.lineTimer = 0;
        this.isPlaying = false;
        this.activeBubble = null;
    }

    triggerBank(bankName) {
        if (window.drawFromBank) {
            const conversation = window.drawFromBank(bankName);
            if (conversation) this.queueSpeech(conversation);
        }
    }

    queueSpeech(conversation) {
        if (!conversation || conversation.length === 0) return;
        if (this.isPlaying) {
            this.queue.push(conversation);
            return;
        }
        this.activeConversation = conversation;
        this.lineIndex = 0;
        this.isPlaying = true;
        this.processNext();
    }

    processNext() {
        if (!this.activeConversation || this.lineIndex >= this.activeConversation.length) {
            this.finishConversation();
            return;
        }

        const line = this.activeConversation[this.lineIndex];
        const speaker = line[0];
        const text = line[1];

        this.showBubble(speaker, text);

        const creatureKey = speaker.toLowerCase();
        const creatureState = window.creatureState ? window.creatureState[creatureKey] : null;
        
        if (creatureState) {
            // Talk for however long it takes to read the line (min 2s)
            const talkDuration = Math.max(2, text.split(' ').length * 0.3);
            creatureState.talkTimer = talkDuration;
            this.lineTimer = talkDuration + 1.0; // Add a 1s pause between lines
        } else {
            this.lineTimer = 3; 
        }

        this.lineIndex++;
    }

    update(dt) {
        if (!this.isPlaying) {
            if (this.queue.length > 0) {
                this.activeConversation = this.queue.shift();
                this.lineIndex = 0;
                this.isPlaying = true;
                this.processNext();
            }
            return;
        }

        this.lineTimer -= dt;
        if (this.lineTimer <= 0) {
            this.processNext();
        }
    }

    showBubble(speaker, text) {
        // 1. Remove any existing bubble
        this.hideBubble();

        const creatureKey = speaker.toLowerCase();
        const creatureEl = document.getElementById(creatureKey);
        
        if (!creatureEl) return;

        // 2. Create the bubble
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.textContent = text;
        
        // 3. Position it above the creature
        const rect = creatureEl.getBoundingClientRect();
        // We use left/top for absolute positioning, and the CSS animation handles the rest
        bubble.style.left = `${rect.left + (rect.width / 2)}px`;
        bubble.style.top = `${rect.top - 10}px`; 

        document.getElementById('scene').appendChild(bubble);
        
        // 4. Trigger the CSS animation
        // We use a tiny timeout to ensure the DOM has rendered before adding the class
        setTimeout(() => {
            bubble.classList.add('rising');
        }, 10);

        this.activeBubble = bubble;
    }

    hideBubble() {
        if (this.activeBubble) {
            const bubbleToRemove = this.activeBubble;
            // Wait for the CSS animation to finish (4 seconds) before removing from DOM
            setTimeout(() => {
                if (bubbleToRemove.parentNode) {
                    bubbleToRemove.parentNode.removeChild(bubbleToRemove);
                }
            }, 4000); 
            this.activeBubble = null;
        }
    }

    finishConversation() {
        this.isPlaying = false;
        this.activeConversation = null;
        // The readCooldown in app.js handles the pacing now, so we don't need to do anything here.
    }
}

window.dialogueEngine = new DialogueEngine();