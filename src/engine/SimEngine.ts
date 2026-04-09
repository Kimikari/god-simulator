/**
 * Core simulation engine.
 *
 * Design philosophy (Babbage's insight):
 *   - The universe runs on deep, fixed laws.
 *   - Apparent "miracles" or sudden discontinuities are actually consequences
 *     of higher-order meta-laws that were built into the system from the start.
 *   - Inhabitants observe effects without knowing causes; the creator sees both.
 *
 * Each tick represents 100 years. The engine is deterministic given the same seed.
 */

import type { BaseLaws, WorldState, SimConfig, SimTrace, SimEvent, MetaLaw, SimSummary } from '../types'
import { SeededRandom } from './seededRandom'

// ─── Utility ─────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// ─── Planet initialization ────────────────────────────────────────────────────
/**
 * Compute stable planetary conditions from the base laws.
 * Called once at simulation start.
 */
function computePlanetaryConditions(laws: BaseLaws, rng: SeededRandom): Partial<WorldState> {
  // Atmosphere: gravity holds gas molecules; EM affects ionosphere shielding
  const atmosphereRetention = clamp(
    0.1 + 0.55 * Math.min(laws.gravity, 2.0) / 2.0
        + 0.15 * Math.min(laws.electromagnetism, 2.0) / 2.0
        + 0.1  * Math.min(laws.climateStability, 2.0) / 2.0
        + rng.range(-0.05, 0.05),
    0.05, 1.0
  )

  // Star output is a proxy for solar energy; driven by nuclear force
  const starOutput = clamp(laws.nuclearForce * 0.9 + 0.1, 0.1, 2.5)

  // Temperature:
  //   - thin atmosphere → cold (no greenhouse)
  //   - thick atmosphere → hot (runaway greenhouse)
  //   - peaks at ~0.55 retention (Earth-like greenhouse)
  const greenhouseEffect = atmosphereRetention < 0.5
    ? -35 * (0.5 - atmosphereRetention)
    : +50 * (atmosphereRetention - 0.5)
  const baseTemp = (starOutput - 1.0) * 20 + 15 // Earth = 15°C baseline
  const climateNoise = rng.range(-8, 8) * (1 / Math.max(laws.climateStability, 0.2))
  const temperature = clamp(baseTemp + greenhouseEffect + climateNoise, -150, 250)

  // Ocean coverage: needs liquid water → temperature window + atmosphere
  const tempOk = temperature > -10 && temperature < 80
  const oceanCoverage = tempOk
    ? clamp(0.3 + atmosphereRetention * 0.4 + rng.range(-0.1, 0.1), 0, 1)
    : clamp(rng.range(0, 0.15), 0, 1)

  // Habitability composite
  const tempScore   = clamp(1 - Math.abs(temperature - 15) / 55, 0, 1)
  const atmoScore   = atmosphereRetention > 0.25
    ? clamp(1 - Math.abs(atmosphereRetention - 0.55) / 0.5, 0, 1)
    : 0
  const resourceScore = clamp(laws.resourceAbundance / 1.5, 0, 1)
  const habitability = clamp(
    0.35 * tempScore + 0.3 * atmoScore + 0.2 * resourceScore + 0.15 * (oceanCoverage),
    0, 1
  )

  return { temperature, atmosphereRetention, oceanCoverage, habitability }
}

