# God Simulator

A speculative simulation tool inspired by **Charles Babbage's Ninth Bridgewater Treatise (1837)**.

Babbage argued that miracles do not violate natural law — instead, the Almighty Author designed the universe with *deep general laws* that, at specific moments or under specific conditions, produce effects that look miraculous from within. Apparent discontinuities are really consequences of higher-order laws built in from the start.

This site makes that idea explorable.

---

## What it does

You design a universe by setting **base laws** (gravity, entropy, mutation rate, etc.) and optional **meta-laws** (higher-order rules that modify base laws when triggered). Then you run a simulation and watch how a planet, ecosystem, and civilization evolve under those laws.

Two perspectives are always available:

- **Inhabitant View** — what people *inside* the world observe. They experience events as miracles, catastrophes, or ordinary history. They don't know about the meta-laws.
- **Creator View** — what the designer knows. Every "miracle" is traced to the exact law that caused it.

---

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

---

## Architecture

```
src/
├── engine/
│   ├── SimEngine.ts       # Core simulation logic (deterministic, seeded)
│   ├── seededRandom.ts    # LCG-based seeded RNG
│   └── presets.ts         # 11 example universes
├── components/
│   ├── LawEditor.tsx      # Left panel: law sliders + meta-law editor + presets
│   ├── SimView.tsx        # Center: planet visualization, charts, summary
│   ├── PerspectivePanel.tsx # Right: inhabitant vs. creator view
│   ├── Timeline.tsx       # Bottom: scrubber with event markers
│   └── Charts.tsx         # Recharts wrappers
├── hooks/
│   └── useSimulation.ts   # State management for sim config + results
└── types.ts               # All TypeScript interfaces
```

### Simulation model

Each tick = 100 years. The engine computes:

1. **Planetary conditions** — atmosphere, temperature, habitability from physics laws
2. **Life emergence** — probabilistic, requires habitability + chemistry (EM × nuclear)
3. **Evolution** — biodiversity and intelligence grow with mutation rate and time
4. **Civilizational dynamics** — population, technology, conflict, disease, resources
5. **Meta-law checks** — each tick checks whether any higher-order law should fire
6. **Event emission** — dual-perspective events for milestones, crises, and meta-law activations

### Adding presets

Edit `src/engine/presets.ts`. Each preset is a `SimConfig` with base laws, meta-laws, seed, and century count.

---

## Presets included

| Preset | Concept |
|---|---|
| Realistic Earth Baseline | All laws at 1.0 |
| High Gravity Earth | Dense atmosphere, small life, hard industry |
| Weak Gravity — Giant-Life | Thin air, giant organisms |
| Fast Mutation — Chaotic Evolution | Evolution on overdrive |
| Stable Paradise | Low entropy, abundant resources |
| Hidden Catastrophe World | Stable for 30ky, then deep law fires |
| Periodic Miracle World | Laws that reset every age |
| Civilisation Without Electricity | Forever medieval |
| Super-Cooperative Humanity | War was never in the code |
| Entropy Spike Apocalypse | Nothing lasts |
| Delayed Meta-Law Universe | Four hidden laws, four apparent miracles |

---

## Extending the simulation

- Add new law parameters in `src/types.ts → BaseLaws`
- Add slider metadata in `src/components/LawEditor.tsx → LAW_META`
- Add simulation effects in `src/engine/SimEngine.ts → tick()`
- Add new meta-law trigger types in `src/types.ts → TriggerType`
