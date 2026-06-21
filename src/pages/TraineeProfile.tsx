import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  GraduationCap,
  Crosshair,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  Trophy,
  Calendar,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import type { TrainingMode } from '@/data/types'
import { trainingModeLabels } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const modeIcons: Record<TrainingMode, React.ComponentType<{ className?: string }>> = {
  beginner: GraduationCap,
  focus: Crosshair,
  exam: ClipboardCheck,
}

const modeColors: Record<TrainingMode, { bg: string; border: string; text: string }> = {
  beginner: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' },
  focus: { bg: 'bg-orange-50', border: 'border-[#FF6B35]', text: 'text-[#FF6B35]' },
  exam: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${mins}`
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  if (mins === 0) return `${secs}秒`
  return `${mins}分${secs}秒`
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-[#FF6B35]'
  return 'text-red-600'
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100'
  if (score >= 60) return 'bg-orange-100'
  return 'bg-red-100'
}

const modeOrder: Record<TrainingMode, number> = {
  beginner: 0,
  focus: 1,
  exam: 2,
}

export default function TraineeProfile() {
  const { traineeId } = useParams<{ traineeId: string }>()
  const navigate = useNavigate()
  const trainees = useStore((s) => s.trainees)
  const trainingRecords = useStore((s) => s.trainingRecords)
  const loadTrainingRecord = useStore((s) => s.loadTrainingRecord)

  const trainee = trainees.find((t) => t.id === traineeId)

  const records = useMemo(() => {
    if (!traineeId) return []
    return trainingRecords
      .filter((r) => r.traineeId === traineeId)
      .sort((a, b) => b.completedAt - a.completedAt)
  }, [trainingRecords, traineeId])

  const summary = useMemo(() => {
    if (records.length === 0) {
      return { totalSessions: 0, bestScore: 0, passRate: 0 }
    }
    const bestScore = Math.max(...records.map((r) => r.score))
    const passCount = records.filter((r) => r.teacherComment?.passed === true).length
    const passRate = Math.round((passCount / records.length) * 100)
    return { totalSessions: records.length, bestScore, passRate }
  }, [records])

  const pendingItems = useMemo(() => {
    const items: { recordId: string; scenarioName: string; title: string; content: string; category: string }[] = []
    for (const r of records) {
      for (const ai of r.scoreResult.actionItems) {
        if (!ai.completed) {
          items.push({
            recordId: r.id,
            scenarioName: r.scenarioName,
            title: ai.title,
            content: ai.content,
            category: ai.category,
          })
        }
      }
    }
    return items
  }, [records])

  const modeTimeline = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.completedAt - b.completedAt)
    const seen = new Set<TrainingMode>()
    const timeline: { mode: TrainingMode; firstAt: number }[] = []
    for (const r of sorted) {
      if (!seen.has(r.mode)) {
        seen.add(r.mode)
        timeline.push({ mode: r.mode, firstAt: r.completedAt })
      }
    }
    timeline.sort((a, b) => modeOrder[a.mode] - modeOrder[b.mode])
    return timeline
  }, [records])

  if (!trainee) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#4A4A4A]">未找到该学员</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 rounded-lg bg-[#2B5EA7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234d87]"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#F5F5F0]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #4A4A4A 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#4A4A4A] transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </button>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2B5EA7] shadow-lg shadow-[#2B5EA7]/25">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#4A4A4A]">{trainee.name}</h1>
              <p className="text-xs text-gray-400">学员个人档案</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-[#F5F5F0] px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileText className="h-3.5 w-3.5 text-[#2B5EA7]" />
                <p className="text-[11px] text-gray-400">训练次数</p>
              </div>
              <p className="text-2xl font-bold text-[#4A4A4A]">{summary.totalSessions}</p>
            </div>
            <div className="rounded-lg bg-[#F5F5F0] px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-3.5 w-3.5 text-[#FF6B35]" />
                <p className="text-[11px] text-gray-400">最佳得分</p>
              </div>
              <p className={cn('text-2xl font-bold', summary.bestScore > 0 ? getScoreColor(summary.bestScore) : 'text-gray-300')}>
                {summary.bestScore > 0 ? summary.bestScore : '-'}
              </p>
            </div>
            <div className="rounded-lg bg-[#F5F5F0] px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <p className="text-[11px] text-gray-400">通过率</p>
              </div>
              <p className={cn('text-2xl font-bold', summary.passRate >= 80 ? 'text-green-600' : summary.passRate >= 50 ? 'text-[#FF6B35]' : summary.totalSessions > 0 ? 'text-red-600' : 'text-gray-300')}>
                {summary.totalSessions > 0 ? `${summary.passRate}%` : '-'}
              </p>
            </div>
          </div>
        </div>

        {modeTimeline.length > 0 && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#2B5EA7]" />
              <h2 className="text-base font-semibold text-[#4A4A4A]">模式变化</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {modeTimeline.map((entry, idx) => {
                const Icon = modeIcons[entry.mode]
                const colors = modeColors[entry.mode]
                return (
                  <div key={entry.mode} className="flex items-center gap-2">
                    <div className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5', colors.bg, colors.border)}>
                      <Icon className={cn('h-4 w-4', colors.text)} />
                      <span className={cn('text-sm font-medium', colors.text)}>{trainingModeLabels[entry.mode]}</span>
                    </div>
                    {idx < modeTimeline.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {pendingItems.length > 0 && (
          <div className="mb-6 rounded-xl border-2 border-orange-200 bg-orange-50/50 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF6B35]" />
              <h2 className="text-base font-semibold text-[#4A4A4A]">未完成整改汇总</h2>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {pendingItems.length}项
              </span>
            </div>
            <div className="space-y-2">
              {pendingItems.map((item, idx) => (
                <div
                  key={`${item.recordId}-${idx}`}
                  className="rounded-lg border border-orange-200 bg-white px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-[#FF6B35]">
                      {item.scenarioName}
                    </span>
                    <span className="text-sm font-medium text-[#4A4A4A]">{item.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-semibold text-[#4A4A4A]">训练记录</h2>
          </div>
          {records.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">暂无训练记录</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map((record) => {
                const uncompleted = record.scoreResult.actionItems.filter((a) => !a.completed)
                return (
                  <button
                    key={record.id}
                    onClick={() => {
                      loadTrainingRecord(record.id)
                      navigate(`/review/${record.scenarioId}`)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        getScoreBgColor(record.score)
                      )}
                    >
                      <span className={cn('text-sm font-bold', getScoreColor(record.score))}>
                        {record.score}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-[#4A4A4A] truncate">{record.scenarioName}</p>
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                            modeColors[record.mode].bg,
                            modeColors[record.mode].text
                          )}
                        >
                          {trainingModeLabels[record.mode]}
                        </span>
                        {record.teacherComment && (
                          record.teacherComment.passed ? (
                            <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              通过
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                              <XCircle className="h-2.5 w-2.5" />
                              待改进
                            </span>
                          )
                        )}
                        {uncompleted.length > 0 && (
                          <span className="flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-[#FF6B35]">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {uncompleted.length}项待整改
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(record.completedAt)}
                        <Clock className="h-3 w-3 ml-1" />
                        {formatDuration(record.totalTime)}
                        <span className="ml-1">{record.totalEvents}题</span>
                      </div>
                      {record.teacherComment && (
                        <p className="mt-1 text-xs text-gray-500 truncate">
                          老师评语：{record.teacherComment.comment}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