// ─── Single tick (100 years) ──────────────────────────────────────────────────
function tick(
  state: WorldState,
  laws: BaseLaws,
  rng: SeededRandom,
  events: SimEvent[]
): WorldState {
  const s = { ...state, effectiveLaws: { ...laws } }
  const yr = s.year + 100

  // ── 1. Climate drift (entropy slowly destabilises things) ─────────────────
  const tempDrift = rng.range(-3, 3) * (laws.entropy / laws.climateStability) * 0.3
  const newTemp = clamp(s.temperature + tempDrift, -150, 250)
  const newAtmo = clamp(
    s.atmosphereRetention - 0.0001 * laws.entropy + rng.range(-0.002, 0.002),
    0.02, 1.0
  )
  const tempScore = clamp(1 - Math.abs(newTemp - 15) / 55, 0, 1)
  const atmoScore = newAtmo > 0.25
    ? clamp(1 - Math.abs(newAtmo - 0.55) / 0.5, 0, 1)
    : 0
  const newHabitability = clamp(
    0.35 * tempScore + 0.3 * atmoScore
    + 0.2 * clamp(s.resourceAbundance / 1.5, 0, 1)
    + 0.15 * s.oceanCoverage,
    0, 1
  )

  // ── 2. Rare events (asteroid, supervolcano, gamma burst) ─────────────────
  const rareHit = rng.bool(laws.rareEventProb * 0.004)
  let habitabilityHit = newHabitability
  if (rareHit) {
    const severity = rng.range(0.05, 0.35)
    habitabilityHit = clamp(habitabilityHit - severity, 0, 1)
    const titles = ['Asteroid Impact', 'Supervolcanic Eruption', 'Gamma-Ray Burst', 'Solar Flare Cascade']
    const title = titles[rng.int(0, titles.length - 1)]
    events.push({
      year: yr,
      type: 'crisis',
      title,
      inhabitantView: `A catastrophic ${title.toLowerCase()} has struck the world. The sky darkens and temperatures plunge.`,
      creatorView:    `Rare-event probability law triggered a ${title.toLowerCase()} (p = ${(laws.rareEventProb * 0.004).toFixed(4)} per century).`,
    })
  }

  // ── 3. Life emergence ─────────────────────────────────────────────────────
  let { lifeExists, biodiversity } = s
  if (!lifeExists) {
    // Chemistry richness: combination of EM (bond variety) and nuclear force (element stability)
    const chemistry = (laws.electromagnetism * 0.6 + laws.nuclearForce * 0.4) - 0.5
    const pLife = clamp(habitabilityHit * 0.003 * Math.max(chemistry, 0) * laws.mutationRate, 0, 0.05)
    if (habitabilityHit > 0.35 && rng.bool(pLife)) {
      lifeExists = true
      biodiversity = 0.02
      events.push({
        year: yr, type: 'milestone', title: 'Life Emerges',
        inhabitantView: 'The first self-replicating molecules appear in warm tidal pools. The great chain of being has begun.',
        creatorView:    `Life emerged because habitability (${habitabilityHit.toFixed(2)}) exceeded threshold and chemistry index (${chemistry.toFixed(2)}) was sufficient.`,
      })
    }
  }

  // ── 4. Evolution ──────────────────────────────────────────────────────────
  let { intelligence, civilizationExists } = s
  if (lifeExists) {
    // Biodiversity rises with mutation and habitability; falls with rareEvents and entropy
    const bdGrowth = laws.mutationRate * 0.006 * habitabilityHit * (1 - biodiversity)
    const bdDecay  = (1 - habitabilityHit) * 0.003 + laws.entropy * 0.001 + (rareHit ? 0.04 : 0)
    biodiversity = clamp(biodiversity + bdGrowth - bdDecay, 0, 1)

    // Intelligence rises with: biodiversity (cognitive niches), lifespan (learning time),
    //   low entropy (long-lived structures), and low intelligenceThreshold (inherent ease)
    const intGain = biodiversity * laws.lifespanMult * (2 - laws.entropy)
      * (1 / laws.intelligenceThreshold) * 0.008
    intelligence = clamp(intelligence + intGain, 0, 10)

    // Civilization emerges when intelligence crosses scaled threshold
    const civThreshold = 3.0 * laws.intelligenceThreshold
    if (!civilizationExists && intelligence >= civThreshold) {
      civilizationExists = true
      s.population = 0.001 // 1 million people
      events.push({
        year: yr, type: 'milestone', title: 'Civilization Emerges',
        inhabitantView: 'The first cities are built. Language, law, and culture take root. Humanity looks to the stars and wonders.',
        creatorView:    `Intelligence (${intelligence.toFixed(1)}) crossed the civilization threshold (${civThreshold.toFixed(1)}). Threshold set by intelligenceThreshold law = ${laws.intelligenceThreshold}.`,
      })
    }

    // Extinction check for life
    if (habitabilityHit < 0.1 && rng.bool(0.08)) {
      lifeExists = false
      biodiversity = 0
      civilizationExists = false
      events.push({
        year: yr, type: 'collapse', title: 'Mass Extinction',
        inhabitantView: 'The conditions for life have become untenable. The oceans dry, the air thins. Silence returns to the world.',
        creatorView:    `Habitability collapsed to ${habitabilityHit.toFixed(2)} — below the 0.10 survival floor. Life ended.`,
      })
    }
  }

  // ── 5. Civilization dynamics ──────────────────────────────────────────────
  let { population, technologyLevel, conflictLevel, cooperationLevel, diseaseRate, avgLifespan } = s
  let newResourceAbundance = s.resourceAbundance
  if (civilizationExists && population > 0) {
    // Carrying capacity grows with technology
    const carryingCapacity = clamp(10 * laws.resourceAbundance * (1 + technologyLevel * 0.6), 0.001, 500)

    // Population growth: fertility × logistic dampening
    const densityFactor = clamp(1 - population / carryingCapacity, -0.5, 1)
    const growthRate = laws.fertilityRate * 0.018 * densityFactor
    const deathRate  = laws.entropy * 0.004 + diseaseRate * 0.015 + conflictLevel * 0.01
    population = clamp(population * (1 + growthRate - deathRate), 0, 1000)

    if (population <= 0.00001) {
      civilizationExists = false
      population = 0
      events.push({
        year: yr, type: 'collapse', title: 'Civilizational Collapse',
        inhabitantView: 'The last cities fall silent. Roads crumble and libraries burn. The human story ends here.',
        creatorView:    `Population reached zero. Collapse driven by: entropy=${laws.entropy.toFixed(2)}, diseaseSpread=${laws.diseaseSpread.toFixed(2)}, conflict=${conflictLevel.toFixed(2)}.`,
      })
    }

    // Technology: grows with intelligence, cooperation, and resource surplus
    const techGain = intelligence * laws.cooperationTendency * 0.0005
      * Math.min(newResourceAbundance, 1.2) / laws.intelligenceThreshold
    // Acceleration at technology milestones
    const techMult = technologyLevel > 7 ? 4 : technologyLevel > 5 ? 2.5 : technologyLevel > 3 ? 1.5 : 1
    technologyLevel = clamp(technologyLevel + techGain * techMult, 0, 10)

    // Technology milestone events
    const prevTech = s.technologyLevel
    const milestones: Array<[number, string, string]> = [
      [1, 'The Agricultural Revolution', 'Farming spreads across the land. Cities swell and empires rise.'],
      [3, 'Writing and Record-Keeping', 'Knowledge survives death. Civilizations accumulate wisdom across generations.'],
      [5, 'Industrial Revolution', 'Steam and iron reshape the world. Energy is harnessed at scale.'],
      [7, 'The Information Age', 'Minds connect across the globe. Reality becomes computable.'],
      [9, 'Post-Scarcity Threshold', 'Material constraints dissolve. Humanity turns its gaze inward.'],
    ]
    for (const [lvl, title, inh] of milestones) {
      if (prevTech < lvl && technologyLevel >= lvl) {
        events.push({
          year: yr, type: 'milestone', title,
          inhabitantView: inh,
          creatorView: `Technology level ${lvl} reached. Intelligence=${intelligence.toFixed(1)}, cooperation=${laws.cooperationTendency.toFixed(2)}, resources=${newResourceAbundance.toFixed(2)}.`,
        })
      }
    }

    // Disease
    const popPressure = clamp(population / carryingCapacity, 0, 2)
    diseaseRate = clamp(
      laws.diseaseSpread * 0.15 * popPressure * (1 - technologyLevel * 0.06)
      + rng.range(-0.02, 0.02),
      0, 1
    )

    // Conflict
    const scarcity = clamp(1 - newResourceAbundance * (1 + technologyLevel * 0.1), 0, 1)
    conflictLevel = clamp(
      laws.violenceTendency * 0.25 + scarcity * laws.violenceTendency * 0.4
      + Math.max(0, popPressure - 0.9) * 0.3 + rng.range(-0.05, 0.05),
      0, 1
    )

    // Cooperation
    cooperationLevel = clamp(
      laws.cooperationTendency * 0.4 + technologyLevel * 0.05
      + (1 - conflictLevel) * 0.3 + rng.range(-0.05, 0.05),
      0, 1
    )

    // Resource consumption
    const consumption = population * 0.002 * (1 + technologyLevel * 0.05)
    const regeneration = laws.resourceAbundance * 0.015 * habitabilityHit
    newResourceAbundance = clamp(newResourceAbundance + regeneration - consumption, 0, 3)

    // Lifespan
    avgLifespan = clamp(
      30 * laws.lifespanMult * (1 + technologyLevel * 0.25) * (1 - laws.entropy * 0.15)
      * (1 - diseaseRate * 0.3),
      5, 500
    )

    // War event
    if (conflictLevel > 0.75 && rng.bool(0.08)) {
      events.push({
        year: yr, type: 'crisis', title: 'Age of Wars',
        inhabitantView: 'Nations clash in devastating conflict. Borders burn and populations fall.',
        creatorView:    `Conflict threshold triggered: violenceTendency=${laws.violenceTendency.toFixed(2)}, resourceScarcity=${scarcity.toFixed(2)}.`,
      })
    }

    // Disease epidemic
    if (diseaseRate > 0.6 && rng.bool(0.1)) {
      events.push({
        year: yr, type: 'crisis', title: 'Plague',
        inhabitantView: 'A great plague sweeps the civilized world. Half the cities lie empty.',
        creatorView:    `Disease rate ${diseaseRate.toFixed(2)} triggered epidemic. diseaseSpread=${laws.diseaseSpread.toFixed(2)}.`,
      })
    }
  }

  // ── 6. Extinction risk ────────────────────────────────────────────────────
  const extinctionRisk = clamp(
    (1 - habitabilityHit) * 0.3
    + (civilizationExists ? conflictLevel * 0.15 : 0)
    + diseaseRate * 0.1
    + (technologyLevel > 8 ? 0.05 : 0) // advanced tech risk
    + laws.rareEventProb * 0.1,
    0, 1
  )

  return {
    ...s,
    year: yr,
    temperature: newTemp,
    atmosphereRetention: newAtmo,
    oceanCoverage: s.oceanCoverage + rng.range(-0.003, 0.003) * laws.entropy,
    habitability: habitabilityHit,
    lifeExists,
    biodiversity,
    intelligence,
    civilizationExists,
    population,
    technologyLevel,
    conflictLevel,
    cooperationLevel,
    diseaseRate,
    avgLifespan,
    extinctionRisk,
    resourceAbundance: newResourceAbundance,
    effectiveLaws: laws,
  }
}

