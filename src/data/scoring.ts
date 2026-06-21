import type {
  ScenarioEvent,
  UserAnswer,
  ScoreResult,
  Issue,
  EventCategory,
  Suggestion,
  TrainingMode,
  ActionItem,
} from './types'
import { events } from './events'
import { categoryLabels } from './types'

function getEventsByScenario(scenarioId: string): ScenarioEvent[] {
  return events.filter((e) => e.scenarioId === scenarioId).sort((a, b) => a.order - b.order)
}

const suggestionTemplates: Record<
  EventCategory,
  Record<TrainingMode, { titles: string[]; contents: string[] }>
> = {
  material: {
    beginner: {
      titles: ['学会查验进场资料', '记住核对清单顺序'],
      contents: [
        '新人入门首先记住：罐车到场先查小票，逐项核对配合比、强度、出厂时间、车号，一项都不能少。',
        '核对顺序建议：车号→配合比→强度等级→出厂时间→坍落度，每次按这个顺序就不会漏。',
      ],
    },
    focus: {
      titles: ['深化资料核验要点', '建立漏查问题清单'],
      contents: [
        '资料查验重点关注：抗渗等级、外加剂、坍落度与配合比一致性、出厂时间是否超时限（C30以下一般90分钟，高温天气要缩短）。',
        '每次发现漏查项都要记录下来，建立自己的易错清单，反复训练直到形成肌肉记忆。',
      ],
    },
    exam: {
      titles: ['保持资料查验严谨性', '提高资料核验效率'],
      contents: [
        '考核中资料查验是送分题，务必逐项核验，不要因为觉得简单就跳过，规范依据一定要记牢。',
        '真实工作中资料是监理的第一道防线，也是自我保护的重要依据，务必严谨对待。',
      ],
    },
  },
  quality: {
    beginner: {
      titles: ['掌握质量控制基本流程', '记住旁站质量六要素'],
      contents: [
        '旁站质量控制从这几个方面入手：坍落度、振捣、分层厚度、养护、板厚/尺寸、预埋件。',
        '新人记忆口诀："坍振分养板埋"，六个字涵盖旁站质量控制核心要点。',
      ],
    },
    focus: {
      titles: ['强化易错环节纠正', '规范问题处置流程'],
      contents: [
        '重点关注高频出错点：坍落度超标放行、振捣间距过大、养护不及时、分层厚度超标。这些是新人最容易犯的错误。',
        '遇到质量问题的标准流程：暂停→记录→判断→上报→整改→验证→复工，按步骤走不会错。',
      ],
    },
    exam: {
      titles: ['综合质量管控能力', '规范引用准确性'],
      contents: [
        '考核中不仅要判断对与错，还要能说出规范依据，GB 50204、GB 50164等常用编号要记清楚。',
        '真实旁站中质量控制是核心职责，每一个判断都要有据可依，做到有理有据。',
      ],
    },
  },
  safety: {
    beginner: {
      titles: ['建立安全防护意识', '认识旁站安全检查点'],
      contents: [
        '新人容易忽视安全，记住旁站不只管质量：作业人员安全帽、临边防护、用电安全、模板支撑都是巡查内容。',
        '上岗前先看三件事：工人帽子戴没戴、脚下有没有洞、电线乱不乱。这三点是最基本的。',
      ],
    },
    focus: {
      titles: ['加强特殊天气应对', '规范安全隐患处置'],
      contents: [
        '雨天、高温、大风等特殊天气浇筑前，必须检查施工单位的专项应对方案，无方案不得开工。',
        '发现安全隐患：一般隐患口头通知并记录，重大隐患立即签发监理通知或停工令，同时上报。',
      ],
    },
    exam: {
      titles: ['综合安全管理能力', '安全职责边界掌握'],
      contents: [
        '考核中要注意区分监理安全职责和施工方安全职责，监理是监督检查，不是代替施工方做安全管理。',
        '记住：发现隐患→要求整改→跟踪验证→记录闭环，这是安全监理的标准闭环。',
      ],
    },
  },
  record: {
    beginner: {
      titles: ['养成影像记录习惯', '记住旁站留影节点'],
      contents: [
        '新人最容易忘记拍照，记住四个必拍节点：浇筑开始、关键工序、完成面、异常情况。每个节点至少一张。',
        '拍照要点：能看清部位（拍标识）、能看清质量特征（拍特写）、有时间信息（手机自动加）。',
      ],
    },
    focus: {
      titles: ['规范旁站记录填写', '提高影像资料质量'],
      contents: [
        '旁站记录要素：起止时间、部位、方量、天气、人员、关键工序、异常处理、试块留置。缺一项都不完整。',
        '影像不是越多越好，而是每个关键节点都要有，照片清晰、主题明确、能证明质量状态。',
      ],
    },
    exam: {
      titles: ['完整记录管理能力', '监理资料归档意识'],
      contents: [
        '考核和真实工作中，旁站记录和影像都是监理资料的重要组成，要做到可追溯、可查证。',
        '好的记录是监理自我保护的最有力证据，也是体现专业水平的重要方面。',
      ],
    },
  },
}

