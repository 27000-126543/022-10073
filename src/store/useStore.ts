import { create } from 'zustand'
import type {
  UserAnswer,
  ScoreResult,
  TrainingRecord,
  InProgressState,
  TrainingMode,
} from '@/data/types'
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

function updateRecordInStorage(
  recordId: string,
  updater: (r: TrainingRecord) => TrainingRecord
): TrainingRecord[] {
  const records = loadRecords()
  const idx = records.findIndex((r) => r.id === recordId)
  if (idx >= 0) {
    records[idx] = updater(records[idx])
    saveRecords(records)
  }
  return records
}

interface AppState {
  selectedScenarioId: string | null
  trainingMode: TrainingMode
  currentEventIndex: number
  answers: UserAnswer[]
  scoreResult: ScoreResult | null
  trainingRecords: TrainingRecord[]
  inProgressState: InProgressState | null
  selectedRecordId: string | null
  startTime: number
  perEventStartTime: Record<string, number>

  setTrainingMode: (mode: TrainingMode) => void
  selectScenario: (id: string, resume?: boolean) => void
  setEventIndex: (index: number, eventId?: string) => void
  submitAnswer: (eventId: string, actionIndex: number, reason: string) => void
  saveProgress: () => void
  clearInProgress: () => void
  calculateResult: () => void
  saveTrainingRecord: () => void
  toggleActionItem: (recordId: string, actionItemId: string) => void
  loadTrainingRecord: (recordId: string) => void
  restartScenario: (scenarioId?: string) => void
  reset: () => void
  initFromStorage: () => void
}

export const useStore = create<AppState>((set, get) => ({
  selectedScenarioId: null,
  trainingMode: 'beginner',
  currentEventIndex: 0,
  answers: [],
  scoreResult: null,
  trainingRecords: [],
  inProgressState: null,
  selectedRecordId: null,
  startTime: 0,
  perEventStartTime: {},

  setTrainingMode: (mode) => {
    set({ trainingMode: mode })
  },

  selectScenario: (id, resume = false) => {
    const inProgress = resume ? loadInProgress() : null
    const shouldResume =
      resume && inProgress && inProgress.scenarioId === id

    const mode = shouldResume ? inProgress!.mode : get().trainingMode
    const currentAnswers = shouldResume ? inProgress!.answers : []
    const currentStartTime = shouldResume ? inProgress!.startTime : Date.now()
    const currentPerEventStartTime = shouldResume
      ? inProgress!.perEventStartTime
      : {}

    set({
      selectedScenarioId: id,
      trainingMode: mode,
      currentEventIndex: shouldResume ? inProgress!.currentEventIndex : 0,
      answers: currentAnswers,
      scoreResult: null,
      selectedRecordId: null,
      startTime: currentStartTime,
      perEventStartTime: currentPerEventStartTime,
    })

    if (!shouldResume) {
      get().clearInProgress()
    }
  },

  setEventIndex: (index, eventId) => {
    const { perEventStartTime } = get()
    const newPerEvent = { ...perEventStartTime }
    if (eventId && !newPerEvent[eventId]) {
      newPerEvent[eventId] = Date.now()
    }
    set({ currentEventIndex: index, perEventStartTime: newPerEvent })
    get().saveProgress()
  },

  submitAnswer: (eventId, actionIndex, reason) => {
    const { answers, perEventStartTime } = get()
    const startedAt = perEventStartTime[eventId] || Date.now()
    const timeSpent = Math.max(0, Date.now() - startedAt)

    const newAnswers = [...answers]
    const existing = newAnswers.findIndex((a) => a.eventId === eventId)
    if (existing >= 0) {
      newAnswers[existing] = { eventId, selectedActionIndex: actionIndex, reason, timeSpent }
    } else {
      newAnswers.push({ eventId, selectedActionIndex: actionIndex, reason, timeSpent })
    }
    set({ answers: newAnswers })
    get().saveProgress()
  },

  saveProgress: () => {
    const {
      selectedScenarioId,
      trainingMode,
      currentEventIndex,
      answers,
      startTime,
      perEventStartTime,
    } = get()
    if (!selectedScenarioId) return
    const state: InProgressState = {
      scenarioId: selectedScenarioId,
      mode: trainingMode,
      currentEventIndex,
      answers,
      startTime,
      perEventStartTime,
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
    const { selectedScenarioId, answers, trainingMode } = get()
    if (!selectedScenarioId) return
    const scoreResult = calculateScore(selectedScenarioId, answers, trainingMode)
    set({ scoreResult })
    get().clearInProgress()
  },

  saveTrainingRecord: () => {
    const {
      selectedScenarioId,
      answers,
      scoreResult,
      trainingRecords,
      trainingMode,
      startTime,
      perEventStartTime,
    } = get()
    if (!selectedScenarioId || !scoreResult) return

    const scenario = scenarios.find((s) => s.id === selectedScenarioId)
    if (!scenario) return

    const perEventTime: Record<string, number> = {}
    for (const a of answers) {
      perEventTime[a.eventId] = a.timeSpent
    }

    const totalTime = Date.now() - startTime

    const record: TrainingRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scenarioId: selectedScenarioId,
      scenarioName: scenario.name,
      mode: trainingMode,
      score: scoreResult.totalScore,
      completedAt: Date.now(),
      totalEvents: answers.length,
      totalTime,
      perEventTime,
      answers: [...answers],
      scoreResult: { ...scoreResult },
    }

    const newRecords = [record, ...trainingRecords].slice(0, MAX_RECORDS)
    saveRecords(newRecords)
    set({ trainingRecords: newRecords, selectedRecordId: record.id })
  },

  toggleActionItem: (recordId, actionItemId) => {
    const updatedRecords = updateRecordInStorage(recordId, (r) => {
      const items = r.scoreResult.actionItems.map((it) =>
        it.id === actionItemId ? { ...it, completed: !it.completed } : it
      )
      return {
        ...r,
        scoreResult: { ...r.scoreResult, actionItems: items },
      }
    })
    set({ trainingRecords: updatedRecords })

    if (get().selectedRecordId === recordId && get().scoreResult) {
      const found = updatedRecords.find((r) => r.id === recordId)
      if (found) {
        set({ scoreResult: found.scoreResult })
      }
    }
  },

  loadTrainingRecord: (recordId) => {
    const record = get().trainingRecords.find((r) => r.id === recordId)
    if (!record) return

    set({
      selectedScenarioId: record.scenarioId,
      trainingMode: record.mode,
      answers: record.answers,
      scoreResult: record.scoreResult,
      currentEventIndex: record.totalEvents - 1,
      selectedRecordId: recordId,
    })
  },

  restartScenario: (scenarioId) => {
    const id = scenarioId || get().selectedScenarioId
    if (!id) return

    get().clearInProgress()

    set({
      currentEventIndex: 0,
      answers: [],
      scoreResult: null,
      selectedRecordId: null,
      startTime: Date.now(),
      perEventStartTime: {},
      selectedScenarioId: id,
    })
  },

  reset: () => {
    set({
      selectedScenarioId: null,
      trainingMode: 'beginner',
      currentEventIndex: 0,
      answers: [],
      scoreResult: null,
      selectedRecordId: null,
      startTime: 0,
      perEventStartTime: {},
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
