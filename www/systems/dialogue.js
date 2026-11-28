class DialogueEngine {
    constructor() {
        this.queue = [];
        this.activeConversation = null;
        this.lineIndex = 0;
        this.lineTimer = 0;
        this.isPlaying = false;
        this.activeBubbles = {};
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
        const talkDuration = Math.max(2, text.split(' ').length * 0.3);
        if (creatureState) creatureState.talkTimer = talkDuration;
        this.lineTimer = talkDuration + 1.0;
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
        const creatureKey = speaker.toLowerCase();
        const creatureEl = document.getElementById(creatureKey);
        if (!creatureEl) return;
        if(this.activeBubbles[creatureKey]){
            this.activeBubbles[creatureKey].remove();
        }
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.dataset.speaker = creatureKey;
        bubble.textContent = text;
        const rect = creatureEl.getBoundingClientRect();
        bubble.style.left = `${rect.left + (rect.width / 2)}px`;
        bubble.style.top = `${rect.top - 10}px`;
        document.getElementById('scene').appendChild(bubble);
        setTimeout(() => {
            bubble.classList.add('visible');
        }, 10);
        this.activeBubbles[creatureKey] = bubble;
        setTimeout(()=>{
            if(bubble.parentNode) bubble.remove();
            delete this.activeBubbles[creatureKey];
        },4500);
    }

    finishConversation() {
        this.isPlaying = false;
        this.activeConversation = null;
    }
}
window.dialogueEngine = new DialogueEngine();
