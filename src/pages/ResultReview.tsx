import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  XCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Gauge,
  ShieldAlert,
  Camera,
  Lightbulb,
  ArrowRight,
  Clock,
  Home,
  RotateCcw,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { events } from '@/data/events'
import { scenarios } from '@/data/scenarios'
import { categoryLabels } from '@/data/types'
import type { ScoreResult, ScenarioEvent, EventCategory, Issue } from '@/data/types'
import { getIssuesByCategory } from '@/data/scoring'

const categoryColors: Record<EventCategory, string> = {
  material: '#2B5EA7',
  quality: '#FF6B35',
  safety: '#DC2626',
  record: '#16A34A',
}

const categoryBgColors: Record<EventCategory, string> = {
  material: 'bg-blue-100 text-blue-800',
  quality: 'bg-orange-100 text-orange-800',
  safety: 'bg-red-100 text-red-800',
  record: 'bg-green-100 text-green-800',
}

const categoryIcons: Record<EventCategory, React.ComponentType<{ className?: string }>> = {
  material: FileCheck,
  quality: Gauge,
  safety: ShieldAlert,
  record: Camera,
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#16A34A'
  if (score >= 60) return '#FF6B35'
  return '#DC2626'
}

function getScoreRating(score: number): string {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '及格'
  return '待提升'
}

function ScoreRing({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = 70
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference
  const color = getScoreColor(score)

  useEffect(() => {
    const duration = 1200
    const start = performance.now()
    let raf: number
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * score))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [score])

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke="#E5E5E5" strokeWidth={strokeWidth}
        />
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>{animatedScore}</span>
        <span className="text-sm text-gray-500">分</span>
      </div>
    </div>
  )
}

function CategoryIssueGroup({
  category,
  issues,
}: {
  category: EventCategory
  issues: Issue[]
}) {
  const [expanded, setExpanded] = useState(true)
  const Icon = categoryIcons[category]
  const color = categoryColors[category]
  const errorCount = issues.filter((i) => i.type === 'error').length
  const warningCount = issues.filter((i) => i.type === 'warning').length

  if (issues.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between bg-gray-50/50 px-4 py-3 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#4A4A4A]">
              {categoryLabels[category]}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              {errorCount > 0 && (
                <span className="flex items-center gap-0.5 text-red-500">
                  <XCircle className="h-3 w-3" />
                  {errorCount} 处错误
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-0.5 text-yellow-600">
                  <AlertTriangle className="h-3 w-3" />
                  {warningCount} 处待改进
                </span>
              )}
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 px-4 pb-3 pt-2">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg border p-3',
                issue.type === 'error'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-yellow-200 bg-yellow-50/50'
              )}
            >
              <div className="flex items-start gap-2">
                {issue.type === 'error' ? (
                  <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                ) : (
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#4A4A4A]">{issue.description}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{issue.regulation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SuggestionCard({
  suggestion,
}: {
  suggestion: { category: EventCategory; title: string; content: string; priority: string }
}) {
  const Icon = categoryIcons[suggestion.category]
  const color = categoryColors[suggestion.category]
  const priorityLabel =
    suggestion.priority === 'high' ? '重点关注' : suggestion.priority === 'medium' ? '建议加强' : '持续巩固'
  const priorityColor =
    suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
    suggestion.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
    'bg-green-100 text-green-700'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#4A4A4A]">{suggestion.title}</p>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', priorityColor)}>
            {priorityLabel}
          </span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-gray-600">{suggestion.content}</p>
    </div>
  )
}

