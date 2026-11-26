# EDENCORE — NATURAL SPEECH & CHATTER RULES

## The Philosophy
The Council is not a search engine. They are not a collection of wise sages waiting to dispense fortune-cookie wisdom. They are *people* (or rather, creatures) sharing a tank. 

If the dialogue is always "profound," it stops feeling real. To maintain the "Pixar Rule" and the illusion of life, the Council needs mundane, messy, natural speech. They need to bicker, mumble, misunderstand each other, and use filler words.

---

## 🗣️ The 5, 3, 1 Pacing Method
When generating or writing natural chatter, keep the text extremely short. We want the text bubbles to pop up, float, and vanish quickly. 

*   **5 Words Maximum:** The default length for a casual line.
*   **3 Words Sweet Spot:** "Hey, what are you..." or "Move over, Solon."
*   **1 Word Punches:** "Huh." / "Wait." / "Oh." / "Shh." / "Stop."

Long phrases (like the deep wisdom or stories) are reserved for specific bank triggers. Chatter is for the in-between moments.

---

## 🎭 The Flavor of the Chatter
Natural speech should fall into a few specific buckets. 

### 1. The Filler & The Mumble
Words that don't mean much, but show they are alive.
*   "Uh huh."
*   "Hmm."
*   "Yep."
*   "Nah."
*   "Mmm."

### 2. The Half-Thoughts & Interruptions
In real life, we rarely speak in perfectly formatted sentences. We trail off.
*   "Hey, what are you—"
*   "Did you see that?"
*   "Wait, hold on."
*   "I was just going to say..."

### 3. The Mundane
Talking about the immediate environment, or literally nothing.
*   "The water feels nice today."
*   "I'm bored."
*   "You're in my spot."
*   "I'm hungry."
*   "Too bright."

### 4. The Nonsense & Absurdity
They are weird creatures. They should say weird things occasionally.
*   "I can see my reflection."
*   "Do you ever think about sand?"
*   "Bubbles are weird."

---

## 🚦 Implementation Rules (For Code)

1.  **ShuffleBag:** All chatter must go through the `crosstalk.js` ShuffleBag so lines never repeat back-to-back.
2.  **Speaker Anchoring:** When a chatter line triggers, the bubble must spawn directly above the speaker's head.
3.  **Volume:** Chatter should be frequent when the mood is `NORMAL` or `PLAYFUL`, but should be completely suppressed when the mood is `CRISIS` or `SLEEPING`.
4.  **No Auto-Advance:** Do not chain 5 different chatter lines back-to-back. Let them float up, pop, and give the screen a moment of silence before the next one triggers.

---

## 📂 File Structure
*   `www/dialogue/chatter.js` will hold the arrays of these short strings.
*   The `DialogueEngine` will handle spawning them as ghost bubbles.