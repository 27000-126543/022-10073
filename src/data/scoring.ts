import type { ScenarioEvent, UserAnswer, ScoreResult, Issue, EventCategory } from './types'
import { events } from './events'

function getEventsByScenario(scenarioId: string): ScenarioEvent[] {
  return events.filter((e) => e.scenarioId === scenarioId).sort((a, b) => a.order - b.order)
}

function calcCategoryScore(
  category: EventCategory,
  scenarioEvents: ScenarioEvent[],
  answers: UserAnswer[]
): { score: number; max: number } {
  const categoryEvents = scenarioEvents.filter((e) => e.category === category)
  let score = 0
  const max = categoryEvents.length * 25

  for (const event of categoryEvents) {
    const answer = answers.find((a) => a.eventId === event.id)
    if (!answer) continue

    if (answer.selectedActionIndex === event.correctActionIndex) {
      score += 20
    }

    if (answer.reason.trim().length >= 5) {
      const hasKeyword = event.correctReason
        .split(/[，。、；]/)
        .some((segment) => segment.trim().length > 0 && answer.reason.includes(segment.trim()))
      score += hasKeyword ? 5 : 3
    }
  }

  return { score, max }
}

export function calculateScore(scenarioId: string, answers: UserAnswer[]): ScoreResult {
  const scenarioEvents = getEventsByScenario(scenarioId)

  const material = calcCategoryScore('material', scenarioEvents, answers)
  const quality = calcCategoryScore('quality', scenarioEvents, answers)
  const safety = calcCategoryScore('safety', scenarioEvents, answers)
  const record = calcCategoryScore('record', scenarioEvents, answers)

  const totalMax = material.max + quality.max + safety.max + record.max
  const totalScore = Math.round(
    ((material.score + quality.score + safety.score + record.score) / totalMax) * 100
  )

  const issues: Issue[] = []

  for (const event of scenarioEvents) {
    const answer = answers.find((a) => a.eventId === event.id)
    if (!answer) {
      issues.push({
        type: 'error',
        category: event.category,
        description: `未完成事件「${event.title}」的处理`,
        regulation: event.regulation,
      })
      continue
    }

    if (answer.selectedActionIndex !== event.correctActionIndex) {
      issues.push({
        type: 'error',
        category: event.category,
        description: `「${event.title}」处置不当：你选择了"${event.actionOptions[answer.selectedActionIndex]}"，正确做法应为"${event.actionOptions[event.correctActionIndex]}"`,
        regulation: event.regulation,
      })
    }

    if (answer.reason.trim().length < 5) {
      issues.push({
        type: 'warning',
        category: event.category,
        description: `「${event.title}」未填写有效理由，缺少判断依据记录`,
        regulation: event.regulation,
      })
    }

    if (event.category === 'record' && answer.selectedActionIndex === event.correctActionIndex) {
      if (answer.reason.trim().length < 10) {
        issues.push({
          type: 'warning',
          category: 'record',
          description: `「${event.title}」影像记录描述过于简略，应注明时间、部位和关键质量特征`,
          regulation: event.regulation,
        })
      }
    }
  }

  return {
    totalScore,
    materialScore: material.score,
    materialMax: material.max,
    qualityScore: quality.score,
    qualityMax: quality.max,
    safetyScore: safety.score,
    safetyMax: safety.max,
    recordScore: record.score,
    recordMax: record.max,
    issues,
  }
}
