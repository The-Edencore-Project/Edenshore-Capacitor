# EDENCORE WEB ENGINE ARCHITECTURE
**Version:** 1.0  
**Target:** Capacitor / Android WebView  
**Philosophy:** "Not a collection of parts, but a symphony."

---

## 🏗️ The Folder Structure
The Web build replaces the monolithic Python `terrarium.py` with a modular, three-tier architecture. This prevents `app.js` from becoming a 3,000-line "God Object" and keeps the "Rules" (Engine) separated from the "Mind" (Systems).

```text
www/
├── index.html
├── style.css
├── app.js              <-- The Orchestrator (Boots the app, runs the master tick loop)
│
├── engine/             <-- The Rules (Physics & Environment)
│   ├── physics.js      (Movement, bobbing, shadow projection)
│   ├── choreography.js (Formation logic: Huddle, Circle, Feeding)
│   ├── atmosphere.js   (Weather, God Rays, Biome tint)
│   └── cinematics.js   (Camera pans and zoom logic)
│
├── systems/            <-- The Mind & Utilities (State management)
│   ├── brain.js        (Mood state machine, sensor parsing)
│   ├── neural.js       (12→8→4 Neural Net)
│   ├── save.js         (LocalStorage persistence)
│   ├── audio.js        (Music playlist, stings, Auto-DJ)
│   └── dialogue.js     (Text routing, speech bubble spawning)
│
└── actors/             <-- The Visual Entities
    ├── solon.js        (Complex multi-layer flipper animation)
    └── creatures.js    (Registry of base stats, scales, and sprite paths)