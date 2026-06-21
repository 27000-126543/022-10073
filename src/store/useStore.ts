import { create } from 'zustand'
import type { UserAnswer, ScoreResult } from '@/data/types'
import { calculateScore } from '@/data/scoring'

interface AppState {
  selectedScenarioId: string | null
  currentEventIndex: number
  answers: UserAnswer[]
  scoreResult: ScoreResult | null
  selectScenario: (id: string) => void
  setEventIndex: (index: number) => void
  submitAnswer: (eventId: string, actionIndex: number, reason: string) => void
  calculateResult: () => void
  reset: () => void
}

export const useStore = create<AppState>((set, get) => ({
  selectedScenarioId: null,
  currentEventIndex: 0,
  answers: [],
  scoreResult: null,

  selectScenario: (id) =>
    set({
      selectedScenarioId: id,
      currentEventIndex: 0,
      answers: [],
      scoreResult: null,
    }),

  setEventIndex: (index) => set({ currentEventIndex: index }),

  submitAnswer: (eventId, actionIndex, reason) => {
    const answers = [...get().answers]
    const existing = answers.findIndex((a) => a.eventId === eventId)
    if (existing >= 0) {
      answers[existing] = { eventId, selectedActionIndex: actionIndex, reason }
    } else {
      answers.push({ eventId, selectedActionIndex: actionIndex, reason })
    }
    set({ answers })
  },

  calculateResult: () => {
    const { selectedScenarioId, answers } = get()
    if (!selectedScenarioId) return
    const scoreResult = calculateScore(selectedScenarioId, answers)
    set({ scoreResult })
  },

  reset: () =>
    set({
      selectedScenarioId: null,
      currentEventIndex: 0,
      answers: [],
      scoreResult: null,
    }),
}))
