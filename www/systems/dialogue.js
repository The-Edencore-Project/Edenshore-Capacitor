// =====================================================================
// EDENCORE - systems/dialogue.js (The Dialogue Player)
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
        // In the new architecture, app.js usually calls drawFromBank directly.
        // This is a fallback for event-driven triggers.
        if (window.drawFromBank) {
            const conversation = window.drawFromBank(bankName);
            if (conversation) this.queueSpeech(conversation);
        }
    }

    queueSpeech(conversation) {
        if (!conversation || conversation.length === 0) return;

        // If we are already playing, we can either queue or interrupt.
        // For now, let's queue it so we don't break mid-sentence.
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

        // Set talk timer on the creature
        const creatureKey = speaker.toLowerCase();
        const creatureState = window.creatureState ? window.creatureState[creatureKey] : null;
        
        if (creatureState) {
            // Talk for however long it takes to read the line (min 2s)
            const talkDuration = Math.max(2, text.split(' ').length * 0.3);
            creatureState.talkTimer = talkDuration;
            this.lineTimer = talkDuration + 1.5; // Add a 1.5s pause between lines
        } else {
            this.lineTimer = 3; // Fallback
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
            this.hideBubble();
            this.processNext();
        }
    }

    showBubble(speaker, text) {
        this.hideBubble(); // Remove old bubble

        const creatureKey = speaker.toLowerCase();
        const creatureEl = document.getElementById(creatureKey);
        
        if (!creatureEl) {
            console.warn(`[Dialogue] Cannot find element for speaker: ${speaker}`);
            return;
        }

        // Create the bubble
        this.activeBubble = document.createElement('div');
        this.activeBubble.className = 'speech-bubble';
        this.activeBubble.textContent = text;
        
        // Get position of the creature
        const rect = creatureEl.getBoundingClientRect();
        
        // Position the bubble above the creature
        // We use translate(-50%, -100%) in CSS to center it and push it up
        this.activeBubble.style.left = `${rect.left + (rect.width / 2)}px`;
        this.activeBubble.style.top = `${rect.top - 10}px`; // 10px gap above head

        document.getElementById('scene').appendChild(this.activeBubble);

        // Add a slight animation class after a frame
        requestAnimationFrame(() => {
            if (this.activeBubble) this.activeBubble.classList.add('visible');
        });
    }

    hideBubble() {
        if (this.activeBubble) {
            this.activeBubble.classList.remove('visible');
            const bubbleToRemove = this.activeBubble;
            setTimeout(() => {
                if (bubbleToRemove.parentNode) {
                    bubbleToRemove.parentNode.removeChild(bubbleToRemove);
                }
            }, 300); // Wait for fade out transition
            this.activeBubble = null;
        }
    }

    finishConversation() {
        this.isPlaying = false;
        this.activeConversation = null;
        this.hideBubble();

        // CRITICAL: Tell app.js the conversation is done so it can calculate read time
        if (window.calculateReadTime && this.activeConversation) {
            window.calculateReadTime(this.activeConversation);
        }
        
        // But wait, the conversation just ended. The read timer should have been 
        // calculated at the start. Let's fix that by calculating it when it's queued.
    }

    getSpeakerColor(speaker) {
        // Returns a hex color for the speaker
        const colors = {
            'Solon': '#4A7A5D',   // Green
            'Prism': '#D97D54',   // Orange
            'Lumen': '#B58BD4',   // Purple
            'Ripple': '#E39EA5',  // Pink
            'Vertex': '#E35252'   // Red
        };
        return colors[speaker] || '#FFFFFF';
    }
}

window.dialogueEngine = new DialogueEngine();