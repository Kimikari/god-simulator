/**
 * Center panel: Simulation View
 * Shows world status dashboard and charts.
 */
import React, { useState } from 'react'
import type { WorldState, SimTrace } from '../types'
import { PopTechChart, HabitabilityChart, SocietyChart, EvolutionChart, ResourceRiskChart } from './Charts'

// ─── Status card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, unit = '', color = 'var(--text-primary)', sub,
}: {
  label: string; value: string | number; unit?: string; color?: string; sub?: string
}) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color }}>{value}<span className="stat-unit">{unit}</span></span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

// ─── Outcome badge ────────────────────────────────────────────────────────────
const OUTCOME_STYLES: Record<string, { color: string; icon: string }> = {
  flourishing:   { color: '#34d399', icon: '🌍' },
  transcendent:  { color: '#a78bfa', icon: '✦' },
  collapsed:     { color: '#f87171', icon: '☄' },
  extinct:       { color: '#ef4444', icon: '☠' },
  never_emerged: { color: '#6b7280', icon: '○' },
}

// ─── World status bar ─────────────────────────────────────────────────────────
function WorldStatusBar({ state }: { state: WorldState }) {
  const hab = state.habitability
  const habColor = hab > 0.6 ? '#34d399' : hab > 0.35 ? '#f59e0b' : '#ef4444'

  return (
    <div className="world-status-bar">
      <StatCard label="Year" value={state.year.toLocaleString()} color="var(--accent-amber)" />
      <StatCard label="Temperature" value={state.temperature.toFixed(0)} unit="°C"
        color={state.temperature > 60 ? '#ef4444' : state.temperature < -10 ? '#60a5fa' : '#34d399'} />
      <StatCard label="Habitability" value={(state.habitability * 100).toFixed(0)} unit="%" color={habColor} />
      <StatCard label="Life" value={state.lifeExists ? 'Present' : 'Absent'}
        color={state.lifeExists ? '#4ade80' : '#6b7280'} />
      <StatCard label="Population" value={state.civilizationExists ? state.population.toFixed(2) : '—'} unit="B"
        color={state.civilizationExists ? '#60a5fa' : '#6b7280'} />
      <StatCard label="Tech Level" value={state.technologyLevel.toFixed(1)} unit="/10"
        color="#a78bfa"
        sub={techName(state.technologyLevel)} />
      <StatCard label="Lifespan" value={state.avgLifespan > 0 ? state.avgLifespan.toFixed(0) : '—'} unit=" yr" />
      <StatCard label="Conflict" value={(state.conflictLevel * 100).toFixed(0)} unit="%"
        color={state.conflictLevel > 0.6 ? '#ef4444' : state.conflictLevel > 0.35 ? '#f59e0b' : '#34d399'} />
    </div>
  )
}

function techName(lvl: number): string {
  if (lvl < 0.5)  return 'Pre-life'
  if (lvl < 1)    return 'Stone Age'
  if (lvl < 2)    return 'Ancient'
  if (lvl < 3)    return 'Classical'
  if (lvl < 4)    return 'Medieval'
  if (lvl < 5)    return 'Early Modern'
  if (lvl < 6)    return 'Industrial'
  if (lvl < 7)    return 'Electrical'
  if (lvl < 8)    return 'Digital'
  if (lvl < 9)    return 'Advanced'
  return 'Post-Scarcity'
}

