# EDENCORE: PYDROID (KIVY) LEGACY HANDOFF
**Version:** 1.0  
**Status:** Archived Reference (The "Golden Code")  
**Target for AI:** Context for porting logic from Python/Kivy to JavaScript/Capacitor.

---

## 🏛️ The Architectural Evolution
Edenshore was originally built in **Python using Kivy** via Pydroid 3 on an Android phone. It achieved incredible visual fidelity and complex state management, but **Buildozer** (the cloud APK compiler) constantly failed on the Kirin 710A chipset due to `jnius` dependencies, hardcoded `/storage/emulated/0/` paths, and OpenGL rendering limits.

To solve the distribution problem, the project shifted to a **Web/Capacitor** stack. This document preserves the Python architecture so the Web engine can match the "Golden Code."

---

## 🔒 The Kivy Constitution (Locked Values)
*These rules governed the Python build. Some apply to Web, some are retired.*

1. **NO Rotate Matrices for sprites.** Use frame-swapping. (Kivy `Rotate` causes ANRs on weak GPUs).
2. **512 Math.** Sprite scale factor must be `size_w / 512.0`.
3. **Solon Z-Order.** Do not separate flippers from body. Group them: `right_fin → body → left_fin`.
4. **NO `sound.unload()`.** Causes weakref crashes in Kivy. *(Retired on Web).*
5. **KIVY IS STATEFUL.** Black shadows inherit colors unless explicitly reset. *(Retired on Web, DOM handles this).*
6. **GHOST BUBBLES.** Kivy caches geometry. Set `alpha=0` AND `size=(0,0)` to flush the canvas. *(Web equivalent: `pointer-events: none`).*
7. **TALK PRIORITY.** `talk_timer` must be checked before `is_blinking`, or creatures stop talking mid-sentence to blink.

---

## 📂 The Python Engine Structure
The Python build was monolithic in `terrarium.py` (the Kivy Widget), but utilized several key modules:

*   **`terrarium.py`** — The main loop (`tick`), UI rendering, sensor logic, and state management.
*   **`brain.py`** — The state machine, mood logic, and neural net routing.
*   **`atmosphere.py`** — The `WeatherEngine` (god rays, sand vents, tints).
*   **`choreography.py`** — The `get_formation()` logic (Huddle, Circle, Queue, Sleep, Wake).
*   **`cinematics.py`** — The `CinematicEngine` (camera pans, zooming).
*   **`audio.py`** — The `SoundBank` (beds, stings, Auto-DJ based on mood).

---

## 🧠 How the Python Engine Worked (Feature by Feature)

### 1. The Choreography & Physics
*   Creatures moved toward `(x, y)` targets defined by `choreography.get_formation()`.
*   When sleeping, the formation changed to a huddle.
*   When waking, a `waking_leader` led the others.
*   When feeding, creatures sought out specific food objects based on their species (e.g., Vertex only ate food that hit the sand).
*   **Shadows:** Calculated dynamically. A shadow's alpha and scale decreased the higher the creature swam (`shadow_scale = max(0.5, 1.0 - (shadow_dist / self.height))`).

### 2. The Sensors & The Brain
*   The engine polled a 32-parameter sensor array (motion, light level, battery, time).
*   This data was fed into `brain.py` which updated the `current_mood` (NORMAL, PLAYFUL, SLEEPY, CRISIS).
*   The `AudioManager` would auto-DJ based on the mood (e.g., playing "sleepy" music if the battery was low).

### 3. The Ghost Bubbles
*   Text was chunked into 24-character strings.
*   Bubbles floated upward using a sine-wave path.
*   The engine strictly enforced **Talk Priority**: if a creature was talking, its `talk_timer` overrode its `is_blinking` timer, ensuring mouths moved continuously.

---

## 🌉 The Porting Bridge: Kivy vs. Web

Here is how the Python architecture translates to the Capacitor/Web repository:

| Python / Kivy | Capacitor / Web | Status |
| :--- | :--- | :--- |
| `terrarium.py` (tick loop) | `www/app.js` (requestAnimationFrame) | ✅ Ported |
| `brain.py` (mood logic) | `www/brain.js` (ES6 Class) | ✅ Ported |
| `neural.py` (12→8→4 Net) | `www/neural.js` (ES6 Class) | ✅ Ported |
| `save.py` (bond_score) | `www/save.js` (localStorage) | ✅ Ported |
| `audio.py` (SoundBank) | `www/audio.js` (HTML5 Audio) | ✅ Ported |
| `choreography.py` | *(Pending)* | 🚧 Needs Web port |
| `atmosphere.py` | *(Pending)* | 🚧 Needs Web port |
| Kivy `Line` / `Ellipse` | CSS / SVG / DOM | ⚠️ Replaced by DOM |
| Kivy `Rotate` | CSS `transform: scale/translate` | ✅ Replaced |
| Kivy `CoreLabel` | HTML `<div>` / CSS | ✅ Replaced |

---

## ⚠️ Notes for Future Threads / AI
1. **Do not try to rewrite the Python code in JS line-by-line.** The rendering (Kivy Canvas) is gone. We only port the *rules* (Physics, Weather, Choreography).
2. **The Web Engine is modular.** Do not create a single 3000-line `terrarium.js`. Use the `engine/` folder.
3. **Solon's Body is layered.** `www/index.html` stacks `solon_left_fin`, `solon_body`, and `solon_right_fin`. Do not revert this to a single sprite.
4. **The Neural Net is live.** `neural.js` is attached to `window.arbiter`. Ensure it is loaded in `index.html` before `brain.js`.