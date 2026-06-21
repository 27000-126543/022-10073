import { useState, useEffect, useRef } from 'react'
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
  Home,
  RotateCcw,
  Award,
  Clock,
  GraduationCap,
  Crosshair,
  ClipboardCheck,
  Check,
  FileSearch,
  Video,
  Wrench,
  ListTodo,
  BarChart3,
  User,
  MessageSquare,
  Printer,
  Download,
  ThumbsUp,
  ThumbsDown,
  Save,
  ClipboardList,
  Copy,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { events } from '@/data/events'
import { scenarios } from '@/data/scenarios'
import {
  categoryLabels,
  trainingModeLabels,
  actionItemTypeLabels,
} from '@/data/types'
import type {
  ScoreResult,
  EventCategory,
  Issue,
  TrainingMode,
  ActionItem,
  TrainingRecord,
} from '@/data/types'
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

const modeIcons: Record<TrainingMode, React.ComponentType<{ className?: string }>> = {
  beginner: GraduationCap,
  focus: Crosshair,
  exam: ClipboardCheck,
}

const modeColors: Record<TrainingMode, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  focus: { bg: 'bg-orange-50', text: 'text-[#FF6B35]', border: 'border-orange-200' },
  exam: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}

const actionItemTypeIcons: Record<ActionItem['type'], React.ComponentType<{ className?: string }>> = {
  recheck: FileSearch,
  record: Video,
  action: Wrench,
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  if (mins === 0) return `${secs}秒`
  return `${mins}分${secs}秒`
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

function formatDateShort(timestamp: number): string {
  const d = new Date(timestamp)
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${mins}`
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
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {animatedScore}
        </span>
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
            <p className="text-sm font-semibold text-[#4A4A4A]">{categoryLabels[category]}</p>
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
    suggestion.priority === 'high'
      ? '重点关注'
      : suggestion.priority === 'medium'
        ? '建议加强'
        : '持续巩固'
  const priorityColor =
    suggestion.priority === 'high'
      ? 'bg-red-100 text-red-700'
      : suggestion.priority === 'medium'
        ? 'bg-orange-100 text-orange-700'
        : 'bg-green-100 text-green-700'

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

function ActionItemsChecklist({
  actionItems,
  onToggle,
  recordId,
}: {
  actionItems: ActionItem[]
  onToggle: (actionItemId: string) => void
  recordId: string | null
}) {
  const [expanded, setExpanded] = useState(true)

  if (actionItems.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-500" />
        <p className="text-sm font-medium text-[#4A4A4A]">全部正确，无需整改</p>
        <p className="mt-1 text-xs text-gray-400">所有旁站职责均按规范执行，保持即可</p>
      </div>
    )
  }

  const completedCount = actionItems.filter((a) => a.completed).length

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between bg-gradient-to-r from-orange-50 to-transparent px-4 py-3 transition-colors hover:from-orange-100/60"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6B35]/10 text-[#FF6B35]">
            <ListTodo className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#4A4A4A]">整改待办清单</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span>
                已完成 {completedCount}/{actionItems.length}
              </span>
              <span>·</span>
              <span>可勾选完成并保存</span>
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
        <div className="divide-y divide-gray-100 px-4 pb-4 pt-2">
          {actionItems.map((item) => {
            const TypeIcon = actionItemTypeIcons[item.type]
            const color = categoryColors[item.category]
            return (
              <label
                key={item.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 py-3 transition-colors hover:bg-gray-50/50',
                  item.completed && 'opacity-60'
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  disabled={!recordId}
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                    item.completed
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 hover:border-[#FF6B35]',
                    !recordId && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {item.completed && <Check className="h-3 w-3 text-white" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        categoryBgColors[item.category]
                      )}
                    >
                      <TypeIcon className="h-3 w-3" />
                      {actionItemTypeLabels[item.type]}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        item.completed ? 'text-gray-500 line-through' : 'text-[#4A4A4A]'
                      )}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-[13px] leading-relaxed',
                      item.completed ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    {item.content}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TeacherCommentSection({
  record,
  onSave,
}: {
  record: TrainingRecord | null
  onSave: (comment: string, passed: boolean) => void
}) {
  const [comment, setComment] = useState(record?.teacherComment?.comment || '')
  const [passed, setPassed] = useState<boolean>(record?.teacherComment?.passed || false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setComment(record?.teacherComment?.comment || '')
    setPassed(record?.teacherComment?.passed || false)
    setHasChanges(false)
  }, [record?.id])

  const handleCommentChange = (val: string) => {
    setComment(val)
    setHasChanges(true)
  }

  const handlePassedChange = (val: boolean) => {
    setPassed(val)
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(comment, passed)
    setHasChanges(false)
  }

  const isReadOnly = !record

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-blue-50 to-transparent px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B5EA7]/10 text-[#2B5EA7]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#4A4A4A]">老师点评与复盘结论</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span>填写点评并标记是否通过</span>
              {hasChanges && <span className="text-[#FF6B35]">· 有未保存的修改</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        {isReadOnly ? (
          <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">
            完成练习后可填写老师点评
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-xs text-gray-500">结论：</span>
              <button
                type="button"
                onClick={() => handlePassedChange(true)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  passed
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                通过
              </button>
              <button
                type="button"
                onClick={() => handlePassedChange(false)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  !passed
                    ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                待改进
              </button>
            </div>

            <textarea
              value={comment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="填写老师点评，记录本次训练的亮点、不足和改进方向..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#4A4A4A] placeholder-gray-400 focus:border-[#2B5EA7] focus:outline-none focus:ring-1 focus:ring-[#2B5EA7]/30"
            />

            <div className="mt-3 flex items-center justify-between">
              {record.teacherComment && (
                <span className="text-[11px] text-gray-400">
                  上次更新：{formatDate(record.teacherComment.updatedAt)}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors',
                  hasChanges
                    ? 'bg-[#2B5EA7] text-white hover:bg-[#234d87]'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400'
                )}
              >
                <Save className="h-3.5 w-3.5" />
                保存点评
              </button>
            </div>

            {comment.trim() && (
              <div className="mt-3 rounded-lg bg-blue-50/60 p-3">
                <p className="text-xs font-medium text-[#2B5EA7]">预览：</p>
                <p className="mt-1 text-sm leading-relaxed text-[#4A4A4A]">{comment}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">结论：</span>
                  {passed ? (
                    <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      <ThumbsUp className="h-2.5 w-2.5" />
                      通过
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                      <ThumbsDown className="h-2.5 w-2.5" />
                      待改进
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TeachingOutlineSection({
  record,
  scenarioName,
}: {
  record: TrainingRecord | null
  scenarioName: string
}) {
  const [copied, setCopied] = useState(false)

  if (!record) return null

  const issues = record.scoreResult.issues || []
  const actionItems = record.scoreResult.actionItems || []
  const teacherComment = record.teacherComment
  const errors = issues.filter((i) => i.type === 'error')
  const warnings = issues.filter((i) => i.type === 'warning')
  const pendingItems = actionItems.filter((a) => !a.completed)
  const traineeName = record.traineeName || '该学员'

  const lines: string[] = []
  lines.push(`【${traineeName} · ${scenarioName} · ${trainingModeLabels[record.mode]}】讲评提纲`)
  lines.push('')

  lines.push(`一、训练概况`)
  lines.push(`  得分：${record.score}分（${getScoreRating(record.score)}）`)
  lines.push(`  用时：${formatDuration(record.totalTime)}，共${record.totalEvents}题`)
  lines.push('')

  if (errors.length > 0) {
    lines.push(`二、错题讲评（${errors.length}处）`)
    errors.forEach((e, i) => {
      lines.push(`  ${i + 1}.【${categoryLabels[e.category]}】${e.description}`)
      lines.push(`    规范依据：${e.regulation}`)
    })
    lines.push('')
  }

  if (warnings.length > 0) {
    const label = errors.length > 0 ? '三' : '二'
    lines.push(`${label}、待改进项（${warnings.length}处）`)
    warnings.forEach((w, i) => {
      lines.push(`  ${i + 1}.【${categoryLabels[w.category]}】${w.description}`)
    })
    lines.push('')
  }

  if (pendingItems.length > 0) {
    const sectionIdx = [errors.length > 0, warnings.length > 0].filter(Boolean).length
    const label = ['二', '三', '四'][sectionIdx]
    lines.push(`${label}、整改待办（${pendingItems.length}项未完成）`)
    pendingItems.forEach((a, i) => {
      lines.push(`  ${i + 1}.【${actionItemTypeLabels[a.type]}】${a.title}：${a.content}`)
    })
    lines.push('')
  }

  if (teacherComment) {
    const sectionIdx = [errors.length > 0, warnings.length > 0, pendingItems.length > 0].filter(Boolean).length
    const label = ['二', '三', '四', '五'][sectionIdx]
    lines.push(`${label}、老师点评`)
    lines.push(`  ${teacherComment.comment}`)
    lines.push(`  结论：${teacherComment.passed ? '通过' : '待改进'}`)
    lines.push('')
  }

  const outlineText = lines.join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outlineText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = outlineText
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const hasContent = errors.length > 0 || warnings.length > 0 || pendingItems.length > 0 || teacherComment

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-purple-50 to-transparent px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#4A4A4A]">带教讲评提纲</p>
              <div className="text-[11px] text-gray-400">
                自动生成，可复制到班会记录
              </div>
            </div>
          </div>
          <button
            onClick={handleCopy}
            disabled={!hasContent}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              hasContent
                ? copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-600/10 text-purple-600 hover:bg-purple-600/20'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
            )}
          >
            {copied ? (
              <>
                <CheckCheck className="h-3.5 w-3.5" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                复制提纲
              </>
            )}
          </button>
        </div>
      </div>

      {hasContent && (
        <div className="px-4 pb-4 pt-3">
          <pre className="whitespace-pre-wrap rounded-lg bg-[#F5F5F0] p-3 text-xs leading-relaxed text-[#4A4A4A] font-sans">
            {outlineText}
          </pre>
        </div>
      )}

      {!hasContent && (
        <div className="px-4 pb-4 pt-3">
          <p className="text-xs text-gray-400 text-center py-2">
            完成练习并填写老师点评后，讲评提纲将自动生成
          </p>
        </div>
      )}
    </div>
  )
}

function ExportPrintButton({
  record,
  scenarioName,
}: {
  record: TrainingRecord | null
  scenarioName: string
}) {
  const handlePrint = () => {
    if (!record) return

    const traineeName = record.traineeName || '未指定'
    const mode = record.mode
    const totalTime = record.totalTime
    const completedAt = record.completedAt
    const score = record.score
    const issues = record.scoreResult.issues || []
    const actionItems = record.scoreResult.actionItems || []
    const teacherComment = record.teacherComment
    const errors = issues.filter((i) => i.type === 'error')
    const warnings = issues.filter((i) => i.type === 'warning')
    const scoreColor = getScoreColor(score)
    const scoreRating = getScoreRating(score)

    const escapeHtml = (str: string) => {
      const div = document.createElement('div')
      div.textContent = str
      return div.innerHTML
    }

    let issuesHtml = ''
    if (errors.length + warnings.length > 0) {
      issuesHtml += '<h2>旁站问题汇总</h2>'
      if (errors.length > 0) {
        issuesHtml += `<h3>错误项（${errors.length}）</h3>`
        issuesHtml += errors
          .map(
            (i) =>
              `<div class="error"><b>【${categoryLabels[i.category]}】</b>${escapeHtml(i.description)}<br><span style="font-size:11px;color:#999">规范依据：${escapeHtml(i.regulation)}</span></div>`
          )
          .join('')
      }
      if (warnings.length > 0) {
        issuesHtml += `<h3>待改进项（${warnings.length}）</h3>`
        issuesHtml += warnings
          .map(
            (i) =>
              `<div class="warning"><b>【${categoryLabels[i.category]}】</b>${escapeHtml(i.description)}<br><span style="font-size:11px;color:#999">规范依据：${escapeHtml(i.regulation)}</span></div>`
          )
          .join('')
      }
    }

    let actionItemsHtml = ''
    if (actionItems.length > 0) {
      actionItemsHtml += '<h2>整改待办清单</h2>'
      actionItemsHtml += actionItems
        .map((a) => {
          const doneClass = a.completed ? 'action-done' : ''
          return `
            <div class="action-item">
              <div class="action-checkbox"></div>
              <div>
                <div class="${doneClass}">
                  <b>【${actionItemTypeLabels[a.type]}】</b>${escapeHtml(a.title)}
                </div>
                <div style="font-size: 11px; color: #666;" class="${doneClass}">${escapeHtml(a.content)}</div>
              </div>
            </div>
          `
        })
        .join('')
    }

    let commentHtml = ''
    if (teacherComment) {
      const conclusionClass = teacherComment.passed ? 'conclusion pass' : 'conclusion fail'
      const conclusionText = teacherComment.passed ? '通过' : '待改进'
      commentHtml = `
        <h2>老师点评与结论</h2>
        <div class="comment">
          ${teacherComment.comment.split('\n').map((p) => `<div>${escapeHtml(p)}</div>`).join('')}
          <div class="${conclusionClass}">
            结论：${conclusionText}
          </div>
          <div style="font-size: 10px; color: #999; margin-top: 6px;">
            点评时间：${formatDate(teacherComment.updatedAt)}
          </div>
        </div>
      `
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>旁站训练复盘报告 - ${escapeHtml(traineeName)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, "Noto Sans SC", sans-serif; font-size: 12px; line-height: 1.6; color: #333; padding: 20px; }
          h1 { font-size: 18px; text-align: center; margin-bottom: 4px; color: #2B5EA7; }
          h2 { font-size: 14px; margin-top: 16px; margin-bottom: 8px; color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 4px; }
          h3 { font-size: 13px; margin-top: 12px; margin-bottom: 6px; color: #4A4A4A; }
          .header { text-align: center; border-bottom: 2px solid #2B5EA7; padding-bottom: 12px; margin-bottom: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
          .info-item { display: flex; }
          .info-label { color: #666; width: 70px; }
          .info-value { font-weight: 500; color: #333; }
          .score-box { text-align: center; margin: 16px 0; }
          .score-number { font-size: 48px; font-weight: bold; color: ${scoreColor}; }
          .score-rating { font-size: 14px; color: ${scoreColor}; }
          .error { background: #fef2f2; border-left: 3px solid #dc2626; padding: 6px 8px; margin-bottom: 4px; }
          .warning { background: #fffbeb; border-left: 3px solid #d97706; padding: 6px 8px; margin-bottom: 4px; }
          .action-item { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px dashed #ddd; }
          .action-checkbox { width: 16px; height: 16px; border: 1px solid #999; border-radius: 3px; flex-shrink: 0; margin-top: 2px; }
          .action-done { text-decoration: line-through; color: #999; }
          .comment { background: #eff6ff; border-left: 3px solid #2B5EA7; padding: 10px; margin-top: 8px; }
          .conclusion { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-top: 4px; }
          .pass { background: #dcfce7; color: #15803d; }
          .fail { background: #fee2e2; color: #b91c1c; }
          .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>混凝土浇筑旁站训练复盘报告</h1>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            旁站职责情景训练 · 整改清单
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">学员姓名：</span>
            <span class="info-value">${escapeHtml(traineeName)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">训练场景：</span>
            <span class="info-value">${escapeHtml(scenarioName)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">训练模式：</span>
            <span class="info-value">${trainingModeLabels[mode]}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总用时：</span>
            <span class="info-value">${formatDuration(totalTime)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">完成时间：</span>
            <span class="info-value">${formatDate(completedAt)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">题目数量：</span>
            <span class="info-value">${record.totalEvents} 题</span>
          </div>
        </div>

        <div class="score-box">
          <div class="score-number">${score}</div>
          <div class="score-rating">${scoreRating}</div>
        </div>

        ${issuesHtml}
        ${actionItemsHtml}
        ${commentHtml}

        <div class="footer">
          本报告由混凝土浇筑旁站情景练习系统自动生成 · ${new Date().toLocaleString('zh-CN')}
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  return (
    <button
      onClick={handlePrint}
      disabled={!record}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
        record
          ? 'bg-[#2B5EA7]/10 text-[#2B5EA7] hover:bg-[#2B5EA7]/20'
          : 'cursor-not-allowed bg-gray-200 text-gray-400'
      )}
    >
      <Printer className="h-3.5 w-3.5" />
      打印 / 导出
    </button>
  )
}

export default function ResultReview() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const {
    scoreResult,
    answers,
    reset,
    saveTrainingRecord,
    selectedRecordId,
    initFromStorage,
    toggleActionItem,
    restartScenario,
    trainingRecords,
    trainingMode,
    saveTeacherComment,
  } = useStore()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(false)

  const scenario = scenarios.find((s) => s.id === id)
  const scenarioEvents = events
    .filter((e) => e.scenarioId === id)
    .sort((a, b) => a.order - b.order)

  const currentRecord = selectedRecordId
    ? trainingRecords.find((r) => r.id === selectedRecordId)
    : null

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
    const weight = { high: 0, medium: 1, low: 2 } as const
    return weight[a.priority] - weight[b.priority]
  })

  const scoreColor = getScoreColor(scoreResult.totalScore)
  const isFromRecord = !!selectedRecordId
  const displayMode = currentRecord?.mode || trainingMode
  const ModeIcon = modeIcons[displayMode]

  const handleToggleActionItem = (actionItemId: string) => {
    const rid = selectedRecordId
    if (!rid) return
    toggleActionItem(rid, actionItemId)
  }

  const handleRetry = () => {
    restartScenario(id)
    navigate(`/scenario/${id}`)
  }

  const handleSaveComment = (comment: string, passed: boolean) => {
    const rid = selectedRecordId
    if (!rid) return
    saveTeacherComment(rid, comment, passed)
  }

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
            <div className="flex items-center gap-3">
              <ExportPrintButton record={currentRecord} scenarioName={scenario.name} />
              {isFromRecord && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  历史记录 · {currentRecord ? formatDateShort(currentRecord.completedAt) : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <header className="px-4 pt-6 pb-2 text-center">
        <h1 className="text-xl font-bold" style={{ color: '#4A4A4A' }}>
          旁站复盘报告
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {currentRecord?.traineeName && (
            <span className="mr-1">
              <User className="inline h-3.5 w-3.5" /> {currentRecord.traineeName}
            </span>
          )}
          {scenario.name}
        </p>
      </header>

      <section className="mx-4 mt-4 p-6 bg-white rounded-2xl shadow-sm flex flex-col items-center">
        <ScoreRing score={scoreResult.totalScore} />
        <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
          <span className="text-lg font-semibold" style={{ color: scoreColor }}>
            {getScoreRating(scoreResult.totalScore)}
          </span>
          {scoreResult.totalScore >= 80 && (
            <Award className="h-5 w-5" style={{ color: scoreColor }} />
          )}
          <span
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              modeColors[displayMode].bg,
              modeColors[displayMode].text,
              modeColors[displayMode].border
            )}
          >
            <ModeIcon className="h-3 w-3" />
            {trainingModeLabels[displayMode]}
          </span>
          {currentRecord?.teacherComment &&
            (currentRecord.teacherComment.passed ? (
              <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                <CheckCircle2 className="h-2.5 w-2.5" />
                通过
              </span>
            ) : (
              <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                <XCircle className="h-2.5 w-2.5" />
                待改进
              </span>
            ))}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {currentRecord ? formatDuration(currentRecord.totalTime) : '实时'}
          </span>
          <span>·</span>
          <span>{answers.length} 题作答</span>
          {currentRecord && (
            <>
              <span>·</span>
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-1 text-[#2B5EA7] hover:underline"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                {showStats ? '收起详情' : '查看详细数据'}
              </button>
            </>
          )}
        </div>

        {showStats && currentRecord && (
          <div className="mt-4 w-full rounded-lg bg-[#F5F5F0] p-3 text-xs">
            <p className="mb-2 font-medium text-[#4A4A4A]">逐题用时与理由填写情况</p>
            <div className="space-y-1.5">
              {scenarioEvents.map((event) => {
                const answer = currentRecord.answers.find((a) => a.eventId === event.id)
                const timeMs = currentRecord.perEventTime[event.id] || 0
                const isCorrect = answer?.selectedActionIndex === event.correctActionIndex
                const reasonLength = answer?.reason?.trim().length || 0
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 rounded bg-white px-2.5 py-1.5"
                  >
                    <span className="w-5 text-center text-gray-400">{event.order}</span>
                    <span className="flex-1 truncate text-gray-600">{event.title}</span>
                    <span
                      className={cn(
                        'w-10 text-right',
                        isCorrect ? 'text-green-600' : 'text-red-500'
                      )}
                    >
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="w-14 text-right text-gray-400">
                      {formatDuration(timeMs)}
                    </span>
                    <span
                      className={cn(
                        'w-14 text-right',
                        reasonLength >= 10
                          ? 'text-green-600'
                          : reasonLength >= 5
                            ? 'text-yellow-600'
                            : 'text-red-500'
                      )}
                    >
                      {reasonLength}字理由
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>
          得分明细
        </h2>
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
                      style={{
                        backgroundColor: `${categoryColors[key]}15`,
                        color: categoryColors[key],
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: categoryColors[key] }}
                    >
                      {categoryLabels[key]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium" style={{ color: categoryColors[key] }}>
                      {pct}%
                    </span>
                    <span className="text-gray-400">
                      {score}/{max}
                    </span>
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

      <section className="mx-4 mt-4">
        <ActionItemsChecklist
          actionItems={scoreResult.actionItems}
          onToggle={handleToggleActionItem}
          recordId={selectedRecordId}
        />
      </section>

      <section className="mx-4 mt-4">
        <TeacherCommentSection record={currentRecord} onSave={handleSaveComment} />
      </section>

      <section className="mx-4 mt-4">
        <TeachingOutlineSection record={currentRecord} scenarioName={scenario.name} />
      </section>

      {hasAnyIssue && (
        <section className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
          <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>
            旁站职责问题分类
          </h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <CategoryIssueGroup
                key={cat}
                category={cat}
                issues={issuesByCategory[cat]}
              />
            ))}
          </div>
        </section>
      )}

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
        <h2 className="text-base font-semibold mb-4" style={{ color: '#4A4A4A' }}>
          逐题复盘
        </h2>
        <div className="space-y-2">
          {scenarioEvents.map((event) => {
            const answer = answers.find((a) => a.eventId === event.id)
            const isCorrect = answer?.selectedActionIndex === event.correctActionIndex
            const expanded = expandedEvents.has(event.id)
            const timeMs = currentRecord?.perEventTime[event.id] || answer?.timeSpent || 0
            return (
              <div
                key={event.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-gray-50"
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                      {event.order}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium" style={{ color: '#4A4A4A' }}>
                        {event.title}
                      </span>
                      {timeMs > 0 && (
                        <span className="ml-2 text-[10px] text-gray-400">
                          用时 {formatDuration(timeMs)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <X size={16} className="text-red-500" />
                    )}
                    {expanded ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>
                {expanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                    <div className="pt-2">
                      <p className="text-xs text-gray-400 mb-0.5">你的选择</p>
                      <p
                        className="text-sm"
                        style={{ color: isCorrect ? '#16A34A' : '#DC2626' }}
                      >
                        {answer
                          ? event.actionOptions[answer.selectedActionIndex]
                          : '未作答'}
                      </p>
                    </div>
                    {answer && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">你的理由</p>
                        <p className="text-sm text-gray-600">
                          {answer.reason || '未填写'}
                        </p>
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
            onClick={() => {
              reset()
              navigate('/')
            }}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-gray-200 text-gray-700 active:opacity-80 transition-colors hover:bg-gray-300"
          >
            返回首页
          </button>
          <button
            onClick={handleRetry}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white active:opacity-80 transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
          >
            <span className="flex items-center justify-center gap-1.5">
              再次练习
              <RotateCcw className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
