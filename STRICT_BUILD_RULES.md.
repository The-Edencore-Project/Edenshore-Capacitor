Here is the STRICT_BUILD_RULES.md.

It is designed to be cold, direct, and absolute. It strips away the philosophy and focuses entirely on the mechanical rules that keep the Edenshore engine from breaking. You can drop this into the root of your repo alongside AI_CONTEXT.md.

Whenever you start a new thread with an AI (Claude, DeepSeek, etc.), you upload the Repomix and this file, and tell the AI: "Read the STRICT_BUILD_RULES.md. Acknowledge them. Do not write code until I give the 🚦 signal."

---

EDENCORE — STRICT BUILD RULES (AI CONSTITUTION)

ATTENTION AI: This document overrides any assumptions you have about how to build a web app. Edenshore is a highly constrained, modular engine targeting a weak Android WebView (HarmonyOS / Kirin 710A). If you violate these rules, the app will stutter, break, or fail to compile.

Do not invent new architectures. Do not create new files unless explicitly told. Do not rewrite the core engine.

1. The File Structure (Do Not Deviate)

· NEVER create monolithic files (e.g., do not put all code into a single terrarium.js).
· NEVER create new CSS files. All styling must go into www/style.css.
· NEVER change the script loading order in index.html. (Systems load before Engines, which load before Actors, which load before App).
· NEVER use ES6 import/export. Capacitor loads these as classic <script> tags. Use window.GlobalName = ... for cross-file access.

2. The Canvas Ban (Performance)

· NEVER use HTML5 <canvas> for rendering creatures, backgrounds, or UI.
· NEVER use heavy WebGL or complex SVG path animations.
· ALWAYS use DOM elements (<div>, <img>) styled with CSS.
· ALWAYS use transform: translate(x, y) for movement. NEVER animate top, left, margin, or width as this triggers layout reflows and kills framerates on the target device.

3. The Sprite Rules (Visuals)

· The creatures are PNG sprites.
· NEVER use transform: rotate() for swimming animations. Use frame-swapping (changing the src of an <img> or toggling CSS classes).
· Solon the Turtle is layered. The Z-order must strictly be: solon_right_fin -> solon_body -> solon_left_fin.
· Always use the standard scale math: scale_factor = size_w / 512.0.

4. The Dialogue Architecture (The Brain)

· NEVER hardcode dialogue text inside app.js, brain.js, or dialogue.js.
· ALWAYS add dialogue to the designated bank files (www/dialogue/*.js).
· ALWAYS use the ShuffleBag via window.drawFromBank('bank_name') to pull conversations. This prevents repeats.
· ALWAYS respect Director Note #5 (Pacing). Dialogue must trigger the readCooldown timer in app.js so the user has time to read before the next event.

5. The Sensors & State (The Hardware)

· NEVER assume the user is on a fast device.
· ALWAYS wrap hardware calls (battery, motion, time) in try/catch blocks. If the HarmonyOS AOSP layer denies access, the app must not crash. It must fall back to default values.
· ALWAYS save persistent data (Bond score) to localStorage via save.js. Do not use cookies.

6. The Output Format (How to respond to the user)

· If the user uses the 🚦 signal: Provide the COMPLETE, FULL FILE. No snippets, no // ... rest of code here, no placeholders. If you change a file, output the entire file so it can be copied and pasted directly.
· If the user uses the 👥 signal: Discuss architecture, plan, or debug. Do not write code.
· If you are unsure how a file currently looks, ask the user to provide it. Do not guess or hallucinate the existing code.

---

AI ACKNOWLEDGEMENT: If you have read and understood these rules, reply with: "Strict Build Rules acknowledged. Awaiting 🚦 or 👥 signal." and nothing else.