export default function ResultReview() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { scoreResult, answers, reset, saveTrainingRecord, selectedRecordId, initFromStorage } = useStore()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  const scenario = scenarios.find((s) => s.id === id)
  const scenarioEvents = events
    .filter((e) => e.scenarioId === id)
    .sort((a, b) => a.order - b.order)

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  useEffect(() => {
    if (scoreResult && !selectedRecordId) {
      saveTrainingRecord()
    }
  }, [scoreResult, selectedRecordId, saveTrainingRecord])

  if (!scoreResult || !scenario) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#F5F5F0' }}>
        <p className="text-gray-500">暂无评分结果</p>
      </div>
    )
  }

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  const issuesByCategory = getIssuesByCategory(scoreResult.issues)
  const categories: EventCategory[] = ['material', 'quality', 'safety', 'record']
  const hasAnyIssue = categories.some((c) => issuesByCategory[c].length > 0)

  const sortedSuggestions = [...scoreResult.suggestions].sort((a, b) => {
    const weight = { high: 0, medium: 1, low: 2 }
    return weight[a.priority] - weight[b.priority]
  })

  const scoreColor = getScoreColor(scoreResult.totalScore)
  const isFromRecord = !!selectedRecordId

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F5F5F0' }}>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#4A4A4A]"
            >
              <Home className="h-4 w-4" />
              返回首页
            </button>
            {isFromRecord && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                历史记录查看
              </span>
            )}
          </div>
        </div>
      </div>

      <header className="px-4 pt-6 pb-2 text-center">
        <h1 className="text-xl font-bold" style={{ color: '#4A4A4A' }}>旁站复盘报告</h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </header>

      <section className="mx-4 mt-4 p-6 bg-white rounded-2xl shadow-sm flex flex-col items-center">
        <ScoreRing score={scoreResult.totalScore} />
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-semibold" style={{ color: scoreColor }}>
            {getScoreRating(scoreResult.totalScore)}
          </span>
          {scoreResult.totalScore >= 80 && (
            <Award className="h-5 w-5" style={{ color: scoreColor }} />
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {isFromRecord ? '历史成绩' : '本次练习成绩'}
        </p>
      </section>

      <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>得分明细</h2>
        <div className="space-y-4">
          {categories.map((key) => {
            const scoreKey = `${key}Score` as keyof ScoreResult
            const maxKey = `${key}Max` as keyof ScoreResult
            const score = scoreResult[scoreKey] as number
            const max = scoreResult[maxKey] as number
            const pct = max > 0 ? Math.round((score / max) * 100) : 0
            const Icon = categoryIcons[key]

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${categoryColors[key]}15`, color: categoryColors[key] }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: categoryColors[key] }}>
                      {categoryLabels[key]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium" style={{ color: categoryColors[key] }}>{pct}%</span>
                    <span className="text-gray-400">{score}/{max}</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: categoryColors[key] }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>
          旁站职责问题分类
        </h2>
        {!hasAnyIssue ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-500" />
            <p className="text-sm font-medium text-[#4A4A4A]">表现优秀，暂无问题</p>
            <p className="mt-1 text-xs text-gray-400">所有旁站职责均按规范执行</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <CategoryIssueGroup
                key={cat}
                category={cat}
                issues={issuesByCategory[cat]}
              />
            ))}
          </div>
        )}
      </section>

      {sortedSuggestions.length > 0 && (
        <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#FF6B35]" />
            <h2 className="text-base font-semibold" style={{ color: '#4A4A4A' }}>
              下次练习重点建议
            </h2>
          </div>
          <div className="space-y-3">
            {sortedSuggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>逐题复盘</h2>
        <div className="space-y-2">
          {scenarioEvents.map((event) => {
            const answer = answers.find((a) => a.eventId === event.id)
            const isCorrect = answer?.selectedActionIndex === event.correctActionIndex
            const expanded = expandedEvents.has(event.id)
            return (
              <div key={event.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-gray-50"
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                      {event.order}
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#4A4A4A' }}>
                      {event.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <X size={16} className="text-red-500" />
                    )}
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>
                {expanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                    <div className="pt-2">
                      <p className="text-xs text-gray-400 mb-0.5">你的选择</p>
                      <p className="text-sm" style={{ color: isCorrect ? '#16A34A' : '#DC2626' }}>
                        {answer ? event.actionOptions[answer.selectedActionIndex] : '未作答'}
                      </p>
                    </div>
                    {answer && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">你的理由</p>
                        <p className="text-sm text-gray-600">{answer.reason || '未填写'}</p>
                      </div>
                    )}
                    <div className="rounded-lg bg-green-50 p-2.5">
                      <p className="text-xs text-green-700 mb-0.5 font-medium">正确做法</p>
                      <p className="text-sm text-green-800">
                        {event.actionOptions[event.correctActionIndex]}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">规范依据</p>
                      <p className="text-xs text-gray-500">{event.regulation}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-2xl flex gap-3">
          <button
            onClick={() => { reset(); navigate('/') }}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-gray-200 text-gray-700 active:opacity-80 transition-colors hover:bg-gray-300"
          >
            返回首页
          </button>
          <button
            onClick={() => navigate(`/scenario/${id}`)}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white active:opacity-80 transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
          >
            <span className="flex items-center justify-center gap-1.5">
              {isFromRecord ? '开始练习' : '再次练习'}
              <RotateCcw className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
