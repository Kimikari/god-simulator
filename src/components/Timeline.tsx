/**
 * Bottom timeline scrubber.
 * Lets the user drag through the simulation history.
 * Event markers appear along the track.
 */
import React, { useRef, useCallback } from 'react'
import type { SimEvent, SimTrace } from '../types'

const EVENT_COLORS: Record<string, string> = {
  milestone: '#a78bfa',
  crisis:    '#f59e0b',
  meta_law:  '#60a5fa',
  miracle:   '#fbbf24',
  collapse:  '#ef4444',
  info:      '#4b5563',
}

interface TimelineProps {
  trace: SimTrace | null
  currentTickIndex: number
  onSeek: (index: number) => void
}

export function Timeline({ trace, currentTickIndex, onSeek }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const seek = useCallback((clientX: number) => {
    if (!trackRef.current || !trace) return
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const idx = Math.round(pct * (trace.states.length - 1))
    onSeek(idx)
  }, [trace, onSeek])

  if (!trace) {
    return (
      <div className="timeline timeline--empty">
        <span className="timeline-hint">Timeline will appear after simulation runs</span>
      </div>
    )
  }

  const total = trace.states.length - 1
  const pct = total > 0 ? (currentTickIndex / total) * 100 : 0
  const currentYear = trace.states[currentTickIndex]?.year ?? 0
  const maxYear     = trace.states[total]?.year ?? 0

  // Milestone events for markers
  const markerEvents = trace.events.filter(
    e => e.type === 'milestone' || e.type === 'collapse' || e.type === 'miracle' || e.type === 'meta_law'
  )

  return (
    <div className="timeline">
      <div className="timeline-labels">
        <span className="tl-year">Year {currentYear.toLocaleString()}</span>
        <span className="tl-title">
          {getEraName(currentYear, trace.states[currentTickIndex])}
        </span>
        <span className="tl-max">Year {maxYear.toLocaleString()}</span>
      </div>

      <div
        ref={trackRef}
        className="timeline-track"
        onMouseDown={e => { e.preventDefault(); seek(e.clientX) }}
        onMouseMove={e => { if (e.buttons === 1) seek(e.clientX) }}
        onClick={e => seek(e.clientX)}
      >
        {/* Filled portion */}
        <div className="timeline-fill" style={{ width: `${pct}%` }} />

        {/* Event markers */}
        {markerEvents.map((event, i) => {
          const eventStateIdx = trace.states.findIndex(s => s.year >= event.year)
          if (eventStateIdx < 0) return null
          const markerPct = (eventStateIdx / total) * 100
          return (
            <div
              key={i}
              className="timeline-marker"
              style={{ left: `${markerPct}%`, background: EVENT_COLORS[event.type] }}
              title={`Year ${event.year.toLocaleString()}: ${event.title}`}
              onClick={e => { e.stopPropagation(); onSeek(eventStateIdx) }}
            />
          )
        })}

        {/* Scrubber thumb */}
        <div className="timeline-thumb" style={{ left: `${pct}%` }} />
      </div>

      <div className="timeline-legend">
        {Object.entries(EVENT_COLORS).filter(([k]) => k !== 'info').map(([type, color]) => (
          <span key={type} className="tl-legend-item">
            <span className="tl-legend-dot" style={{ background: color }} />
            {type.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  )
}

function getEraName(year: number, state: any): string {
  if (!state) return ''
  if (!state.lifeExists) return 'Lifeless World'
  if (!state.civilizationExists) {
    if (state.intelligence < 1) return 'Age of Microbes'
    if (state.intelligence < 3) return 'Age of Creatures'
    return 'Age of Pre-Civilization'
  }
  const tech = state.technologyLevel as number
  if (tech < 1)  return 'Primitive Age'
  if (tech < 2)  return 'Ancient Age'
  if (tech < 3)  return 'Classical Age'
  if (tech < 4)  return 'Medieval Age'
  if (tech < 5)  return 'Early Modern Age'
  if (tech < 6)  return 'Industrial Age'
  if (tech < 7)  return 'Electrical Age'
  if (tech < 8)  return 'Digital Age'
  if (tech < 9)  return 'Advanced Age'
  return 'Post-Scarcity Age'
}
