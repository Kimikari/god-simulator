import { useState, useCallback, useRef } from 'react'
import type { SimConfig, SimTrace, BaseLaws, MetaLaw } from '../types'
import { runSimulation } from '../engine/SimEngine'
import { DEFAULT_PRESET } from '../engine/presets'

export interface SimulationState {
  config: SimConfig
  trace: SimTrace | null
  isRunning: boolean
  currentTickIndex: number
  error: string | null
}

export function useSimulation() {
  const [state, setState] = useState<SimulationState>({
    config: { ...DEFAULT_PRESET.config },
    trace: null,
    isRunning: false,
    currentTickIndex: 0,
    error: null,
  })

  // Use a ref for the config so callbacks don't close over stale values
  const configRef = useRef(state.config)
  configRef.current = state.config

  const updateLaws = useCallback((updates: Partial<BaseLaws>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, laws: { ...prev.config.laws, ...updates } },
    }))
  }, [])

  const updateMetaLaws = useCallback((metaLaws: MetaLaw[]) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, metaLaws },
    }))
  }, [])

  const updateConfig = useCallback((updates: Partial<SimConfig>) => {
    setState(prev => ({ ...prev, config: { ...prev.config, ...updates } }))
  }, [])

  const loadPresetConfig = useCallback((config: SimConfig) => {
    setState(prev => ({ ...prev, config: { ...config }, trace: null, currentTickIndex: 0 }))
  }, [])

  const beginCreation = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: true, error: null }))
    // Run in a timeout so the UI can update (show loading state) before the computation
    setTimeout(() => {
      try {
        const trace = runSimulation(configRef.current)
        setState(prev => ({
          ...prev,
          trace,
          isRunning: false,
          currentTickIndex: trace.states.length - 1,
        }))
      } catch (e) {
        setState(prev => ({
          ...prev,
          isRunning: false,
          error: String(e),
        }))
      }
    }, 50)
  }, [])

  const setTickIndex = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      currentTickIndex: Math.max(0, Math.min(index, (prev.trace?.states.length ?? 1) - 1)),
    }))
  }, [])

  const reset = useCallback(() => {
    setState(prev => ({ ...prev, trace: null, currentTickIndex: 0 }))
  }, [])

  // Convenience: current world state at the scrubber position
  const currentState = state.trace?.states[state.currentTickIndex] ?? null
  const currentEvents = state.trace?.events.filter(
    e => state.trace && e.year <= (state.trace.states[state.currentTickIndex]?.year ?? 0)
  ) ?? []

  return {
    ...state,
    currentState,
    currentEvents,
    updateLaws,
    updateMetaLaws,
    updateConfig,
    loadPresetConfig,
    beginCreation,
    setTickIndex,
    reset,
  }
}
