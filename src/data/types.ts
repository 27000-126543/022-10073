export type TrainingMode = 'beginner' | 'focus' | 'exam'

export const trainingModeLabels: Record<TrainingMode, string> = {
  beginner: '新手入门',
  focus: '重点纠错',
  exam: '考核模拟',
}

export const trainingModeDescriptions: Record<TrainingMode, string> = {
  beginner: '逐题提示，侧重学习旁站流程与规范要点',
  focus: '针对易错点重点训练，强调质量控制和规范依据',
  exam: '无提示模拟考核，评分严格，检验真实水平',
}

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
  hint?: string
}

export interface UserAnswer {
  eventId: string
  selectedActionIndex: number
  reason: string
  timeSpent: number
}

export interface Issue {
  type: 'error' | 'warning'
  category: EventCategory
  description: string
  regulation: string
  eventId?: string
  eventTitle?: string
  correctAction?: string
  userAction?: string
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
  actionItems: ActionItem[]
}

export interface Suggestion {
  category: EventCategory
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
}

export interface ActionItem {
  id: string
  category: EventCategory
  title: string
  content: string
  type: 'recheck' | 'record' | 'action'
  completed: boolean
}

export interface TrainingRecord {
  id: string
  scenarioId: string
  scenarioName: string
  mode: TrainingMode
  score: number
  completedAt: number
  totalEvents: number
  totalTime: number
  perEventTime: Record<string, number>
  answers: UserAnswer[]
  scoreResult: ScoreResult
}

export interface InProgressState {
  scenarioId: string
  mode: TrainingMode
  currentEventIndex: number
  answers: UserAnswer[]
  startTime: number
  perEventStartTime: Record<string, number>
  lastSavedAt: number
}

export const categoryLabels: Record<EventCategory, string> = {
  material: '资料查验',
  quality: '质量控制',
  safety: '安全防护',
  record: '影像记录',
}

export const actionItemTypeLabels: Record<ActionItem['type'], string> = {
  recheck: '补查资料',
  record: '补留影像',
  action: '规范处置',
}

export const categoryIconNames: Record<EventCategory, string> = {
  material: 'FileCheck',
  quality: 'Gauge',
  safety: 'ShieldAlert',
  record: 'Camera',
}