// ─── Meta-law processor ───────────────────────────────────────────────────────
function applyMetaLaws(
  state: WorldState,
  laws: BaseLaws,
  metaLaws: MetaLaw[],
  events: SimEvent[]
): { laws: BaseLaws; activatedNow: MetaLaw[] } {
  let current = { ...laws }
  const activatedNow: MetaLaw[] = []

  for (const ml of metaLaws) {
    if (ml.activated) continue

    let triggered = false
    switch (ml.trigger) {
      case 'year':
        triggered = ml.triggerComparison === 'gte'
          ? state.year >= ml.triggerValue
          : state.year <= ml.triggerValue
        break
      case 'population':
        triggered = state.civilizationExists && (
          ml.triggerComparison === 'gte'
            ? state.population >= ml.triggerValue
            : state.population <= ml.triggerValue
        )
        break
      case 'technology':
        triggered = state.civilizationExists && (
          ml.triggerComparison === 'gte'
            ? state.technologyLevel >= ml.triggerValue
            : state.technologyLevel <= ml.triggerValue
        )
        break
      case 'habitability':
        triggered = ml.triggerComparison === 'gte'
          ? state.habitability >= ml.triggerValue
          : state.habitability <= ml.triggerValue
        break
    }

    if (triggered) {
      ml.activated = true
      ml.activatedAtYear = state.year
      activatedNow.push(ml)

      // Apply effects as multipliers
      for (const [key, mult] of Object.entries(ml.effects) as Array<[keyof BaseLaws, number]>) {
        current[key] = clamp(current[key] * (mult ?? 1), 0.01, 10)
      }

      const creatorMsg = `Meta-law "${ml.label}" activated at year ${state.year}. ` +
        `Effects: ${Object.entries(ml.effects).map(([k, v]) => `${k} ×${v}`).join(', ')}.`
      const inhabitantMsg = ml.hiddenFromInhabitants
        ? generateMiracleDescription(ml, state)
        : `A shift in the world order becomes apparent: ${ml.description}`

      events.push({
        year: state.year,
        type: ml.hiddenFromInhabitants ? 'miracle' : 'meta_law',
        title: ml.hiddenFromInhabitants ? 'Apparent Miracle' : `Law Shift: ${ml.label}`,
        inhabitantView: inhabitantMsg,
        creatorView: creatorMsg,
        metaLawId: ml.id,
      })
    }
  }

  return { laws: current, activatedNow }
}