const MIN_REASON_LENGTH = 5

function calcCategoryScore(
  category: EventCategory,
  scenarioEvents: ScenarioEvent[],
  answers: UserAnswer[],
  mode: TrainingMode
): { score: number; max: number } {
  const categoryEvents = scenarioEvents.filter((e) => e.category === category)
  let score = 0

  let perQuestionMax = 20
  let reasonMax = 5
  if (mode === 'focus') {
    perQuestionMax = 22
    reasonMax = 8
  } else if (mode === 'exam') {
    perQuestionMax = 24
    reasonMax = 6
  }
  const max = categoryEvents.length * (perQuestionMax + reasonMax)

  for (const event of categoryEvents) {
    const answer = answers.find((a) => a.eventId === event.id)
    if (!answer) continue

    if (answer.selectedActionIndex === event.correctActionIndex) {
      score += perQuestionMax
    } else if (mode === 'beginner') {
      score += Math.floor(perQuestionMax * 0.3)
    }

    if (answer.reason.trim().length >= MIN_REASON_LENGTH) {
      const hasKeyword = event.correctReason
        .split(/[，。、；]/)
        .some(
          (segment) => segment.trim().length > 0 && answer.reason.includes(segment.trim())
        )
      if (mode === 'exam') {
        score += hasKeyword ? reasonMax : Math.floor(reasonMax * 0.4)
      } else {
        score += hasKeyword ? reasonMax : Math.floor(reasonMax * 0.6)
      }
    }
  }

  return { score, max }
}

function generateSuggestions(
  categoryScores: Record<EventCategory, { score: number; max: number }>,
  issues: Issue[],
  mode: TrainingMode
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const sortedCategories = (Object.keys(categoryScores) as EventCategory[]).sort(
    (a, b) =>
      categoryScores[a].score / (categoryScores[a].max || 1) -
      categoryScores[b].score / (categoryScores[b].max || 1)
  )

  sortedCategories.forEach((cat, index) => {
    const { score, max } = categoryScores[cat]
    const pct = max > 0 ? score / max : 0
    const categoryIssues = issues.filter((i) => i.category === cat)
    const errorCount = categoryIssues.filter((i) => i.type === 'error').length

    const threshold = mode === 'beginner' ? 0.6 : mode === 'focus' ? 0.7 : 0.8
    if (pct < threshold || errorCount > 0) {
      const priority = pct < 0.5 ? 'high' : pct < threshold ? 'medium' : 'low'
      const templateIndex = index % suggestionTemplates[cat][mode].titles.length
      suggestions.push({
        category: cat,
        title: suggestionTemplates[cat][mode].titles[templateIndex],
        content: suggestionTemplates[cat][mode].contents[templateIndex],
        priority,
      })
    }
  })

  return suggestions
}

