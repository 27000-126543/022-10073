import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Sun,
  MapPin,
  Droplet,
  Truck,
  Users,
  AlertCircle,
  Save,
  Home,
  Clock,
  Lightbulb,
  GraduationCap,
  Crosshair,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { events } from '@/data/events'
import { scenarios } from '@/data/scenarios'
import { categoryLabels, trainingModeLabels } from '@/data/types'
import type { EventCategory, TrainingMode } from '@/data/types'
import { getHintForEvent } from '@/data/scoring'

const categoryBadgeStyles: Record<EventCategory, string> = {
  material: 'bg-blue-100 text-blue-800',
  quality: 'bg-orange-100 text-orange-800',
  safety: 'bg-red-100 text-red-800',
  record: 'bg-green-100 text-green-800',
}

const modeIcons: Record<TrainingMode, React.ComponentType<{ className?: string }>> = {
  beginner: GraduationCap,
  focus: Crosshair,
  exam: ClipboardCheck,
}

const modeColors: Record<TrainingMode, { bg: string; text: string }> = {
  beginner: { bg: 'bg-blue-50', text: 'text-blue-700' },
  focus: { bg: 'bg-orange-50', text: 'text-[#FF6B35]' },
  exam: { bg: 'bg-purple-50', text: 'text-purple-700' },
}

