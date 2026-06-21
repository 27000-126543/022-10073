import { create } from 'zustand'
import type {
  UserAnswer,
  ScoreResult,
  TrainingRecord,
  InProgressState,
  TrainingMode,
  Trainee,
  TeacherComment,
} from '@/data/types'
import { calculateScore } from '@/data/scoring'
import { scenarios } from '@/data/scenarios'

const STORAGE_KEY_IN_PROGRESS = 'pz-training-in-progress'
const STORAGE_KEY_RECORDS = 'pz-training-records'
const STORAGE_KEY_TRAINEES = 'pz-training-trainees'
const MAX_RECORDS = 20

function generateSessionId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

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

function loadTrainees(): Trainee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRAINEES)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveTrainees(trainees: Trainee[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TRAINEES, JSON.stringify(trainees))
  } catch {
    // ignore
  }
}

function mergeRecordFields(
  existing: TrainingRecord,
  partial: Partial<TrainingRecord>
): TrainingRecord {
  const result = { ...existing }
  for (const key of Object.keys(partial)) {
    const k = key as keyof TrainingRecord
    if (k === 'scoreResult' && partial.scoreResult && existing.scoreResult) {
      result.scoreResult = {
        ...existing.scoreResult,
        ...partial.scoreResult,
        actionItems:
          partial.scoreResult.actionItems && partial.scoreResult.actionItems.length > 0
            ? partial.scoreResult.actionItems
            : existing.scoreResult.actionItems,
        issues:
          partial.scoreResult.issues && partial.scoreResult.issues.length > 0
            ? partial.scoreResult.issues
            : existing.scoreResult.issues,
      }
    } else if (k === 'teacherComment') {
      if (partial.teacherComment !== undefined) {
        result.teacherComment = partial.teacherComment
      }
    } else if (partial[k] !== undefined) {
      ;(result as any)[k] = partial[k]
    }
  }
  return result
}

function upsertRecord(
  records: TrainingRecord[],
  record: TrainingRecord,
  checkSessionId = true
): TrainingRecord[] {
  let idx = -1
  if (checkSessionId) {
    idx = records.findIndex((r) => r.sessionId === record.sessionId)
  }
  if (idx === -1) {
    idx = records.findIndex(
      (r) =>
        r.id === record.id ||
        (r.scenarioId === record.scenarioId &&
          r.traineeId === record.traineeId &&
          Math.abs(r.completedAt - record.completedAt) < 5000)
    )
  }

  let newRecords: TrainingRecord[]
  if (idx >= 0) {
    newRecords = [...records]
    newRecords[idx] = mergeRecordFields(records[idx], record)
  } else {
    newRecords = [record, ...records]
  }

  newRecords.sort((a, b) => b.completedAt - a.completedAt)
  return newRecords.slice(0, MAX_RECORDS)
}