/** Generate a plausible inhabitant interpretation of a hidden meta-law effect */
function generateMiracleDescription(ml: MetaLaw, state: WorldState): string {
  const keys = Object.keys(ml.effects) as Array<keyof BaseLaws>
  const templates: Record<string, string[]> = {
    gravity: [
      'Mountains seem lighter. Buildings that once crumbled now stand. Scholars argue whether the world has grown stronger.',
      'A heaviness lifts from the land. Floods recede; strange new creatures walk on longer limbs.',
    ],
    entropy: [
      'Things last longer than they should. The priests say the gods have granted the world renewed vigour.',
      'Ancient structures crumble overnight. The philosophers say the world grows tired.',
    ],
    diseaseSpread: [
      'A great pestilence sweeps the land. Healers see no natural cause; the people speak of divine punishment.',
      'Disease retreats from the world. Children who would have died now live. People call it a blessing.',
    ],
    cooperationTendency: [
      'A strange peace settles across rival nations. Old feuds dissolve without reason.',
      'Trust collapses everywhere at once. Alliances crumble. Neighbours become strangers.',
    ],
    mutationRate: [
      'New forms of life appear in the wilderness. Naturalists are baffled; priests call it creation anew.',
    ],
  }
  const key = keys[0]
  const options = templates[key] ?? [`Something fundamental has shifted in the fabric of the world. ${ml.description}`]
  return options[Math.floor(state.year / 100) % options.length]
}

