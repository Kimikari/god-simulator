/**
 * Left sidebar: Law Editor
 * Allows the user to set base laws (sliders) and meta-laws (trigger rules).
 * Also exposes preset selector.
 */
import React, { useState } from 'react'
import type { BaseLaws, MetaLaw, LawMeta } from '../types'
import { PRESETS } from '../engine/presets'

// ─── Law metadata for rendering sliders ──────────────────────────────────────
export const LAW_META: LawMeta[] = [
  // Physics
  { key: 'gravity',            label: 'Gravity',              description: 'How strongly the planet holds atmosphere and organisms to the surface.',          min: 0.1, max: 3.0, step: 0.05, unit: '×', category: 'physics' },
  { key: 'electromagnetism',   label: 'Electromagnetism',     description: 'Controls chemical richness and the ease of building complex molecules.',          min: 0.1, max: 3.0, step: 0.05, unit: '×', category: 'physics' },
  { key: 'nuclearForce',       label: 'Nuclear Force',        description: 'Governs stellar energy output, element stability, and radiation levels.',          min: 0.1, max: 3.0, step: 0.05, unit: '×', category: 'physics' },
  { key: 'entropy',            label: 'Entropy Rate',         description: 'The speed at which order decays. High entropy destroys structures and shortens lifespans.', min: 0.1, max: 3.5, step: 0.05, unit: '×', category: 'physics' },
  // Biology
  { key: 'mutationRate',       label: 'Mutation Rate',        description: 'How quickly species evolve. High values produce rapid change but also cancer and instability.', min: 0.0, max: 4.0, step: 0.1, unit: '×', category: 'biology' },
  { key: 'fertilityRate',      label: 'Fertility Rate',       description: 'Baseline reproductive rate. Drives population growth potential.',                 min: 0.1, max: 3.0, step: 0.1, unit: '×', category: 'biology' },
  { key: 'lifespanMult',       label: 'Lifespan',             description: 'Multiplier on typical individual lifespan. Long lives allow accumulated wisdom.',  min: 0.1, max: 5.0, step: 0.1, unit: '×', category: 'biology' },
  { key: 'diseaseSpread',      label: 'Disease Spread',       description: 'Intensity of epidemic events. High spread decimates populations.',                min: 0.0, max: 3.0, step: 0.1, unit: '×', category: 'biology' },
  // Cognition
  { key: 'intelligenceThreshold', label: 'Intelligence Threshold', description: 'How difficult it is for sapience to emerge. High values delay or prevent civilisation.', min: 0.1, max: 3.0, step: 0.1, unit: '×', category: 'cognition' },
  { key: 'cooperationTendency',   label: 'Cooperation',       description: 'Instinct for social bonding and collective action. Drives technology and peace.',  min: 0.0, max: 3.0, step: 0.1, unit: '×', category: 'cognition' },
  { key: 'violenceTendency',      label: 'Violence Tendency', description: 'Aggression instinct. High values cause wars and population crashes.',              min: 0.0, max: 3.0, step: 0.1, unit: '×', category: 'cognition' },
  { key: 'consciousnessDepth',    label: 'Consciousness Depth', description: 'Richness of inner experience. Affects culture, philosophy, and social cohesion.',min: 0.0, max: 2.0, step: 0.1, unit: '×', category: 'cognition' },
  // Environment
  { key: 'resourceAbundance', label: 'Resource Abundance',   description: 'Food, materials, and energy available. Low values cause famine and resource wars.', min: 0.1, max: 3.0, step: 0.1, unit: '×', category: 'environment' },
  { key: 'climateStability',  label: 'Climate Stability',    description: 'Predictability of seasons and weather. Low values cause disruptive oscillations.',  min: 0.0, max: 2.0, step: 0.05, unit: '×', category: 'environment' },
  { key: 'rareEventProb',     label: 'Rare Events',          description: 'Probability of catastrophes like asteroid impacts and supervolcanoes.',             min: 0.0, max: 3.0, step: 0.1, unit: '×', category: 'environment' },
]

const CATEGORY_LABELS: Record<string, string> = {
  physics: 'Physics',
  biology: 'Biology',
  cognition: 'Cognition & Society',
  environment: 'Environment',
}