const MIN_REASON_LENGTH = 5

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function OnSiteJudgment() {
  const navigate = useNavigate()
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const {
    currentEventIndex,
    answers,
    setEventIndex,
    submitAnswer,
    calculateResult,
    selectedScenarioId,
    selectScenario,
    inProgressState,
    trainingMode,
    startTime,
  } = useStore()

  const [elapsedTime, setElapsedTime] = useState(0)

  const scenarioEvents = events.filter((e) => e.scenarioId === scenarioId)
  const scenario = scenarios.find((s) => s.id === scenarioId)
  const currentEvent = scenarioEvents[currentEventIndex]
  const totalEvents = scenarioEvents.length

  const existingAnswer = currentEvent
    ? answers.find((a) => a.eventId === currentEvent.id)
    : undefined

  const [selectedAction, setSelectedAction] = useState<number | null>(null)
  const [reasonInput, setReasonInput] = useState('')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showReasonError, setShowReasonError] = useState(false)

  const hint = currentEvent ? getHintForEvent(currentEvent, trainingMode) : null

  useEffect(() => {
    if (!startTime) return
    const tick = () => {
      setElapsedTime(Date.now() - startTime)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  useEffect(() => {
    if (!scenarioId || selectedScenarioId === scenarioId) return
    selectScenario(scenarioId, true)
  }, [scenarioId, selectedScenarioId, selectScenario, inProgressState])

  useEffect(() => {
    if (existingAnswer) {
      setSelectedAction(existingAnswer.selectedActionIndex)
      setReasonInput(existingAnswer.reason)
    } else {
      setSelectedAction(null)
      setReasonInput('')
    }
    setShowReasonError(false)
  }, [currentEventIndex, existingAnswer])

  useEffect(() => {
    if (currentEvent && !inProgressState?.perEventStartTime[currentEvent.id]) {
      setEventIndex(currentEventIndex, currentEvent.id)
    }
  }, [currentEventIndex, currentEvent])

  const isFirstStep = currentEventIndex === 0
  const isLastStep = currentEventIndex === totalEvents - 1
  const reasonValid = reasonInput.trim().length >= MIN_REASON_LENGTH
  const canGoNext = selectedAction !== null && reasonValid

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (isAnimating) return
      if (direction === 'prev' && isFirstStep) return

      if (direction === 'next') {
        if (selectedAction === null) return
        if (!reasonValid) {
          setShowReasonError(true)
          return
        }
      }

      if (direction === 'next' && currentEvent) {
        submitAnswer(currentEvent.id, selectedAction!, reasonInput.trim())
      }

      if (direction === 'next' && isLastStep) {
        calculateResult()
        navigate(`/review/${scenarioId}`)
        return
      }

      setSlideDirection(direction === 'next' ? 'left' : 'right')
      setIsAnimating(true)

      setTimeout(() => {
        const nextIndex = direction === 'next' ? currentEventIndex + 1 : currentEventIndex - 1
        const nextEvent = scenarioEvents[nextIndex]
        setEventIndex(nextIndex, nextEvent?.id)
        setSlideDirection(null)
        setIsAnimating(false)
      }, 250)
    },
    [
      isAnimating,
      isFirstStep,
      isLastStep,
      selectedAction,
      reasonValid,
      currentEvent,
      reasonInput,
      currentEventIndex,
      submitAnswer,
      setEventIndex,
      calculateResult,
      navigate,
      scenarioId,
      scenarioEvents,
    ]
  )

  const handleBackHome = () => {
    navigate('/')
  }

  if (!currentEvent || !scenario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F0]">
        <p className="text-[#4A4A4A]">场景数据未找到</p>
      </div>
    )
  }

  const progressPct = Math.round(
    ((currentEventIndex + (existingAnswer ? 1 : 0)) / totalEvents) * 100
  )

  const ModeIcon = modeIcons[trainingMode]

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackHome}
              className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#4A4A4A]"
            >
              <Home className="h-4 w-4" />
              返回首页
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(elapsedTime)}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Save className="h-3.5 w-3.5" />
                自动保存
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5">
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#4A4A4A]">{scenario.name}</span>
              <span className="rounded-full bg-[#FF6B35]/10 px-2 py-0.5 text-[10px] font-medium text-[#FF6B35]">
                旁站进行中
              </span>
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  modeColors[trainingMode].bg,
                  modeColors[trainingMode].text
                )}
              >
                <ModeIcon className="h-3 w-3" />
                {trainingModeLabels[trainingMode]}
              </span>
            </div>
            <span className="text-sm font-medium text-[#4A4A4A]">
              {currentEventIndex + 1}/{totalEvents}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#FF6B35] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Sun className="h-3.5 w-3.5 shrink-0 text-[#FF6B35]" />
              <span className="truncate">{scenario.weather}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2B5EA7]" />
              <span className="truncate">{scenario.pourPart}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Droplet className="h-3.5 w-3.5 shrink-0 text-green-600" />
              <span className="truncate">{scenario.concreteGrade}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Truck className="h-3.5 w-3.5 shrink-0 text-purple-600" />
              <span className="truncate">{scenario.pumpMethod}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
              <Users className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <span className="truncate">{scenario.personnelConfig}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A4A]">时间线进度</span>
          </div>
          <div className="flex items-center gap-1">
            {scenarioEvents.map((evt, idx) => {
              const isCompleted = idx < currentEventIndex
              const isCurrent = idx === currentEventIndex
              const hasAnswer = answers.some((a) => a.eventId === evt.id)

              return (
                <div key={evt.id} className="flex items-center">
                  {idx > 0 && (
                    <div
                      className={cn(
                        'h-0.5 w-2 flex-1',
                        idx <= currentEventIndex ? 'bg-[#FF6B35]' : 'bg-gray-300'
                      )}
                    />
                  )}
                  {isCompleted || (isCurrent && hasAnswer) ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#FF6B35]" />
                  ) : isCurrent ? (
                    <Circle className="h-4 w-4 shrink-0 fill-[#FF6B35] text-[#FF6B35]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div
          className={cn(
            'rounded-xl bg-white p-6 shadow-sm transition-all duration-250',
            isAnimating && slideDirection === 'left' && '-translate-x-8 opacity-0',
            isAnimating && slideDirection === 'right' && 'translate-x-8 opacity-0',
            !isAnimating && 'translate-x-0 opacity-100'
          )}
        >
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-xl font-bold text-[#4A4A4A]">{currentEvent.title}</h2>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  categoryBadgeStyles[currentEvent.category]
                )}
              >
                {categoryLabels[currentEvent.category]}
              </span>
            </div>
          </div>

          <p className="mb-6 text-[15px] leading-relaxed text-gray-600">
            {currentEvent.description}
          </p>

          {hint && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50/60 p-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              <div>
                <p className="text-xs font-medium text-yellow-700">新手提示</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-yellow-800/90">{hint}</p>
              </div>
            </div>
          )}

          <div className="mb-6 space-y-2.5">
            <p className="text-sm font-medium text-[#4A4A4A]">选择你的处置动作：</p>
            {currentEvent.actionOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedAction(idx)
                  setShowReasonError(false)
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all hover:border-[#FF6B35]/50 hover:bg-orange-50/30',
                  selectedAction === idx
                    ? 'border-[#FF6B35] bg-orange-50/50'
                    : 'border-gray-200 bg-white'
                )}
              >
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    selectedAction === idx ? 'border-[#FF6B35]' : 'border-gray-300'
                  )}
                >
                  {selectedAction === idx && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FF6B35]" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    selectedAction === idx ? 'font-medium text-[#4A4A4A]' : 'text-gray-600'
                  )}
                >
                  {option}
                </span>
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#4A4A4A]">
                简述你的判断理由 <span className="text-[#FF6B35]">*</span>
              </label>
              {showReasonError && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  请填写至少{MIN_REASON_LENGTH}字的理由
                </span>
              )}
            </div>
            <textarea
              value={reasonInput}
              onChange={(e) => {
                setReasonInput(e.target.value)
                if (showReasonError && e.target.value.trim().length >= MIN_REASON_LENGTH) {
                  setShowReasonError(false)
                }
              }}
              placeholder="请输入你选择该动作的理由，至少5字..."
              rows={3}
              className={cn(
                'w-full resize-none rounded-lg border px-4 py-3 text-sm text-[#4A4A4A] placeholder-gray-400 transition-colors focus:outline-none',
                showReasonError
                  ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                  : 'border-gray-200 focus:border-[#2B5EA7]'
              )}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>至少 {MIN_REASON_LENGTH} 字</span>
              <span>{reasonInput.trim().length} 字</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => handleNavigate('prev')}
            disabled={isFirstStep || isAnimating}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
              isFirstStep
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'bg-gray-200 text-[#4A4A4A] hover:bg-gray-300'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            上一步
          </button>

          <button
            onClick={() => handleNavigate('next')}
            disabled={!canGoNext || isAnimating}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors',
              canGoNext
                ? 'bg-[#FF6B35] hover:bg-[#e55e2e]'
                : 'cursor-not-allowed bg-gray-300'
            )}
          >
            {isLastStep ? '提交并查看结果' : '下一步'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          提示：理由描述越详细，越有助于你记忆旁站要点
        </p>
      </div>
    </div>
  )
}
