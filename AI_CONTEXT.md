# EDENCORE MASTER HAND-OFF (V4.4)

## The Project
Edenshore is a Neuro-Symbolic "Vibe Engine" for Android. Digital terrarium with 5 BSOs (Behavioural Sensory Organisms).

## The Constitution (Locked Values)
1. NO Rotate Matrices for sprites — use frame-swapping
2. 512 Math — scale_factor = size_w / 512.0
3. Solon Z-order: right_fin → body → left_fin (Section 3 grouping)
4. NO sound.unload() — weakref crash
5. KIVY IS STATEFUL — but we're now on Capacitor/Web
6. GHOST BUBBLES — set alpha=0 AND size=(0,0)
7. TALK PRIORITY — talk_timer before is_blinking

## Current Stack (V0.1)
- HTML → Capacitor → APK
- Files: index.html, style.css, app.js, brain.js, audio.js, save.js
- Repo: github.com/The-Edencore-Project/Edenshore-Capacitor

## Council
- Solon 🐢 — Governor
- Prism 🐠 — Tester
- Lumen 🪼 — Verifier
- Ripple 🦄 — Need-Tracker
- Vertex 🦀 — Sequence Builder

## Current Status
- Splash screen fades on tap ✅
- Parallax + 5 creatures rendering ✅
- Sensors (motion/battery) online ✅
- Brain.js syntax fix pending