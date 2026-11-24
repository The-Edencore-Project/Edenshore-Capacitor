# EDENCORE MASTER HAND-OFF (V4.5)

## The Project
Edenshore is a Neuro-Symbolic "Vibe Engine" for Android. Digital terrarium with 5 BSOs.

## The Constitution — Active on Web
1. NO Rotate Matrices for sprites — use frame-swapping (CSS transform: none; swap src).
2. 512 Math — scale_factor = size_w / 512.0 (Verify PNG dimensions).
3. Solon Z-order: right_fin → body → left_fin (IMPLEMENTED in CSS via z-index layers).
4. GHOST BUBBLES — use pointer-events: none (Satisfied).
5. TALK PRIORITY — talk_timer advances before is_blinking (Satisfied in brain.update()).

## Retired (Kivy-only, do not carry to Web)
- NO sound.unload() — no such API in Web Audio.
- KIVY IS STATEFUL — DOM is the state on Web.

## Current Stack (V0.1)
- HTML → Capacitor → APK
- Files (loaded order): save.js → audio.js → neural.js → brain.js → creatures.js → dialogue.js → app.js
- Repo: github.com/The-Edencore-Project/Edenshore-Capacitor

## Current Status (V4.5)
- Splash screen fades on tap ✅
- Parallax + 5 creatures rendering ✅
- Sensors online ✅
- Neural Net (12->8->4) is LIVE and driving moods ✅
- Solon is fully layered (Flippers + Torso) ✅
- Music playlist rebuilt to use the 11 available MP3s ✅
- Persistence works (Bond score saves to localStorage) ✅
- Texture swapping works (Talk/Blink) ✅

## Asset Notes
- The old whole-body Solon sprites (`solon.png`, etc.) have been deleted by the architect. Use `solon_body.png`.
- Ambient beds have been replaced by `monume_lounge_relaxing.mp3` (currently not wired to code, reserved for Phase 2).