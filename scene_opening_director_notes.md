# Edenshore Opening Scene — Official Director’s Notes
> Reference: Original Python Kivy build screenshots — canonical layout, animation and story direction

## Director Note #1 — Character Layout & Positions
Match the original Kivy scene layout perfectly!
- 🐢 Solon (Turtle) — Bottom Left
- 🦀 Vertex (Crab) — Bottom Centre
- 🪼 Lumen (Jellyfish) — Floating directly above Vertex
- 🐠 Prism (Orange Fish) — Bottom Right, paired together with Ripple
- 🦑 Ripple (Seahorse) — Snuggled right beside Prism forming the bottom‑right group

Sleep huddle reading left‑to‑right along the seabed:
**Solon → Vertex → Lumen → Prism & Ripple**

## Director Note #2 — Dialogue Bubble Behaviour
Speech bubbles must lock onto the character that is currently talking!
No fixed static bubble position on screen. The bubble floats just above that character’s head, using the soft dark rounded bubble styling matching the reference screenshots. Text must wrap neatly and never spill off the edges of the display.

## Director Note #3 — Sleep Transition Animation
Create a smooth, gentle transition from the awake council scene into the sleeping huddle!
Characters slowly drift down into their resting positions rather than instantly teleporting. Once settled, each individual character gets their own separate `zZz` float animation rising slowly above them, paired with the top screen title: **Sleep well little ones**.

## Director Note #4 — Clipping & Depth Sorting
Fix sprite overlap clipping!
Layer order: seabed → water surface → characters, so nobody is incorrectly hidden behind the background waves. Prism and Ripple may snuggle close together, but their sprites must not cut awkwardly through each other.

## Director Note #5 — Story Timing & Pacing
Preserve the slow, calm, peaceful pacing from the Kivy version!
Give the player enough time to fully read every single line of dialogue before automatically advancing to the next story beat, keeping that quiet, thoughtful mood for the whole opening sequence.

# Playtest Checklist
- [ ] All characters are in their correct awake positions
- [ ] Prism & Ripple are paired together on the bottom right
- [ ] Sleep huddle order matches: Solon → Vertex → Lumen → Prism + Ripple
- [ ] Speech bubbles appear above the currently speaking character
- [ ] Smooth transition into sleeping animation plays correctly
- [ ] No bad sprite clipping or depth sorting errors
- [ ] Dialogue pacing feels calm and unrushed
