import type { Preset, BaseLaws, MetaLaw } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const baseline: BaseLaws = {
  gravity: 1.0,
  electromagnetism: 1.0,
  nuclearForce: 1.0,
  entropy: 1.0,
  mutationRate: 1.0,
  fertilityRate: 1.0,
  lifespanMult: 1.0,
  diseaseSpread: 1.0,
  intelligenceThreshold: 1.0,
  cooperationTendency: 1.0,
  violenceTendency: 1.0,
  consciousnessDepth: 1.0,
  resourceAbundance: 1.0,
  climateStability: 1.0,
  rareEventProb: 1.0,
}

function meta(
  id: string, label: string, description: string,
  trigger: MetaLaw['trigger'], triggerValue: number, triggerComparison: MetaLaw['triggerComparison'],
  effects: MetaLaw['effects'], hidden: boolean
): MetaLaw {
  return { id, label, description, trigger, triggerValue, triggerComparison, effects, hiddenFromInhabitants: hidden, activated: false }
}

// ─── Presets ──────────────────────────────────────────────────────────────────
export const PRESETS: Preset[] = [
  {
    id: 'baseline',
    name: 'Realistic Earth Baseline',
    tagline: 'The world as we know it.',
    description: 'All laws set to Earth-like values. A familiar civilizational arc: life emerges, intelligence develops, cities rise.',
    config: {
      seed: 42,
      laws: { ...baseline },
      metaLaws: [],
      centuriesToSimulate: 1000,
    },
  },

  {
    id: 'high_gravity',
    name: 'High Gravity Earth',
    tagline: 'A heavy world of dense life.',
    description: "Gravity is twice Earth's. The atmosphere is thick, temperatures are high, organisms are compact and powerful. Industrial technology becomes very difficult.",
    config: {
      seed: 101,
      laws: { ...baseline, gravity: 2.2, entropy: 1.3, resourceAbundance: 0.7, intelligenceThreshold: 1.4 },
      metaLaws: [],
      centuriesToSimulate: 1200,
    },
  },

  {
    id: 'low_gravity',
    name: 'Weak Gravity — Giant-Life Earth',
    tagline: 'Where creatures grow enormous.',
    description: 'Low gravity means thin atmosphere and giant organisms. Flight is easy but warmth is scarce. Industrial civilization struggles to launch rockets or retain heat.',
    config: {
      seed: 77,
      laws: { ...baseline, gravity: 0.3, mutationRate: 1.5, lifespanMult: 2.5, climateStability: 0.5 },
      metaLaws: [],
      centuriesToSimulate: 1400,
    },
  },

  {
    id: 'fast_mutation',
    name: 'Fast Mutation — Chaotic Evolution',
    tagline: 'Evolution on overdrive.',
    description: 'Mutation rate is 4×. Life blooms explosively but species vanish as quickly as they appear. Intelligence emerges fast but with unpredictable traits.',
    config: {
      seed: 55,
      laws: { ...baseline, mutationRate: 4.0, diseaseSpread: 2.0, entropy: 1.5, lifespanMult: 0.6 },
      metaLaws: [],
      centuriesToSimulate: 800,
    },
  },

  {
    id: 'stable_paradise',
    name: 'Stable Paradise',
    tagline: 'A world almost too perfect.',
    description: 'Low entropy, rich resources, gentle climate. Life thrives, conflict is rare. But without pressure, does civilisation ever invent anything truly new?',
    config: {
      seed: 999,
      laws: {
        ...baseline,
        entropy: 0.3, rareEventProb: 0.1, climateStability: 2.0,
        resourceAbundance: 2.5, violenceTendency: 0.2, diseaseSpread: 0.2,
        cooperationTendency: 1.8, lifespanMult: 2.0,
      },
      metaLaws: [],
      centuriesToSimulate: 1500,
    },
  },

  {
    id: 'hidden_catastrophe',
    name: 'Hidden Catastrophe World',
    tagline: 'Stable for millennia — then the deep law fires.',
    description: "The universe appears perfectly benign for the first 30,000 years. Then a hidden meta-law slowly weakens nuclear force, destabilising chemistry and the sun's output. The inhabitants have no warning.",
    config: {
      seed: 314,
      laws: { ...baseline, climateStability: 1.8, resourceAbundance: 1.5, rareEventProb: 0.3 },
      metaLaws: [
        meta('hc_nuclear', 'Nuclear Weakening',
          'After 30,000 years, nuclear force quietly diminishes, altering chemistry and solar output.',
          'year', 30000, 'gte',
          { nuclearForce: 0.4, resourceAbundance: 0.5, climateStability: 0.3 }, true),
        meta('hc_entropy', 'Entropy Surge',
          'Fifty thousand years in, entropy spikes as the deep law cascade continues.',
          'year', 50000, 'gte',
          { entropy: 3.0, diseaseSpread: 2.5 }, true),
      ],
      centuriesToSimulate: 700,
    },
  },

  {
    id: 'periodic_miracle',
    name: 'Periodic Miracle World',
    tagline: 'Laws that reset every age.',
    description: 'Every epoch, a hidden law restores habitability and improves conditions. Inhabitants periodically experience what seems like divine intervention — but it was always the plan.',
    config: {
      seed: 111,
      laws: { ...baseline, entropy: 1.5, rareEventProb: 1.5, climateStability: 0.7 },
      metaLaws: [
        meta('pm_1', 'First Renewal',
          'The deep law of renewal activates: entropy halves, resources double.',
          'year', 5000, 'gte',
          { entropy: 0.5, resourceAbundance: 2.0, diseaseSpread: 0.5 }, true),
        meta('pm_2', 'Second Renewal',
          'A second scheduled restoration of conditions.',
          'year', 30000, 'gte',
          { entropy: 0.6, climateStability: 2.0, rareEventProb: 0.2 }, true),
        meta('pm_3', 'Third Renewal',
          'The third great renewal — this time cooperation itself deepens.',
          'technology', 5, 'gte',
          { cooperationTendency: 2.5, violenceTendency: 0.3, consciousnessDepth: 2.0 }, true),
      ],
      centuriesToSimulate: 600,
    },
  },

  {
    id: 'no_electricity',
    name: 'Civilisation Without Electricity',
    tagline: 'Forever medieval.',
    description: 'The intelligenceThreshold is extremely high and nuclear/EM constants make electricity impractical. Civilisation can exist but never progresses to industrialism.',
    config: {
      seed: 222,
      laws: {
        ...baseline,
        intelligenceThreshold: 2.5, electromagnetism: 0.3, nuclearForce: 0.5,
        cooperationTendency: 1.3, lifespanMult: 0.8, resourceAbundance: 1.2,
      },
      metaLaws: [],
      centuriesToSimulate: 1500,
    },
  },

  {
    id: 'super_cooperative',
    name: 'Super-Cooperative Humanity',
    tagline: 'War was never in the code.',
    description: 'Cooperation instinct is maximised, violence tendency near zero. Technology advances extraordinarily fast but what does a civilisation without conflict discover about itself?',
    config: {
      seed: 333,
      laws: {
        ...baseline,
        cooperationTendency: 3.0, violenceTendency: 0.05,
        consciousnessDepth: 2.0, intelligenceThreshold: 0.6,
      },
      metaLaws: [],
      centuriesToSimulate: 800,
    },
  },

  {
    id: 'entropy_spike',
    name: 'Entropy Spike Apocalypse',
    tagline: 'The universe forgets itself.',
    description: 'Entropy is set extremely high. Nothing lasts. Buildings, memories, biology — all decay rapidly. Can civilisation bootstrap faster than it crumbles?',
    config: {
      seed: 666,
      laws: {
        ...baseline,
        entropy: 3.5, lifespanMult: 0.3, diseaseSpread: 2.5,
        climateStability: 0.2, resourceAbundance: 0.6,
      },
      metaLaws: [],
      centuriesToSimulate: 600,
    },
  },

  {
    id: 'delayed_metalaw',
    name: 'Delayed Meta-Law Universe',
    tagline: 'Miracles on schedule.',
    description: 'A seemingly normal world — but four hidden meta-laws will fire at different triggers. Each reshapes reality. Inhabitants will believe in divine intervention. The creator knows otherwise.',
    config: {
      seed: 747,
      laws: { ...baseline, consciousnessDepth: 1.5 },
      metaLaws: [
        meta('dm_1', 'The First Miracle: Life Enrichment',
          'When habitability is high enough, a hidden law boosts mutation — life explodes in diversity.',
          'habitability', 0.6, 'gte',
          { mutationRate: 2.5, electromagnetism: 1.4 }, true),
        meta('dm_2', 'The Great Peace',
          'When population exceeds 1B, the cooperation gene activates fully.',
          'population', 1.0, 'gte',
          { cooperationTendency: 2.2, violenceTendency: 0.3 }, true),
        meta('dm_3', 'The Dark Age Trigger',
          'After the industrial revolution, a deep entropy law activates.',
          'technology', 5, 'gte',
          { entropy: 2.2, diseaseSpread: 2.0, rareEventProb: 2.0 }, true),
        meta('dm_4', 'The Final Restoration',
          'Near the end of the simulation, stability returns — as it was always meant to.',
          'year', 80000, 'gte',
          { entropy: 0.4, diseaseSpread: 0.3, cooperationTendency: 2.5 }, true),
      ],
      centuriesToSimulate: 1000,
    },
  },
]

export const DEFAULT_PRESET = PRESETS[0]
