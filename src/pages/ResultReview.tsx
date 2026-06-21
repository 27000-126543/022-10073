import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { XCircle, AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { events } from '@/data/events'
import { scenarios } from '@/data/scenarios'
import { categoryLabels } from '@/data/types'
import type { ScoreResult, ScenarioEvent, EventCategory } from '@/data/types'

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

function getScoreColor(score: number): string {
  if (score >= 80) return '#16A34A'
  if (score >= 60) return '#FF6B35'
  return '#DC2626'
}

function getScoreRating(score: number): string {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
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

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-medium w-10 text-right" style={{ color }}>
        {pct}%
      </span>
      <span className="text-sm text-gray-500 w-12 text-right">
        {value}/{max}
      </span>
    </div>
  )
}

export default function ResultReview() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { scoreResult, answers, reset } = useStore()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  const scenario = scenarios.find((s) => s.id === id)
  const scenarioEvents = events
    .filter((e) => e.scenarioId === id)
    .sort((a, b) => a.order - b.order)

  if (!scoreResult || !scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5F0' }}>
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

  const categories: { key: EventCategory; score: number; max: number }[] = [
    { key: 'material', score: scoreResult.materialScore, max: scoreResult.materialMax },
    { key: 'quality', score: scoreResult.qualityScore, max: scoreResult.qualityMax },
    { key: 'safety', score: scoreResult.safetyScore, max: scoreResult.safetyMax },
    { key: 'record', score: scoreResult.recordScore, max: scoreResult.recordMax },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0' }}>
      <header className="px-4 pt-8 pb-4 text-center">
        <h1 className="text-2xl font-bold" style={{ color: '#4A4A4A' }}>旁站复盘报告</h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </header>

      <section className="mx-4 mt-4 p-6 bg-white rounded-2xl shadow-sm flex flex-col items-center">
        <ScoreRing score={scoreResult.totalScore} />
        <span
          className="mt-3 text-lg font-semibold"
          style={{ color: getScoreColor(scoreResult.totalScore) }}
        >
          {getScoreRating(scoreResult.totalScore)}
        </span>
      </section>

      <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>得分明细</h2>
        <div className="space-y-4">
          {categories.map(({ key, score, max }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: categoryColors[key] }}>
                  {categoryLabels[key]}
                </span>
              </div>
              <ProgressBar value={score} max={max} color={categoryColors[key]} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>问题清单</h2>
        {scoreResult.issues.length === 0 ? (
          <p className="text-sm text-gray-400">没有问题，表现优秀！</p>
        ) : (
          <div className="space-y-3">
            {scoreResult.issues.map((issue, i) => (
              <div
                key={i}
                className={cn(
                  'p-3 rounded-xl border',
                  issue.type === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {issue.type === 'error' ? (
                    <XCircle size={16} className="text-red-500 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
                  )}
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      categoryBgColors[issue.category]
                    )}
                  >
                    {categoryLabels[issue.category]}
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#4A4A4A' }}>{issue.description}</p>
                <p className="text-xs text-gray-400 mt-1">{issue.regulation}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>标准处置参考</h2>
        <div className="space-y-2">
          {scenarioEvents.map((event) => {
            const answer = answers.find((a) => a.eventId === event.id)
            const isCorrect = answer?.selectedActionIndex === event.correctActionIndex
            const expanded = expandedEvents.has(event.id)
            return (
              <div key={event.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 text-left"
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">步骤{event.order}</span>
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
                      <p className="text-xs text-gray-400">你的选择</p>
                      <p className="text-sm" style={{ color: isCorrect ? '#16A34A' : '#DC2626' }}>
                        {answer ? event.actionOptions[answer.selectedActionIndex] : '未作答'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">正确做法</p>
                      <p className="text-sm text-green-700 font-medium">
                        {event.actionOptions[event.correctActionIndex]}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">理由</p>
                      <p className="text-sm" style={{ color: '#4A4A4A' }}>{event.correctReason}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">规范依据</p>
                      <p className="text-xs text-gray-500">{event.regulation}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3">
        <button
          onClick={() => { reset(); navigate('/') }}
          className="flex-1 py-3 rounded-xl text-sm font-medium bg-gray-200 text-gray-700 active:opacity-80"
        >
          重新选择场景
        </button>
        <button
          onClick={() => navigate(`/scenario/${id}`)}
          className="flex-1 py-3 rounded-xl text-sm font-medium text-white active:opacity-80"
          style={{ backgroundColor: '#FF6B35' }}
        >
          再次练习
        </button>
      </div>
    </div>
  )
}
