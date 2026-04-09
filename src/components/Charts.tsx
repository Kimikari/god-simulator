/**
 * Chart visualizations for simulation trace data.
 * Uses Recharts for rendering.
 */
import React from 'react'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { WorldState } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(year: number) {
  if (year >= 100000) return `${(year / 1000).toFixed(0)}ky`
  if (year >= 1000)   return `${(year / 1000).toFixed(1)}ky`
  return `${year}`
}

const GRID_COLOR = 'rgba(255,255,255,0.04)'
const AXIS_COLOR = 'rgba(255,255,255,0.25)'

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-year">Year {label?.toLocaleString()}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  )
}

// Downsample states for performance (max 250 points)
function downsample(states: WorldState[], max = 250): WorldState[] {
  if (states.length <= max) return states
  const step = Math.ceil(states.length / max)
  return states.filter((_, i) => i % step === 0 || i === states.length - 1)
}

// ─── Population & Tech chart ──────────────────────────────────────────────────
export function PopTechChart({ states }: { states: WorldState[] }) {
  const data = downsample(states).map(s => ({
    year: s.year,
    Population: +s.population.toFixed(3),
    Technology: +s.technologyLevel.toFixed(2),
  }))

  return (
    <div className="chart-card">
      <h4 className="chart-title">Population (B) & Technology</h4>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="year" tickFormatter={fmt} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <YAxis yAxisId="pop" tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <YAxis yAxisId="tech" orientation="right" domain={[0, 10]} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }} />
          <Line yAxisId="pop" type="monotone" dataKey="Population" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
          <Line yAxisId="tech" type="monotone" dataKey="Technology" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Habitability & Temperature ───────────────────────────────────────────────
export function HabitabilityChart({ states }: { states: WorldState[] }) {
  const data = downsample(states).map(s => ({
    year: s.year,
    Habitability: +s.habitability.toFixed(3),
    Temp: +s.temperature.toFixed(1),
  }))

  return (
    <div className="chart-card">
      <h4 className="chart-title">Habitability & Temperature</h4>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="year" tickFormatter={fmt} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <YAxis yAxisId="hab" domain={[0, 1]} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <YAxis yAxisId="temp" orientation="right" tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }} />
          <Line yAxisId="hab" type="monotone" dataKey="Habitability" stroke="#34d399" strokeWidth={1.5} dot={false} />
          <Line yAxisId="temp" type="monotone" dataKey="Temp" stroke="#f87171" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Conflict & Cooperation ───────────────────────────────────────────────────
export function SocietyChart({ states }: { states: WorldState[] }) {
  const data = downsample(states).filter(s => s.civilizationExists).map(s => ({
    year: s.year,
    Conflict: +s.conflictLevel.toFixed(3),
    Cooperation: +s.cooperationLevel.toFixed(3),
    Disease: +s.diseaseRate.toFixed(3),
  }))
  if (data.length < 2) return null

  return (
    <div className="chart-card">
      <h4 className="chart-title">Conflict, Cooperation & Disease</h4>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="year" tickFormatter={fmt} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <YAxis domain={[0, 1]} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }} />
          <Area type="monotone" dataKey="Cooperation" stroke="#34d399" fill="#34d39922" strokeWidth={1.5} />
          <Area type="monotone" dataKey="Conflict" stroke="#f87171" fill="#f8717122" strokeWidth={1.5} />
          <Area type="monotone" dataKey="Disease" stroke="#fb923c" fill="#fb923c22" strokeWidth={1} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Biodiversity & Intelligence ──────────────────────────────────────────────
export function EvolutionChart({ states }: { states: WorldState[] }) {
  const data = downsample(states).map(s => ({
    year: s.year,
    Biodiversity: +s.biodiversity.toFixed(3),
    Intelligence: +(s.intelligence / 10).toFixed(3),
  }))

  return (
    <div className="chart-card">
      <h4 className="chart-title">Biodiversity & Intelligence (normalised)</h4>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="year" tickFormatter={fmt} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <YAxis domain={[0, 1]} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }} />
          <Area type="monotone" dataKey="Biodiversity" stroke="#a78bfa" fill="#a78bfa22" strokeWidth={1.5} />
          <Area type="monotone" dataKey="Intelligence" stroke="#f59e0b" fill="#f59e0b22" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Resources & Extinction risk ─────────────────────────────────────────────
export function ResourceRiskChart({ states }: { states: WorldState[] }) {
  const data = downsample(states).map(s => ({
    year: s.year,
    Resources: +Math.min(s.resourceAbundance, 3).toFixed(3),
    ExtinctionRisk: +s.extinctionRisk.toFixed(3),
  }))

  return (
    <div className="chart-card">
      <h4 className="chart-title">Resources & Extinction Risk</h4>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="year" tickFormatter={fmt} tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <YAxis tick={{ fill: AXIS_COLOR, fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }} />
          <Line type="monotone" dataKey="Resources" stroke="#4ade80" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="ExtinctionRisk" stroke="#ef4444" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
