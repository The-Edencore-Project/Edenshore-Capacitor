# EDENCORE / EDENSHORE - VISION

Status: working draft. Describes intent and a *proposed* split. Nothing here changes the code yet.

## Where it came from
- Built from research into AI, consciousness and emotions, plus digital interoceptivity (sensing its own inner state) and digital exteroceptivity (sensing the outside world).
- Started as a GUI chat box between the Council, became a terrarium/aquarium, and felt alive in the Kivy version.
- Edenshore is the first "skin". Edencore is the architecture underneath.

## Three goals
1. **A game.** First priority. It has to feel alive, or nothing else works.
2. **An IoT dashboard (later).** Real devices become extra senses.
3. **A blueprint for future apps.** Racing, building, designing, and others, all on the same engine.

## The loop (Terrarium Metabolic Blueprint)
Intake -> Circulate -> Process -> Filter -> Regulate -> Archive -> Repeat

| Terrarium need | Software role |
| :--- | :--- |
| Light | Sensor input (exteroception) |
| Oxygen | Compute budget, message bus |
| Food | Reward signal, goal relevance |
| Water | Working memory, state registry |
| Filters | Curation, hallucination check |
| Thermostat | Homeostasis, resource monitor (interoception) |
| Substrate | Long-term memory (Wiki-Tree) |
| Waste | Log rotation, archive |

## The Council
- Solon: governor (prioritises)
- Lumen: verifier
- Ripple: need-tracker
- Vertex: sequence builder
- Prism: critique / truth tester

## Proposed split: Core vs Skin
**Core (reusable engine, no creatures, no ocean):**
sense the world -> feel inside -> settle into a mood -> express it.
- Sensors (motion, battery, time, later light/sound/IoT)
- Brain / mood arbiter
- Bond and save state
- Dialogue player and ShuffleBag
- Message bus and state registry (not built yet)

**Skin (Edenshore):**
- Creatures, sprites, formations, physics
- Biomes, atmosphere, particles
- Dialogue content banks
- HUD and buttons

A new app (racing, building, designing) = same Core, new Skin.

## Where today's files sit (proposed)
| Likely Core | Likely Skin |
| :--- | :--- |
| systems/brain.js, neural.js, save.js | actors/, assets/ |
| systems/dialogue.js, crosstalk.js | dialogue/*.js (content) |
| systems/audio.js | engine/ (choreography, physics, atmosphere, cinematics) |
| | index.html, app.js (wiring) |

## Principles
- **Feels alive** is the bar. Judge builds by that, not by feature count.
- Mobile-first is a design value, not a limitation.
- Target hardware is a HUAWEI MatePad SE (Chromium M99). Performance comes first.
- Guard against architecture drift.

## Not built yet
Message bus, state registry, scheduler, Filters layer, homeostasis monitor, Wiki-Tree, IoT connectors, Council roles driving behaviour.