const CATEGORY_COLORS: Record<string, string> = {
  physics:     'var(--accent-blue)',
  biology:     'var(--accent-green)',
  cognition:   'var(--accent-purple)',
  environment: 'var(--accent-amber)',
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function LawSlider({
  meta, value, onChange,
}: { meta: LawMeta; value: number; onChange: (v: number) => void }) {
  const pct = ((value - meta.min) / (meta.max - meta.min)) * 100
  const color = CATEGORY_COLORS[meta.category]
  const isWarning = (meta.key === 'entropy' && value > 2.5) ||
    (meta.key === 'violenceTendency' && value > 2.0) ||
    (meta.key === 'diseaseSpread' && value > 2.0) ||
    (meta.key === 'rareEventProb' && value > 2.0)

  return (
    <div className="law-slider">
      <div className="law-slider-header">
        <span className="law-label">{meta.label}</span>
        <span className={`law-value ${isWarning ? 'law-value--warn' : ''}`}>
          {value.toFixed(2)}{meta.unit}
        </span>
      </div>
      <input
        type="range"
        min={meta.min} max={meta.max} step={meta.step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ '--pct': `${pct}%`, '--color': color } as React.CSSProperties}
        title={meta.description}
      />
      <p className="law-desc">{meta.description}</p>
    </div>
  )
}

