/**
 * God Simulator — Root application component.
 *
 * Inspired by Charles Babbage's insight (Ninth Bridgewater Treatise, 1837):
 * a universe may appear stable for millennia, then undergo dramatic change —
 * yet both the stability and the change may be consequences of a single,
 * deeper law written in from the very beginning.
 *
 * Layout:
 *   Left sidebar  — Law Editor (base laws + meta-laws + presets)
 *   Center        — Simulation View (planet, charts, summary)
 *   Right sidebar — Dual Perspective Panel (inhabitant vs. creator)
 *   Bottom        — Timeline scrubber
 */
import React from 'react'
import { LawEditor } from './components/LawEditor'
import { SimView } from './components/SimView'
import { PerspectivePanel } from './components/PerspectivePanel'
import { Timeline } from './components/Timeline'
import { useSimulation } from './hooks/useSimulation'
import { PRESETS } from './engine/presets'
import type { BaseLaws } from './types'

export default function App() {
  const sim = useSimulation()

  function handleLoadPreset(id: string) {
    const preset = PRESETS.find(p => p.id === id)
    if (preset) sim.loadPresetConfig(preset.config)
  }

  return (
    <div className="app">
      {/* ── Top header bar ─────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">⊕</span>
          <div>
            <h1 className="header-title">God Simulator</h1>
            <p className="header-sub">
              Design the laws. Witness the consequences.
            </p>
          </div>
        </div>
        <div className="header-center">
          {sim.config.presetName && (
            <span className="header-preset-badge">{sim.config.presetName}</span>
          )}
        </div>
        <div className="header-right">
          {sim.trace && (
            <div
              className={`header-outcome header-outcome--${sim.trace.summary.outcome}`}
            >
              {sim.trace.summary.outcome.replace('_', ' ')}
            </div>
          )}
          {sim.trace && (
            <button className="btn-header" onClick={sim.reset}>
              Reset
            </button>
          )}
        </div>
      </header>

      {/* ── Main three-column body ──────────────────────────────────────── */}
      <main className="app-body">
        <LawEditor
          laws={sim.config.laws}
          metaLaws={sim.config.metaLaws}
          centuriesToSimulate={sim.config.centuriesToSimulate}
          seed={sim.config.seed}
          onLawChange={(k: keyof BaseLaws, v: number) => sim.updateLaws({ [k]: v } as Partial<BaseLaws>)}
          onMetaLawsChange={sim.updateMetaLaws}
          onCenturiesChange={n => sim.updateConfig({ centuriesToSimulate: n })}
          onSeedChange={n => sim.updateConfig({ seed: n })}
          onLoadPreset={handleLoadPreset}
          onBeginCreation={sim.beginCreation}
          isRunning={sim.isRunning}
        />

        <SimView
          trace={sim.trace}
          currentState={sim.currentState}
          isRunning={sim.isRunning}
        />

        <PerspectivePanel
          trace={sim.trace}
          currentEvents={sim.currentEvents}
        />
      </main>

      {/* ── Bottom timeline ─────────────────────────────────────────────── */}
      <footer className="app-footer">
        <Timeline
          trace={sim.trace}
          currentTickIndex={sim.currentTickIndex}
          onSeek={sim.setTickIndex}
        />
      </footer>

      {sim.error && (
        <div className="error-toast">
          Simulation error: {sim.error}
        </div>
      )}
    </div>
  )
}