function partialUpdateRecord(
  records: TrainingRecord[],
  recordId: string,
  updater: (r: TrainingRecord) => Partial<TrainingRecord>
): TrainingRecord[] {
  const idx = records.findIndex((r) => r.id === recordId)
  if (idx === -1) return records

  const newRecords = [...records]
  const partial = updater(newRecords[idx])
  newRecords[idx] = mergeRecordFields(newRecords[idx], partial)
  return newRecords
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
  sessionId: string
  trainees: Trainee[]
  currentTraineeId: string | null

  setTrainingMode: (mode: TrainingMode) => void
  addTrainee: (name: string) => void
  removeTrainee: (id: string) => void
  setCurrentTrainee: (id: string | null) => void
  selectScenario: (id: string, resume?: boolean) => void
  setEventIndex: (index: number, eventId?: string) => void
  submitAnswer: (eventId: string, actionIndex: number, reason: string) => void
  saveProgress: () => void
  clearInProgress: () => void
  calculateResult: () => void
  saveTrainingRecord: () => void
  saveTeacherComment: (recordId: string, comment: string, passed: boolean) => void
  toggleActionItem: (recordId: string, actionItemId: string) => void
  loadTrainingRecord: (recordId: string) => void
  restartScenario: (scenarioId?: string) => void
  reset: () => void
  initFromStorage: () => void
  generateNewSession: () => void
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
  sessionId: generateSessionId(),
  trainees: [],
  currentTraineeId: null,

  setTrainingMode: (mode) => {
    set({ trainingMode: mode })
  },

  addTrainee: (name) => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const existing = get().trainees.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (existing) {
      set({ currentTraineeId: existing.id })
      return
    }
    const newTrainee: Trainee = {
      id: `trainee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      createdAt: Date.now(),
    }
    const newTrainees = [...get().trainees, newTrainee]
    saveTrainees(newTrainees)
    set({ trainees: newTrainees, currentTraineeId: newTrainee.id })
  },

  removeTrainee: (id) => {
    const newTrainees = get().trainees.filter((t) => t.id !== id)
    saveTrainees(newTrainees)
    set({
      trainees: newTrainees,
      currentTraineeId: get().currentTraineeId === id ? null : get().currentTraineeId,
    })
  },

  setCurrentTrainee: (id) => {
    set({ currentTraineeId: id })
  },

  generateNewSession: () => {
    set({ sessionId: generateSessionId() })
  },

  selectScenario: (id, resume = false) => {
    const inProgress = resume ? loadInProgress() : null
    const shouldResume = resume && inProgress && inProgress.scenarioId === id

    const { trainingMode, currentTraineeId, trainees, sessionId } = get()
    const currentTrainee = trainees.find((t) => t.id === currentTraineeId)

    const mode = shouldResume ? inProgress!.mode : trainingMode
    const currentAnswers = shouldResume ? inProgress!.answers : []
    const currentStartTime = shouldResume ? inProgress!.startTime : Date.now()
    const currentPerEventStartTime = shouldResume
      ? inProgress!.perEventStartTime
      : {}
    const resumedSessionId = shouldResume ? inProgress!.sessionId : sessionId
    const resumedTraineeId = shouldResume
      ? inProgress!.traineeId
      : currentTraineeId
    const resumedTraineeName = shouldResume
      ? inProgress!.traineeName
      : currentTrainee?.name || null

    if (!shouldResume) {
      get().generateNewSession()
    }

    set({
      selectedScenarioId: id,
      trainingMode: mode,
      currentEventIndex: shouldResume ? inProgress!.currentEventIndex : 0,
      answers: currentAnswers,
      scoreResult: null,
      selectedRecordId: null,
      startTime: currentStartTime,
      perEventStartTime: currentPerEventStartTime,
      sessionId: resumedSessionId,
      currentTraineeId: resumedTraineeId,
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
      sessionId,
      currentTraineeId,
      trainees,
    } = get()
    if (!selectedScenarioId) return

    const currentTrainee = trainees.find((t) => t.id === currentTraineeId)
    const state: InProgressState = {
      scenarioId: selectedScenarioId,
      mode: trainingMode,
      traineeId: currentTraineeId,
      traineeName: currentTrainee?.name || null,
      sessionId,
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
      sessionId,
      currentTraineeId,
      trainees,
    } = get()
    if (!selectedScenarioId || !scoreResult) return

    const scenario = scenarios.find((s) => s.id === selectedScenarioId)
    if (!scenario) return

    const currentTrainee = trainees.find((t) => t.id === currentTraineeId)

    const perEventTime: Record<string, number> = {}
    for (const a of answers) {
      perEventTime[a.eventId] = a.timeSpent
    }

    const totalTime = Date.now() - startTime

    const record: TrainingRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scenarioId: selectedScenarioId,
      scenarioName: scenario.name,
      mode: trainingMode,
      traineeId: currentTraineeId,
      traineeName: currentTrainee?.name || null,
      score: scoreResult.totalScore,
      completedAt: Date.now(),
      totalEvents: answers.length,
      totalTime,
      perEventTime,
      answers: [...answers],
      scoreResult: { ...scoreResult },
      teacherComment: null,
      sessionId,
    }

    const newRecords = upsertRecord(trainingRecords, record, true)
    saveRecords(newRecords)
    set({ trainingRecords: newRecords, selectedRecordId: record.id })
  },

  saveTeacherComment: (recordId, comment, passed) => {
    const tc: TeacherComment = {
      comment: comment.trim(),
      passed,
      updatedAt: Date.now(),
    }

    const newRecords = partialUpdateRecord(get().trainingRecords, recordId, () => ({
      teacherComment: tc,
    }))
    saveRecords(newRecords)
    set({ trainingRecords: newRecords })

    if (get().selectedRecordId === recordId) {
      const found = newRecords.find((r) => r.id === recordId)
      if (found && get().scoreResult) {
        set({})
      }
    }
  },

  toggleActionItem: (recordId, actionItemId) => {
    const newRecords = partialUpdateRecord(get().trainingRecords, recordId, (r) => {
      const items = r.scoreResult.actionItems.map((it) =>
        it.id === actionItemId ? { ...it, completed: !it.completed } : it
      )
      return {
        scoreResult: { ...r.scoreResult, actionItems: items },
      }
    })
    saveRecords(newRecords)
    set({ trainingRecords: newRecords })

    if (get().selectedRecordId === recordId && get().scoreResult) {
      const found = newRecords.find((r) => r.id === recordId)
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
      currentTraineeId: record.traineeId,
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
    get().generateNewSession()

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
      sessionId: generateSessionId(),
    })
    get().clearInProgress()
  },

  initFromStorage: () => {
    set({
      trainingRecords: loadRecords(),
      inProgressState: loadInProgress(),
      trainees: loadTrainees(),
    })
  },
}))