// ─── Meta-law editor ──────────────────────────────────────────────────────────
function MetaLawRow({
  ml, index, onChange, onRemove,
}: {
  ml: MetaLaw
  index: number
  onChange: (updated: MetaLaw) => void
  onRemove: () => void
}) {
  const lawKeys = LAW_META.map(m => m.key)

  return (
    <div className="meta-law-row">
      <div className="meta-law-row-header">
        <input
          className="meta-input meta-input--label"
          value={ml.label}
          onChange={e => onChange({ ...ml, label: e.target.value })}
          placeholder="Rule name"
        />
        <button className="btn-icon" onClick={onRemove} title="Remove">✕</button>
      </div>

      <div className="meta-law-controls">
        <div className="meta-field">
          <label>When</label>
          <select
            value={ml.trigger}
            onChange={e => onChange({ ...ml, trigger: e.target.value as MetaLaw['trigger'] })}
          >
            <option value="year">Year</option>
            <option value="population">Population (B)</option>
            <option value="technology">Tech Level</option>
            <option value="habitability">Habitability</option>
          </select>
        </div>
        <div className="meta-field">
          <label>Is</label>
          <select
            value={ml.triggerComparison}
            onChange={e => onChange({ ...ml, triggerComparison: e.target.value as MetaLaw['triggerComparison'] })}
          >
            <option value="gte">≥</option>
            <option value="lte">≤</option>
          </select>
        </div>
        <div className="meta-field">
          <label>Value</label>
          <input
            type="number"
            className="meta-input"
            value={ml.triggerValue}
            onChange={e => onChange({ ...ml, triggerValue: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="meta-law-effects">
        <label>Then change:</label>
        <div className="meta-effect-row">
          <select
            value={Object.keys(ml.effects)[0] ?? 'entropy'}
            onChange={e => {
              const k = e.target.value as keyof BaseLaws
              const v = Object.values(ml.effects)[0] ?? 0.5
              onChange({ ...ml, effects: { [k]: v } })
            }}
          >
            {lawKeys.map(k => (
              <option key={k} value={k}>{LAW_META.find(m => m.key === k)?.label ?? k}</option>
            ))}
          </select>
          <span>×</span>
          <input
            type="number"
            className="meta-input meta-input--short"
            step={0.1}
            value={Object.values(ml.effects)[0] ?? 0.5}
            onChange={e => {
              const k = (Object.keys(ml.effects)[0] ?? 'entropy') as keyof BaseLaws
              onChange({ ...ml, effects: { [k]: parseFloat(e.target.value) || 0 } })
            }}
          />
        </div>
      </div>

      <label className="meta-hidden-label">
        <input
          type="checkbox"
          checked={ml.hiddenFromInhabitants}
          onChange={e => onChange({ ...ml, hiddenFromInhabitants: e.target.checked })}
        />
        Hidden from inhabitants (appears as "miracle")
      </label>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface LawEditorProps {
  laws: BaseLaws
  metaLaws: MetaLaw[]
  centuriesToSimulate: number
  seed: number
  onLawChange: (k: keyof BaseLaws, v: number) => void
  onMetaLawsChange: (mls: MetaLaw[]) => void
  onCenturiesChange: (n: number) => void
  onSeedChange: (n: number) => void
  onLoadPreset: (id: string) => void
  onBeginCreation: () => void
  isRunning: boolean
}

export function LawEditor({
  laws, metaLaws, centuriesToSimulate, seed,
  onLawChange, onMetaLawsChange, onCenturiesChange, onSeedChange,
  onLoadPreset, onBeginCreation, isRunning,
}: LawEditorProps) {
  const [activeCategory, setActiveCategory] = useState<string>('physics')
  const [tab, setTab] = useState<'laws' | 'meta' | 'presets'>('laws')

  const categories = ['physics', 'biology', 'cognition', 'environment']
  const filteredLaws = LAW_META.filter(m => m.category === activeCategory)

  function addMetaLaw() {
    const newMl: MetaLaw = {
      id: `ml_${Date.now()}`,
      label: 'New Meta-Law',
      description: '',
      trigger: 'year',
      triggerValue: 10000,
      triggerComparison: 'gte',
      effects: { entropy: 0.5 },
      hiddenFromInhabitants: true,
      activated: false,
    }
    onMetaLawsChange([...metaLaws, newMl])
  }

  function updateMetaLaw(index: number, updated: MetaLaw) {
    const next = [...metaLaws]
    next[index] = updated
    onMetaLawsChange(next)
  }

  function removeMetaLaw(index: number) {
    onMetaLawsChange(metaLaws.filter((_, i) => i !== index))
  }

  return (
    <aside className="law-editor">
      <div className="panel-header">
        <h2 className="panel-title">Law Editor</h2>
        <p className="panel-subtitle">Define the rules of your universe</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {(['laws', 'meta', 'presets'] as const).map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'tab-btn--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'laws' ? 'Base Laws' : t === 'meta' ? 'Meta-Laws' : 'Presets'}
          </button>
        ))}
      </div>

      {/* Base Laws tab */}
      {tab === 'laws' && (
        <div className="laws-content">
          <div className="category-tabs">
            {categories.map(c => (
              <button
                key={c}
                className={`cat-btn ${activeCategory === c ? 'cat-btn--active' : ''}`}
                style={{ '--cat-color': CATEGORY_COLORS[c] } as React.CSSProperties}
                onClick={() => setActiveCategory(c)}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          <div className="sliders-list">
            {filteredLaws.map(meta => (
              <LawSlider
                key={meta.key}
                meta={meta}
                value={laws[meta.key]}
                onChange={v => onLawChange(meta.key, v)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Meta-Laws tab */}
      {tab === 'meta' && (
        <div className="meta-content">
          <p className="meta-intro">
            Meta-laws are higher-order rules that modify base laws when triggered.
            Inhabitants may experience their effects as miracles or catastrophes.
          </p>
          <div className="meta-laws-list">
            {metaLaws.length === 0 && (
              <p className="empty-hint">No meta-laws defined. The universe runs on base laws alone.</p>
            )}
            {metaLaws.map((ml, i) => (
              <MetaLawRow
                key={ml.id}
                ml={ml}
                index={i}
                onChange={updated => updateMetaLaw(i, updated)}
                onRemove={() => removeMetaLaw(i)}
              />
            ))}
          </div>
          <button className="btn-add-meta" onClick={addMetaLaw}>
            + Add Meta-Law
          </button>
        </div>
      )}

      {/* Presets tab */}
      {tab === 'presets' && (
        <div className="presets-content">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              className="preset-card"
              onClick={() => onLoadPreset(preset.id)}
            >
              <span className="preset-name">{preset.name}</span>
              <span className="preset-tagline">{preset.tagline}</span>
            </button>
          ))}
        </div>
      )}

      {/* Run config */}
      <div className="run-config">
        <div className="run-config-row">
          <label>Centuries</label>
          <input
            type="number" min={100} max={5000} step={100}
            value={centuriesToSimulate}
            onChange={e => onCenturiesChange(parseInt(e.target.value) || 1000)}
            className="run-input"
          />
        </div>
        <div className="run-config-row">
          <label>Seed</label>
          <input
            type="number"
            value={seed}
            onChange={e => onSeedChange(parseInt(e.target.value) || 0)}
            className="run-input"
          />
        </div>
      </div>

      <button
        className={`btn-create ${isRunning ? 'btn-create--running' : ''}`}
        onClick={onBeginCreation}
        disabled={isRunning}
      >
        {isRunning ? '⏳ Simulating…' : '✦ Begin Creation'}
      </button>
    </aside>
  )
}
