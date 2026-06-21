import type { ScenarioEvent, UserAnswer, ScoreResult, Issue, EventCategory, Suggestion } from './types'
import { events } from './events'
import { categoryLabels } from './types'

function getEventsByScenario(scenarioId: string): ScenarioEvent[] {
  return events.filter((e) => e.scenarioId === scenarioId).sort((a, b) => a.order - b.order)
}

const suggestionTemplates: Record<EventCategory, { titles: string[]; contents: string[] }> = {
  material: {
    titles: [
      '强化进场资料查验意识',
      '建立资料核对清单',
    ],
    contents: [
      '混凝土进场必须逐项核验随车小票：配合比通知单编号、强度等级、抗渗等级、出厂时间、运输单号、车号。出厂时间超过规范允许时限的混凝土不得使用。',
      '建议随身带一份资料核对清单：合格证→配合比→坍落度→强度等级→出厂时间→车号，逐项打勾，避免遗漏。',
    ],
  },
  quality: {
    titles: [
      '熟记质量控制要点',
      '掌握常见问题处置流程',
    ],
    contents: [
      '旁站中重点控制：坍落度偏差、振捣间距与时间、分层浇筑厚度、接茬处理、养护时机与持续时间。这些是新人最容易疏忽的环节。',
      '遇到质量问题不要慌：先暂停施工→记录问题→判断严重程度→上报或要求整改→验证整改结果→复工。按流程走就不会出错。',
    ],
  },
  safety: {
    titles: [
      '提高安全防护意识',
      '关注特殊天气施工',
    ],
    contents: [
      '旁站不仅是质量监督，安全也不能放松。注意观察：作业人员防护用品、模板支撑稳定性、临边洞口防护、用电安全。',
      '特殊天气（雨天、高温、大风）浇筑前必须核查施工方案中的应对措施，无措施或措施不到位的不得开工。',
    ],
  },
  record: {
    titles: [
      '养成影像记录习惯',
      '规范旁站记录填写',
    ],
    contents: [
      '关键节点必须留影：浇筑开始、关键工序（振捣/养护）、浇筑完成、异常情况及处置。照片应能看清部位、时间和质量特征。',
      '旁站记录要写全：起止时间、部位、混凝土方量、人员配置、天气、异常情况及处理结果、试块留置情况。好的记录是监理自我保护的重要依据。',
    ],
  },
}

function generateSuggestions(
  categoryScores: Record<EventCategory, { score: number; max: number }>,
  issues: Issue[]
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const sortedCategories = (Object.keys(categoryScores) as EventCategory[]).sort(
    (a, b) => categoryScores[a].score / categoryScores[a].max - categoryScores[b].score / categoryScores[b].max
  )

  sortedCategories.forEach((cat, index) => {
    const { score, max } = categoryScores[cat]
    const pct = max > 0 ? score / max : 0
    const categoryIssues = issues.filter((i) => i.category === cat)
    const errorCount = categoryIssues.filter((i) => i.type === 'error').length

    if (pct < 0.7 || errorCount > 0) {
      const priority = pct < 0.5 ? 'high' : pct < 0.7 ? 'medium' : 'low'
      const templateIndex = index % suggestionTemplates[cat].titles.length
      suggestions.push({
        category: cat,
        title: suggestionTemplates[cat].titles[templateIndex],
        content: suggestionTemplates[cat].contents[templateIndex],
        priority,
      })
    }
  })

  return suggestions
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

  const categoryScores: Record<EventCategory, { score: number; max: number }> = {
    material,
    quality,
    safety,
    record,
  }

  const suggestions = generateSuggestions(categoryScores, issues)

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
    suggestions,
  }
}

export function getIssuesByCategory(issues: Issue[]): Record<EventCategory, Issue[]> {
  const result: Record<EventCategory, Issue[]> = {
    material: [],
    quality: [],
    safety: [],
    record: [],
  }
  for (const issue of issues) {
    result[issue.category].push(issue)
  }
  return result
}