// ─── Summary generator ────────────────────────────────────────────────────────
function buildSummary(
  trace: WorldState[],
  events: SimEvent[],
  activatedMetaLaws: MetaLaw[],
  laws: BaseLaws
): SimSummary {
  const final = trace[trace.length - 1]
  const hasCiv = trace.some(s => s.civilizationExists)
  const hasLife = trace.some(s => s.lifeExists)
  const maxPop = Math.max(...trace.map(s => s.population))
  const maxTech = Math.max(...trace.map(s => s.technologyLevel))

  let outcome: SimSummary['outcome']
  if (!hasLife) outcome = 'never_emerged'
  else if (!hasCiv) outcome = 'never_emerged'
  else if (final.technologyLevel >= 9 && final.population > 5) outcome = 'transcendent'
  else if (final.population > 1 && final.habitability > 0.3) outcome = 'flourishing'
  else if (final.population <= 0 || !final.civilizationExists) outcome = 'collapsed'
  else outcome = 'collapsed'

  const universe = laws.gravity < 0.5
    ? `A low-gravity universe where organisms grow enormous and atmospheres are thin.`
    : laws.gravity > 1.8
    ? `A heavy universe where life clings close to the ground and flight is nearly impossible.`
    : `A universe with roughly Earth-like physics, hospitable to complex chemistry.`

  const earth = `Final temperature ${final.temperature.toFixed(0)}°C, atmosphere retention ${(final.atmosphereRetention * 100).toFixed(0)}%, habitability ${(final.habitability * 100).toFixed(0)}%.`

  const humanity = !hasLife
    ? `Life never emerged. The planet remains lifeless throughout the simulation.`
    : !hasCiv
    ? `Life emerged and evolved, but intelligence never reached the civilizational threshold. The world is inhabited by complex animals without cities.`
    : outcome === 'transcendent'
    ? `Humanity thrived, reached a technological singularity, and transcended material constraints.`
    : outcome === 'flourishing'
    ? `Humanity flourished. Peak population ${maxPop.toFixed(2)}B, technology level ${maxTech.toFixed(1)}.`
    : `Civilisation rose but ultimately collapsed. Peak population ${maxPop.toFixed(2)}B before the fall.`

  const milestones = events
    .filter(e => e.type === 'milestone' || e.type === 'collapse')
    .slice(0, 6)
    .map(e => `Year ${e.year.toLocaleString()}: ${e.title}`)

  const miracles = events.filter(e => e.type === 'miracle')
  const inhabitantBeliefs = miracles.length > 0
    ? `Inhabitants recorded ${miracles.length} inexplicable event(s) — labelling them miracles, divine acts, or anomalies. ` +
      `They developed ${laws.consciousnessDepth > 1.2 ? 'rich theological and philosophical' : 'basic mythological'} frameworks to explain them.`
    : `No obvious discontinuities occurred; inhabitants likely developed a mechanical, law-based worldview.`

  const hiddenCauses = activatedMetaLaws.length > 0
    ? `${activatedMetaLaws.length} meta-law(s) fired during the simulation: ` +
      activatedMetaLaws.map(m => `"${m.label}" at year ${m.activatedAtYear?.toLocaleString()}`).join('; ') + `. ` +
      `Each apparent miracle was a scheduled consequence of a higher-order law — built in from the start.`
    : `No meta-laws activated. All events arose from the base law configuration alone.`

  return {
    universeDescription: universe,
    earthConditions: earth,
    humanityFate: humanity,
    majorTurningPoints: milestones,
    inhabitantBeliefs,
    creatorKnowledge: hiddenCauses,
    outcome,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function runSimulation(config: SimConfig): SimTrace {
  const rng = new SeededRandom(config.seed)
  const events: SimEvent[] = []
  const allActivated: MetaLaw[] = []

  // Deep-clone meta-laws so we can mutate .activated without touching config
  const metaLaws: MetaLaw[] = config.metaLaws.map(m => ({ ...m, activated: false }))

  // ── Initial planetary setup ───────────────────────────────────────────────
  const planet = computePlanetaryConditions(config.laws, rng)
  let current: WorldState = {
    year: 0,
    temperature: planet.temperature ?? 15,
    atmosphereRetention: planet.atmosphereRetention ?? 0.6,
    oceanCoverage: planet.oceanCoverage ?? 0.7,
    habitability: planet.habitability ?? 0.5,
    lifeExists: false,
    biodiversity: 0,
    intelligence: 0,
    civilizationExists: false,
    population: 0,
    technologyLevel: 0,
    conflictLevel: 0,
    cooperationLevel: 0.3,
    diseaseRate: 0,
    avgLifespan: 0,
    extinctionRisk: 0,
    resourceAbundance: config.laws.resourceAbundance,
    effectiveLaws: { ...config.laws },
  }

  let effectiveLaws = { ...config.laws }
  const states: WorldState[] = [current]

  // ── Main loop ─────────────────────────────────────────────────────────────
  for (let i = 0; i < config.centuriesToSimulate; i++) {
    // Apply meta-laws (may mutate effectiveLaws and add events)
    const { laws: updatedLaws, activatedNow } = applyMetaLaws(current, effectiveLaws, metaLaws, events)
    effectiveLaws = updatedLaws
    allActivated.push(...activatedNow)

    // Tick world forward
    current = tick(current, effectiveLaws, rng, events)
    states.push(current)

    // Early exit: life gone and unlikely to return
    if (!current.lifeExists && current.year > 50000 && current.habitability < 0.1) break
  }

  const summary = buildSummary(states, events, allActivated, config.laws)

  return { states, events, activatedMetaLaws: allActivated, summary }
}
