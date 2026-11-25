# EDENCORE MASTER HAND-OFF (V4.6)

## The Project
Edenshore is a Neuro-Symbolic "Vibe Engine" for mobile. Digital terrarium with 5 BSOs (Behavioural Sensory Organisms).

## ⚠️ THE HARDWARE REALITY (READ FIRST)
All architectural decisions must pass the "Target Device Test." If it stutters here, it fails.

*   **Device:** HUAWEI MatePad SE 11"
*   **Processor:** Kirin 710A (2018-era, 12nm, 4x Cortex-A73 + 4x Cortex-A53)
*   **GPU:** Mali-G51 MP4 (Extremely modest. WebGL is limited.)
*   **RAM:** 4.0 GB
*   **OS:** HarmonyOS 2.0.0 (Not standard Android)
*   **The WebView Trap:** The device uses HarmonyOS's AOSP compatibility layer. The WebView is based on **Chromium M99** (released early 2022). 
*   **Constraint:** Do not use modern CSS/JS features that require Chromium M100+. Optimize all `requestAnimationFrame` loops. Avoid heavy `backdrop-filter` or complex SVG paths.

## The Constitution — Active on Web
1. NO Rotate Matrices for sprites — use frame-swapping (CSS transform: none; swap src).
2. 512 Math — scale_factor = size_w / 512.0 (Verify PNG dimensions).
3. Solon Z-order: right_fin → body → left_fin (IMPLEMENTED in CSS via z-index layers).
4. GHOST BUBBLES — use pointer-events: none (Satisfied).
5. TALK PRIORITY — talk_timer advances before is_blinking (Satisfied in app.js per-creature blink timers).
6. DOM OVER CANVAS — Use `transform: translate()` for movement to avoid layout reflows. Never animate `top`/`left`.

## Retired (Kivy-only, do not carry to Web)
- NO sound.unload() — no such API in Web Audio.
- KIVY IS STATEFUL — DOM is the state on Web.

## Current Stack (V0.6)
- HTML → Capacitor → APK
- Files (loaded order): systems/ → engine/ → actors/ → dialogue/ → crosstalk.js → app.js
- Repo: github.com/The-Edencore-Project/Edenshore-Capacitor

## Current Status (V4.6)
- Splash screen fades on tap ✅
- Parallax + 5 creatures rendering ✅
- Sensors online ✅
- Neural Net (12->8->4) is LIVE and driving moods ✅
- Solon is fully layered (Flippers + Torso) ✅
- Music playlist rebuilt to use the 11 available MP3s ✅
- Persistence works (Bond score saves to localStorage) ✅
- Texture swapping works (Talk/Blink) ✅
- 18 Dialogue Banks loaded and bridged via crosstalk.js ✅
- HUD restored (Feed, Sleep, Dim, Vol, Menu) ✅
- Rising Bubble Animation fixed (CSS riseAndFade) ✅
- Per-creature blink timers (no more synchronized blinking) ✅

## Asset Notes
- The old whole-body Solon sprites (`solon.png`, etc.) have been deleted by the architect. Use `solon_body.png`.
- Ambient beds have been replaced by `monume_lounge_relaxing.mp3` (currently not wired to code, reserved for Phase 2).