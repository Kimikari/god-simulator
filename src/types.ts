// ─── Core law definitions ────────────────────────────────────────────────────
// Each value is a multiplier relative to Earth-like baseline (1.0)
export interface BaseLaws {
  // Physics
  gravity: number;             // 0.1–3.0  | affects atmosphere, organism size, tectonics
  electromagnetism: number;    // 0.1–3.0  | affects chemistry richness, life emergence speed
  nuclearForce: number;        // 0.1–3.0  | affects stellar output, element stability, radiation
  entropy: number;             // 0.1–3.0  | rate of decay; low = long-lasting structures

  // Biology
  mutationRate: number;        // 0.0–3.0  | speed of evolution, cancer risk
  fertilityRate: number;       // 0.1–3.0  | population growth potential
  lifespanMult: number;        // 0.1–5.0  | multiplier on base lifespan
  diseaseSpread: number;       // 0.0–3.0  | epidemic intensity

  // Cognition & society
  intelligenceThreshold: number; // 0.1–3.0 | how hard it is for sapience to emerge
  cooperationTendency: number;   // 0.0–2.0 | social bonding instinct
  violenceTendency: number;      // 0.0–2.0 | aggression instinct
  consciousnessDepth: number;    // 0.0–2.0 | richness of inner experience

  // Environment
  resourceAbundance: number;   // 0.1–3.0  | food, materials, energy availability
  climateStability: number;    // 0.0–2.0  | predictability of seasons and weather
  rareEventProb: number;       // 0.0–2.0  | probability of asteroid impacts, supervolcanoes, etc.
}

// ─── Meta-laws (higher-order laws that modify base laws over time) ───────────
export type TriggerType = 'year' | 'population' | 'technology' | 'habitability' | 'epoch';

export interface MetaLaw {
  id: string;
  label: string;
  description: string;
  // What causes this meta-law to activate
  trigger: TriggerType;
  triggerValue: number;
  triggerComparison: 'gte' | 'lte'; // ≥ or ≤
  // What it changes (each value is a multiplier applied to the current law value)
  effects: Partial<Record<keyof BaseLaws, number>>;
  // Whether inhabitants can observe this law directly
  hiddenFromInhabitants: boolean;
  // Whether this meta-law has fired in the current run
  activated: boolean;
  activatedAtYear?: number;
}

// ─── World state at a single point in time ───────────────────────────────────
export interface WorldState {
  year: number;                   // years since start of simulation
  // Planet
  temperature: number;            // Celsius, habitable range ≈ -20 to +60
  atmosphereRetention: number;    // 0–1; how thick and life-supporting the atmosphere is
  oceanCoverage: number;          // 0–1
  habitability: number;           // 0–1; composite index
  // Biology
  lifeExists: boolean;
  biodiversity: number;           // 0–1
  // Civilization
  civilizationExists: boolean;
  population: number;             // billions
  technologyLevel: number;        // 0–10 (0=none, 3=agriculture, 5=industry, 7=digital, 10=advanced)
  intelligence: number;           // 0–10 emergent sapience scale
  avgLifespan: number;            // years
  // Society
  resourceAbundance: number;      // 0–1 actual available resources (affected by consumption)
  conflictLevel: number;          // 0–1
  cooperationLevel: number;       // 0–1
  // Health
  diseaseRate: number;            // 0–1 active epidemic burden
  // Risk
  extinctionRisk: number;         // 0–1 per-century extinction probability
  // Active effective laws (after meta-laws applied)
  effectiveLaws: BaseLaws;
}

// ─── Events emitted during simulation ────────────────────────────────────────
export type EventType = 'milestone' | 'crisis' | 'meta_law' | 'miracle' | 'collapse' | 'info';

export interface SimEvent {
  year: number;
  type: EventType;
  title: string;
  // What inhabitants observe / experience
  inhabitantView: string;
  // What the creator (god) knows caused it
  creatorView: string;
  // Which meta-law caused this (if any)
  metaLawId?: string;
}

// ─── Full output of one simulation run ───────────────────────────────────────
export interface SimTrace {
  // One snapshot per tick (century)
  states: WorldState[];
  events: SimEvent[];
  activatedMetaLaws: MetaLaw[];
  summary: SimSummary;
}

export interface SimSummary {
  universeDescription: string;
  earthConditions: string;
  humanityFate: string;
  majorTurningPoints: string[];
  inhabitantBeliefs: string;
  creatorKnowledge: string;
  outcome: 'flourishing' | 'collapsed' | 'never_emerged' | 'extinct' | 'transcendent';
}

// ─── Configuration for a simulation run ──────────────────────────────────────
export interface SimConfig {
  seed: number;
  laws: BaseLaws;
  metaLaws: MetaLaw[];
  centuriesToSimulate: number; // number of 100-year ticks
  presetName?: string;
}

// ─── Preset ───────────────────────────────────────────────────────────────────
export interface Preset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  config: SimConfig;
}

// ─── Law parameter metadata for the editor UI ────────────────────────────────
export interface LawMeta {
  key: keyof BaseLaws;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  category: 'physics' | 'biology' | 'cognition' | 'environment';
}
