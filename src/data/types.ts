export interface Scenario {
  id: string
  name: string
  description: string
  weather: string
  pourPart: string
  concreteGrade: string
  pumpMethod: string
  personnelConfig: string
  icon: string
}

export type EventCategory = 'material' | 'quality' | 'safety' | 'record'

export interface ScenarioEvent {
  id: string
  scenarioId: string
  order: number
  title: string
  description: string
  actionOptions: string[]
  correctActionIndex: number
  correctReason: string
  regulation: string
  category: EventCategory
}

export interface UserAnswer {
  eventId: string
  selectedActionIndex: number
  reason: string
}

export interface Issue {
  type: 'error' | 'warning'
  category: EventCategory
  description: string
  regulation: string
}

export interface ScoreResult {
  totalScore: number
  materialScore: number
  materialMax: number
  qualityScore: number
  qualityMax: number
  safetyScore: number
  safetyMax: number
  recordScore: number
  recordMax: number
  issues: Issue[]
  suggestions: Suggestion[]
}

export interface Suggestion {
  category: EventCategory
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
}

export interface TrainingRecord {
  id: string
  scenarioId: string
  scenarioName: string
  score: number
  completedAt: number
  totalEvents: number
  answers: UserAnswer[]
  scoreResult: ScoreResult
}

export interface InProgressState {
  scenarioId: string
  currentEventIndex: number
  answers: UserAnswer[]
  lastSavedAt: number
}

export const categoryLabels: Record<EventCategory, string> = {
  material: '资料查验',
  quality: '质量控制',
  safety: '安全防护',
  record: '影像记录',
}

export const categoryIconNames: Record<EventCategory, string> = {
  material: 'FileCheck',
  quality: 'Gauge',
  safety: 'ShieldAlert',
  record: 'Camera',
}
