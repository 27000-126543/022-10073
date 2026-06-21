import { create } from 'zustand'
import type { UserAnswer, ScoreResult, TrainingRecord, InProgressState } from '@/data/types'
import { calculateScore } from '@/data/scoring'
import { scenarios } from '@/data/scenarios'

const STORAGE_KEY_IN_PROGRESS = 'pz-training-in-progress'
const STORAGE_KEY_RECORDS = 'pz-training-records'
const MAX_RECORDS = 10

function loadInProgress(): InProgressState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_IN_PROGRESS)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveInProgress(state: InProgressState | null) {
  try {
    if (state) {
      localStorage.setItem(STORAGE_KEY_IN_PROGRESS, JSON.stringify(state))
    } else {
      localStorage.removeItem(STORAGE_KEY_IN_PROGRESS)
    }
  } catch {
    // ignore
  }
}

function loadRecords(): TrainingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveRecords(records: TrainingRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records.slice(0, MAX_RECORDS)))
  } catch {
    // ignore
  }
}

interface AppState {
  selectedScenarioId: string | null
  currentEventIndex: number
  answers: UserAnswer[]
  scoreResult: ScoreResult | null
  trainingRecords: TrainingRecord[]
  inProgressState: InProgressState | null
  selectedRecordId: string | null

  selectScenario: (id: string, resume?: boolean) => void
  setEventIndex: (index: number) => void
  submitAnswer: (eventId: string, actionIndex: number, reason: string) => void
  saveProgress: () => void
  clearInProgress: () => void
  calculateResult: () => void
  saveTrainingRecord: () => void
  loadTrainingRecord: (recordId: string) => void
  reset: () => void
  initFromStorage: () => void
}

export const useStore = create<AppState>((set, get) => ({
  selectedScenarioId: null,
  currentEventIndex: 0,
  answers: [],
  scoreResult: null,
  trainingRecords: [],
  inProgressState: null,
  selectedRecordId: null,

  selectScenario: (id, resume = false) => {
    const inProgress = resume ? loadInProgress() : null
    const shouldResume = resume && inProgress && inProgress.scenarioId === id

    set({
      selectedScenarioId: id,
      currentEventIndex: shouldResume ? inProgress!.currentEventIndex : 0,
      answers: shouldResume ? inProgress!.answers : [],
      scoreResult: null,
      selectedRecordId: null,
    })
  },

  setEventIndex: (index) => {
    set({ currentEventIndex: index })
    get().saveProgress()
  },

  submitAnswer: (eventId, actionIndex, reason) => {
    const answers = [...get().answers]
    const existing = answers.findIndex((a) => a.eventId === eventId)
    if (existing >= 0) {
      answers[existing] = { eventId, selectedActionIndex: actionIndex, reason }
    } else {
      answers.push({ eventId, selectedActionIndex: actionIndex, reason })
    }
    set({ answers })
    get().saveProgress()
  },

  saveProgress: () => {
    const { selectedScenarioId, currentEventIndex, answers } = get()
    if (!selectedScenarioId) return
    const state: InProgressState = {
      scenarioId: selectedScenarioId,
      currentEventIndex,
      answers,
      lastSavedAt: Date.now(),
    }
    saveInProgress(state)
    set({ inProgressState: state })
  },

  clearInProgress: () => {
    saveInProgress(null)
    set({ inProgressState: null })
  },

  calculateResult: () => {
    const { selectedScenarioId, answers } = get()
    if (!selectedScenarioId) return
    const scoreResult = calculateScore(selectedScenarioId, answers)
    set({ scoreResult })
    get().clearInProgress()
  },

  saveTrainingRecord: () => {
    const { selectedScenarioId, answers, scoreResult, trainingRecords } = get()
    if (!selectedScenarioId || !scoreResult) return

    const scenario = scenarios.find((s) => s.id === selectedScenarioId)
    if (!scenario) return

    const record: TrainingRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scenarioId: selectedScenarioId,
      scenarioName: scenario.name,
      score: scoreResult.totalScore,
      completedAt: Date.now(),
      totalEvents: answers.length,
      answers: [...answers],
      scoreResult: { ...scoreResult },
    }

    const newRecords = [record, ...trainingRecords].slice(0, MAX_RECORDS)
    saveRecords(newRecords)
    set({ trainingRecords: newRecords, selectedRecordId: record.id })
  },

  loadTrainingRecord: (recordId) => {
    const record = get().trainingRecords.find((r) => r.id === recordId)
    if (!record) return

    set({
      selectedScenarioId: record.scenarioId,
      answers: record.answers,
      scoreResult: record.scoreResult,
      currentEventIndex: record.totalEvents - 1,
      selectedRecordId: recordId,
    })
  },

  reset: () => {
    set({
      selectedScenarioId: null,
      currentEventIndex: 0,
      answers: [],
      scoreResult: null,
      selectedRecordId: null,
    })
    get().clearInProgress()
  },

  initFromStorage: () => {
    set({
      trainingRecords: loadRecords(),
      inProgressState: loadInProgress(),
    })
  },
}))