function generateActionItems(
  issues: Issue[],
  events: ScenarioEvent[],
  answers: UserAnswer[]
): ActionItem[] {
  const items: ActionItem[] = []

  for (const issue of issues) {
    if (issue.type !== 'error') continue

    const event = events.find((e) => e.id === issue.eventId)
    if (!event) continue

    let type: ActionItem['type'] = 'action'
    if (issue.category === 'material') type = 'recheck'
    else if (issue.category === 'record') type = 'record'

    const contentMap: Partial<Record<EventCategory, string>> = {
      material: `对照规范${issue.regulation}，复核资料查验流程，下次遇到同类场景重点核对配合比、强度、出厂时间等关键参数`,
      record: `下次旁站"${event.title}"环节务必留影，照片应清晰显示部位、时间和质量特征，记录旁站要点`,
      quality: `学习规范${issue.regulation}，掌握"${event.title}"的标准处置方法，下次实际工作中按规范执行`,
      safety: `回顾"${event.title}"的安全管理要求，下次遇到类似情况先检查防护措施，符合要求再允许施工`,
    }

    items.push({
      id: `action-${event.id}`,
      category: issue.category,
      title: `${categoryLabels[issue.category]}：${event.title}`,
      content: contentMap[issue.category] || `下次遇到"${event.title}"按规范${issue.regulation}执行`,
      type,
      completed: false,
    })
  }

  return items
}

export function calculateScore(
  scenarioId: string,
  answers: UserAnswer[],
  mode: TrainingMode = 'beginner'
): ScoreResult {
  const scenarioEvents = getEventsByScenario(scenarioId)

  const material = calcCategoryScore('material', scenarioEvents, answers, mode)
  const quality = calcCategoryScore('quality', scenarioEvents, answers, mode)
  const safety = calcCategoryScore('safety', scenarioEvents, answers, mode)
  const record = calcCategoryScore('record', scenarioEvents, answers, mode)

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
        eventId: event.id,
        eventTitle: event.title,
      })
      continue
    }

    if (answer.selectedActionIndex !== event.correctActionIndex) {
      issues.push({
        type: 'error',
        category: event.category,
        description: `「${event.title}」处置不当：你选择了"${event.actionOptions[answer.selectedActionIndex]}"，正确做法应为"${event.actionOptions[event.correctActionIndex]}"`,
        regulation: event.regulation,
        eventId: event.id,
        eventTitle: event.title,
        correctAction: event.actionOptions[event.correctActionIndex],
        userAction: event.actionOptions[answer.selectedActionIndex],
      })
    }

    if (answer.reason.trim().length < MIN_REASON_LENGTH) {
      issues.push({
        type: 'warning',
        category: event.category,
        description: `「${event.title}」未填写有效理由，缺少判断依据记录`,
        regulation: event.regulation,
        eventId: event.id,
        eventTitle: event.title,
      })
    }

    if (event.category === 'record' && answer.selectedActionIndex === event.correctActionIndex) {
      if (answer.reason.trim().length < 10) {
        issues.push({
          type: 'warning',
          category: 'record',
          description: `「${event.title}」影像记录描述过于简略，应注明时间、部位和关键质量特征`,
          regulation: event.regulation,
          eventId: event.id,
          eventTitle: event.title,
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

  const suggestions = generateSuggestions(categoryScores, issues, mode)
  const actionItems = generateActionItems(issues, scenarioEvents, answers)

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
    actionItems,
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

export function getHintForEvent(event: ScenarioEvent, mode: TrainingMode): string | null {
  if (mode === 'exam') return null

  const hints: Record<EventCategory, string> = {
    material: '提示：仔细核对小票上的关键信息，与设计要求逐项比对',
    quality: '提示：回忆质量控制要点，关注偏差是否在允许范围内',
    safety: '提示：考虑安全防护和特殊天气施工的应对措施',
    record: '提示：旁站影像记录的关键节点和规范要求是什么',
  }

  if (mode === 'beginner') {
    return hints[event.category] + `。规范依据：${event.regulation}`
  }
  return hints[event.category]
}
