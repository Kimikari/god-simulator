/**
 * Right sidebar: Dual Perspective Panel
 *
 * Inhabitant View — what people inside the world observe and believe.
 * Creator View    — what the god/designer actually knows about causation.
 *
 * This embodies Babbage's insight: the same event can appear miraculous
 * from within while being entirely lawful from without.
 */
import React, { useState } from 'react'
import type { SimEvent, SimTrace, MetaLaw } from '../types'

// ─── Event item ───────────────────────────────────────────────────────────────
function EventItem({
  event, perspective,
}: { event: SimEvent; perspective: 'inhabitant' | 'creator' }) {
  const [expanded, setExpanded] = useState(false)

  const typeConfig: Record<string, { icon: string; color: string }> = {
    milestone: { icon: '◆', color: '#a78bfa' },
    crisis:    { icon: '⚠', color: '#f59e0b' },
    meta_law:  { icon: '⟳', color: '#60a5fa' },
    miracle:   { icon: '✦', color: '#fbbf24' },
    collapse:  { icon: '☄', color: '#ef4444' },
    info:      { icon: '●', color: '#6b7280' },
  }
  const cfg = typeConfig[event.type] ?? typeConfig.info

  const text = perspective === 'inhabitant' ? event.inhabitantView : event.creatorView
  const isMiracle = event.type === 'miracle' && perspective === 'inhabitant'

  return (
    <div
      className={`event-item event-item--${event.type} ${isMiracle ? 'event-item--miracle' : ''}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="event-header">
        <span className="event-icon" style={{ color: cfg.color }}>{cfg.icon}</span>
        <div className="event-meta">
          <span className="event-title">{event.title}</span>
          <span className="event-year">Year {event.year.toLocaleString()}</span>
        </div>
      </div>
      {expanded && <p className="event-body">{text}</p>}
    </div>
  )
}

// ─── Inhabitant view ──────────────────────────────────────────────────────────
function InhabitantView({ events, summary }: { events: SimEvent[]; summary: SimTrace['summary'] }) {
  return (
    <div className="perspective-section">
      <div className="perspective-label perspective-label--inhabitant">
        <span className="perspective-eye">👁</span>
        <div>
          <h4>Inhabitant View</h4>
          <p>What people <em>inside</em> the world observe</p>
        </div>
      </div>

      <div className="belief-box">
        <p className="belief-text">{summary.inhabitantBeliefs}</p>
      </div>

      <div className="events-list">
        {events.length === 0 && <p className="no-events">No events yet.</p>}
        {[...events].reverse().map((e, i) => (
          <EventItem key={`${e.year}-${i}`} event={e} perspective="inhabitant" />
        ))}
      </div>
    </div>
  )
}

// ─── Creator view ─────────────────────────────────────────────────────────────
function CreatorView({
  events, summary, activatedMetaLaws,
}: { events: SimEvent[]; summary: SimTrace['summary']; activatedMetaLaws: MetaLaw[] }) {
  return (
    <div className="perspective-section">
      <div className="perspective-label perspective-label--creator">
        <span className="perspective-eye">⊕</span>
        <div>
          <h4>Creator View</h4>
          <p>What the designer <em>knows</em> is true</p>
        </div>
      </div>

      <div className="creator-knowledge-box">
        <p className="belief-text">{summary.creatorKnowledge}</p>
      </div>

      {activatedMetaLaws.length > 0 && (
        <div className="meta-law-trace">
          <h5 className="trace-title">Meta-Laws That Fired</h5>
          {activatedMetaLaws.map(ml => (
            <div key={ml.id} className="meta-trace-item">
              <div className="meta-trace-header">
                <span className="meta-trace-icon">{ml.hiddenFromInhabitants ? '🔒' : '📖'}</span>
                <span className="meta-trace-label">{ml.label}</span>
                <span className="meta-trace-year">yr {ml.activatedAtYear?.toLocaleString()}</span>
              </div>
              <p className="meta-trace-desc">{ml.description}</p>
              <div className="meta-trace-effects">
                {Object.entries(ml.effects).map(([k, v]) => (
                  <span key={k} className="meta-trace-effect">
                    {k} × {v}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="events-list">
        {events.length === 0 && <p className="no-events">No events yet.</p>}
        {[...events].reverse().map((e, i) => (
          <EventItem key={`${e.year}-${i}`} event={e} perspective="creator" />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface PerspectivePanelProps {
  trace: SimTrace | null
  currentEvents: SimEvent[]
}

export function PerspectivePanel({ trace, currentEvents }: PerspectivePanelProps) {
  const [tab, setTab] = useState<'inhabitant' | 'creator'>('inhabitant')

  if (!trace) {
    return (
      <aside className="perspective-panel perspective-panel--empty">
        <p className="perspective-hint">
          Run a simulation to see the dual perspective — what inhabitants experience vs. what the creator knows.
        </p>
        <blockquote className="babbage-quote">
          "The works of the Creator, though they excite our admiration, do not
          violate those laws which our reason assures us the Almighty has impressed
          upon matter."
          <cite>— Charles Babbage, 1837</cite>
        </blockquote>
      </aside>
    )
  }

  const summary = trace.summary

  return (
    <aside className="perspective-panel">
      <div className="perspective-tabs">
        <button
          className={`persp-tab ${tab === 'inhabitant' ? 'persp-tab--active' : ''}`}
          onClick={() => setTab('inhabitant')}
        >
          Inhabitant
        </button>
        <button
          className={`persp-tab ${tab === 'creator' ? 'persp-tab--active' : ''}`}
          onClick={() => setTab('creator')}
        >
          Creator
        </button>
      </div>

      <div className="perspective-content">
        {tab === 'inhabitant'
          ? <InhabitantView events={currentEvents} summary={summary} />
          : <CreatorView events={currentEvents} summary={summary} activatedMetaLaws={trace.activatedMetaLaws} />
        }
      </div>
    </aside>
  )
}
