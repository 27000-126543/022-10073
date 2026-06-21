import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { events } from '@/data/events'
import { scenarios } from '@/data/scenarios'
import { categoryLabels } from '@/data/types'
import type { EventCategory } from '@/data/types'

const categoryBadgeStyles: Record<EventCategory, string> = {
  material: 'bg-blue-100 text-blue-800',
  quality: 'bg-orange-100 text-orange-800',
  safety: 'bg-red-100 text-red-800',
  record: 'bg-green-100 text-green-800',
}

export default function OnSiteJudgment() {
  const navigate = useNavigate()
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const { currentEventIndex, answers, setEventIndex, submitAnswer, calculateResult } = useStore()

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

  useEffect(() => {
    if (existingAnswer) {
      setSelectedAction(existingAnswer.selectedActionIndex)
      setReasonInput(existingAnswer.reason)
    } else {
      setSelectedAction(null)
      setReasonInput('')
    }
  }, [currentEventIndex, existingAnswer])

  const isFirstStep = currentEventIndex === 0
  const isLastStep = currentEventIndex === totalEvents - 1
  const canGoNext = selectedAction !== null

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (isAnimating) return

      if (direction === 'prev' && isFirstStep) return
      if (direction === 'next' && !canGoNext) return

      if (direction === 'next' && currentEvent) {
        submitAnswer(currentEvent.id, selectedAction!, reasonInput)
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
        setEventIndex(nextIndex)
        setSlideDirection(null)
        setIsAnimating(false)
      }, 250)
    },
    [
      isAnimating,
      isFirstStep,
      isLastStep,
      canGoNext,
      currentEvent,
      selectedAction,
      reasonInput,
      currentEventIndex,
      submitAnswer,
      calculateResult,
      navigate,
      scenarioId,
      setEventIndex,
    ]
  )

  if (!currentEvent || !scenario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F0]">
        <p className="text-[#4A4A4A]">场景数据未找到</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A4A4A]">
              步骤 {currentEventIndex + 1}/{totalEvents}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {scenarioEvents.map((evt, idx) => {
              const isCompleted = idx < currentEventIndex
              const isCurrent = idx === currentEventIndex
              const hasAnswer = answers.some((a) => a.eventId === evt.id)

              return (
                <div key={evt.id} className="flex items-center">
                  {idx > 0 && (
                    <div
                      className={cn(
                        'h-0.5 w-3',
                        idx <= currentEventIndex ? 'bg-[#FF6B35]' : 'bg-gray-300'
                      )}
                    />
                  )}
                  {isCompleted || (isCurrent && hasAnswer) ? (
                    <CheckCircle className="h-4 w-4 text-[#FF6B35]" />
                  ) : isCurrent ? (
                    <Circle className="h-4 w-4 fill-[#FF6B35] text-[#FF6B35]" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-white px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-[#4A4A4A]">
            <span className="font-medium">{scenario.name}</span>
            <span className="text-gray-400">|</span>
            <span>{scenario.weather}</span>
            <span className="text-gray-400">|</span>
            <span>{scenario.concreteGrade}</span>
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
            <span
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                categoryBadgeStyles[currentEvent.category]
              )}
            >
              {categoryLabels[currentEvent.category]}
            </span>
          </div>

          <p className="mb-6 text-[15px] leading-relaxed text-gray-600">
            {currentEvent.description}
          </p>

          <div className="mb-6 space-y-2.5">
            {currentEvent.actionOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedAction(idx)}
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
            <label className="mb-2 block text-sm font-medium text-[#4A4A4A]">
              简述你的判断理由
            </label>
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="请输入你选择该动作的理由..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#4A4A4A] placeholder-gray-400 transition-colors focus:border-[#2B5EA7] focus:outline-none"
            />
            <div className="mt-1 text-right text-xs text-gray-400">
              {reasonInput.length} 字
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
            {isLastStep ? '查看复盘结果' : '下一步'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
