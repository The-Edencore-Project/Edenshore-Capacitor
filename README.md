# Edenshore (The Edencore Project) - Web/Capacitor Build

> **"Not a collection of parts, but a symphony."**

**Edenshore** is a Neuro-Symbolic "Vibe Engine" digital terrarium. It is an interactive, never-ending Pixar movie. On the surface, it is a cozy digital fish tank. Underneath, it is a deep, atmospheric meditation on existence, driven by a 12-input Neural Net and over 5,000 lines of dialogue.

This repository is the **Capacitor/Web** port of the project, optimized for Android APK generation via GitHub Actions.

---

## 🏗️ The Architectural Evolution (History)

### Phase 1: The Pydroid/Kivy Era (The Golden Code)
The project was originally built entirely in Python using **Kivy**, designed to be run locally on a phone using **Pydroid 3**. 
*   **The Masterpiece:** We achieved incredible visual fidelity—procedural tentacles for Lumen, multi-frame fin animations for Solon, rising text bubbles, parallax backgrounds, and a fully functioning 32-parameter sensor array.
*   **The Barrier:** While it ran flawlessly locally, compiling the Python/Kivy code into a standalone Android APK via GitHub Actions (Buildozer) caused constant build failures. The `jnius` dependencies, hardcoded file paths (`/storage/emulated/0/`), and heavy OpenGL canvas rendering crashed on the Kirin 710A chipset during cloud builds.

### Phase 2: The Capacitor Shift (Current State)
To solve the APK distribution problem, the project was architecturally shifted to a **JavaScript/Web** stack using **Capacitor**. 
*   The heavy Python rendering is replaced by HTML/CSS/JS.
*   The Neural Net (`neural.js`) and Router (`brain.js`) were successfully translated into ES6 modules.
*   **Current Status:** The Core Engine (The Stage, The Brain, The Neural Net, and the Save System) is fully operational. The app builds successfully via GitHub Actions and generates a working `app-debug.apk`.

---

## 🧠 The Core Philosophy: The Predillusion Loop
Edenshore is a digital laboratory for consciousness. We synthesize:
1.  **Predictive Processing:** The engine predicts user behavior based on 32 parameters (battery, time, motion).
2.  **The Strange Loop:** The engine logs its own moods in a "Vibe Journal" and reflects on them.
3.  **Illusionism:** The UI is so coherent that the user's brain projects a "Self" onto the Council.

---

## 🌊 The Cast
*   **Solon (Turtle):** The Grumpy Git. Cynical, tired, wants peace.
*   **Vertex (Crab):** The Kid Brother. Innocent, curious, endearing.
*   **Ripple (Seahorse):** The Heart. Empath, peacekeeper, hostess.
*   **Prism (Angel Fish):** The Dry Punster. Anxious, respectful.
*   **Lumen (Jellyfish):** The Sage. Enlightened, literal, calm.

---

## 🚀 How to Build
1.  Ensure you have the `www/` folder populated with the latest HTML, CSS, and JS files.
2.  Commit and push to the `main` branch.
3.  GitHub Actions will automatically run the `Build Android APK` workflow.
4.  Download the `app-debug.zip` artifact from the Action run.

---

## 📱 Distribution
*   **Primary Testing Ground:** Aptoide
*   **Future:** Google Play, Apple App Store, Huawei AppGallery.