// ─── Summary panel ────────────────────────────────────────────────────────────
function SummaryView({ trace }: { trace: SimTrace }) {
  const s = trace.summary
  const style = OUTCOME_STYLES[s.outcome] ?? OUTCOME_STYLES.collapsed
  return (
    <div className="summary-panel">
      <div className="summary-outcome" style={{ borderColor: style.color }}>
        <span className="summary-icon">{style.icon}</span>
        <span className="summary-outcome-label" style={{ color: style.color }}>
          {s.outcome.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <div className="summary-blocks">
        <div className="summary-block">
          <h5>Universe</h5>
          <p>{s.universeDescription}</p>
        </div>
        <div className="summary-block">
          <h5>Earth Conditions</h5>
          <p>{s.earthConditions}</p>
        </div>
        <div className="summary-block">
          <h5>Humanity's Fate</h5>
          <p>{s.humanityFate}</p>
        </div>
        <div className="summary-block">
          <h5>Major Turning Points</h5>
          {s.majorTurningPoints.length === 0
            ? <p>None recorded.</p>
            : <ul>{s.majorTurningPoints.map((t, i) => <li key={i}>{t}</li>)}</ul>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface SimViewProps {
  trace: SimTrace | null
  currentState: WorldState | null
  isRunning: boolean
}

export function SimView({ trace, currentState, isRunning }: SimViewProps) {
  const [tab, setTab] = useState<'dashboard' | 'charts' | 'summary'>('dashboard')

  if (isRunning) {
    return (
      <div className="sim-view sim-view--loading">
        <div className="loading-cosmic">
          <div className="loading-spinner" />
          <p>Speaking the laws into existence…</p>
          <p className="loading-sub">Computing the deep structure of reality.</p>
        </div>
      </div>
    )
  }

  if (!trace || !currentState) {
    return (
      <div className="sim-view sim-view--empty">
        <div className="empty-cosmic">
          <div className="empty-orb" />
          <h3>In the beginning, there was nothing.</h3>
          <p>Set the laws of your universe in the left panel,<br />then speak them into existence.</p>
          <p className="empty-sub">
            "The Almighty Author prefers the high and general to the limited and local."<br />
            <em>— Charles Babbage, Ninth Bridgewater Treatise, 1837</em>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="sim-view">
      <WorldStatusBar state={currentState} />

      <div className="sim-tab-bar">
        {(['dashboard', 'charts', 'summary'] as const).map(t => (
          <button
            key={t}
            className={`sim-tab-btn ${tab === t ? 'sim-tab-btn--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="sim-content">
        {tab === 'dashboard' && (
          <div className="dashboard-grid">
            <div className="planet-card">
              <div className="planet-visual">
                <div
                  className="planet-body"
                  style={{
                    background: planetGradient(currentState),
                    boxShadow: `0 0 ${40 + currentState.habitability * 60}px ${planetGlowColor(currentState)}`,
                  }}
                >
                  {currentState.lifeExists && <div className="planet-life-ring" />}
                </div>
                {currentState.atmosphereRetention > 0.4 && (
                  <div className="planet-atmosphere"
                    style={{ opacity: currentState.atmosphereRetention * 0.4 }} />
                )}
              </div>
              <div className="planet-info">
                <div className="planet-stat">
                  <span>Atmosphere</span>
                  <ProgressBar value={currentState.atmosphereRetention} color="#60a5fa" />
                </div>
                <div className="planet-stat">
                  <span>Ocean Coverage</span>
                  <ProgressBar value={Math.max(0, currentState.oceanCoverage)} color="#3b82f6" />
                </div>
                <div className="planet-stat">
                  <span>Biodiversity</span>
                  <ProgressBar value={currentState.biodiversity} color="#4ade80" />
                </div>
                <div className="planet-stat">
                  <span>Intelligence</span>
                  <ProgressBar value={currentState.intelligence / 10} color="#f59e0b" />
                </div>
                <div className="planet-stat">
                  <span>Extinction Risk</span>
                  <ProgressBar value={currentState.extinctionRisk} color="#ef4444" />
                </div>
              </div>
            </div>

            <div className="mini-charts">
              <PopTechChart states={trace.states} />
              <HabitabilityChart states={trace.states} />
            </div>
          </div>
        )}

        {tab === 'charts' && (
          <div className="charts-grid">
            <PopTechChart states={trace.states} />
            <HabitabilityChart states={trace.states} />
            <EvolutionChart states={trace.states} />
            <SocietyChart states={trace.states} />
            <ResourceRiskChart states={trace.states} />
          </div>
        )}

        {tab === 'summary' && <SummaryView trace={trace} />}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }} />
    </div>
  )
}

function planetGradient(s: WorldState): string {
  if (!s.lifeExists) {
    if (s.temperature < -50) return 'radial-gradient(circle at 35% 35%, #8ab4c7, #334a5a, #1a2a35)'
    if (s.temperature > 100) return 'radial-gradient(circle at 35% 35%, #c87941, #7a3a10, #3a1a00)'
    return 'radial-gradient(circle at 35% 35%, #8a7a6a, #4a4030, #201a10)'
  }
  const greenness = Math.min(s.biodiversity * 1.5, 1)
  const blueness  = Math.min(s.oceanCoverage, 1)
  const g = Math.floor(greenness * 100)
  const b = Math.floor(blueness * 80)
  return `radial-gradient(circle at 35% 35%, rgb(${40 + g}, ${80 + g}, ${40 + b}), rgb(${20}, ${50 + g/2}, ${60 + b}), #0a1a20)`
}

function planetGlowColor(s: WorldState): string {
  if (!s.lifeExists) return 'rgba(80,80,80,0.3)'
  if (s.habitability > 0.7) return 'rgba(52,211,153,0.4)'
  if (s.habitability > 0.4) return 'rgba(96,165,250,0.3)'
  return 'rgba(239,68,68,0.3)'
}
