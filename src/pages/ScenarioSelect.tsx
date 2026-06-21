import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Building2,
  Square,
  Split,
  Sun,
  Cloud,
  CloudRain,
  Thermometer,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  Play,
  RotateCcw,
  FileText,
  Truck,
  Users,
  MapPin,
  Droplet,
  Clock,
  X,
  AlertCircle,
  Target,
  Filter,
  GraduationCap,
  Crosshair,
  ClipboardCheck,
  UserPlus,
  User,
  UserCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { scenarios } from '@/data/scenarios'
import type {
  Scenario,
  TrainingRecord,
  InProgressState,
  TrainingMode,
  Trainee,
} from '@/data/types'
import { trainingModeLabels, trainingModeDescriptions } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers,
  Building2,
  Square,
  Split,
}

const weatherIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  晴: Sun,
  多云: Cloud,
  阴: CloudRain,
}

function getWeatherIcon(weather: string) {
  const key = Object.keys(weatherIconMap).find((k) => weather.startsWith(k))
  return key ? weatherIconMap[key] : Thermometer
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  if (sameDay) return `今天 ${hours}:${mins}`
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${mins}`
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

type ScoreFilter = 'all' | '>=80' | '60-79' | '<60'
type ScenarioFilter = string
type TraineeFilter = string

function ScenarioCard({
  scenario,
  isSelected,
  isExiting,
  onToggle,
  onStart,
}: {
  scenario: Scenario
  isSelected: boolean
  isExiting: boolean
  onToggle: () => void
  onStart: (resume: boolean) => void
}) {
  const Icon = iconMap[scenario.icon]
  const WeatherIcon = getWeatherIcon(scenario.weather)
  const inProgressState = useStore((s) => s.inProgressState)
  const hasProgress = inProgressState && inProgressState.scenarioId === scenario.id

  return (
    <div
      className={cn(
        'rounded-xl border-2 bg-white overflow-hidden transition-all duration-300',
        isSelected ? 'border-[#FF6B35] shadow-lg' : 'border-gray-200',
        isExiting && 'opacity-0 scale-95 translate-y-2'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'group relative w-full text-left p-5 transition-colors',
          isSelected ? 'bg-orange-50/30' : 'hover:bg-gray-50'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors',
              isSelected
                ? 'bg-[#2B5EA7] text-white'
                : 'bg-[#2B5EA7]/10 text-[#2B5EA7] group-hover:bg-[#2B5EA7] group-hover:text-white'
            )}
          >
            {Icon && <Icon className="h-6 w-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-[#4A4A4A]">{scenario.name}</h3>
              {hasProgress && (
                <span className="flex items-center gap-1 rounded-full bg-[#FF6B35]/10 px-2 py-0.5 text-[10px] font-medium text-[#FF6B35]">
                  <Clock className="h-3 w-3" />
                  进行中
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{scenario.description}</p>
          </div>
          {isSelected ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-[#FF6B35]" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-gray-300 group-hover:text-[#FF6B35]" />
          )}
        </div>
      </button>

      {isSelected && (
        <div className="border-t border-gray-100 px-5 pb-5">
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-[#F5F5F0] px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                <Sun className="h-4 w-4 text-[#FF6B35]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">天气</p>
                <p className="text-sm font-medium text-[#4A4A4A] truncate">{scenario.weather}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg bg-[#F5F5F0] px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                <MapPin className="h-4 w-4 text-[#2B5EA7]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">浇筑部位</p>
                <p className="text-sm font-medium text-[#4A4A4A] truncate">{scenario.pourPart}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg bg-[#F5F5F0] px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                <Droplet className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">混凝土标号</p>
                <p className="text-sm font-medium text-[#4A4A4A] truncate">{scenario.concreteGrade}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg bg-[#F5F5F0] px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                <Truck className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">泵送方式</p>
                <p className="text-sm font-medium text-[#4A4A4A] truncate">{scenario.pumpMethod}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg bg-[#F5F5F0] px-3 py-2.5 sm:col-span-2 col-span-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">现场人员配置</p>
                <p className="text-sm font-medium text-[#4A4A4A] truncate">{scenario.personnelConfig}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {hasProgress ? (
              <>
                <button
                  onClick={() => onStart(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#FF6B35] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e55e2e]"
                >
                  <Play className="h-4 w-4" />
                  继续练习
                </button>
                <button
                  onClick={() => onStart(false)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-200 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors hover:bg-gray-300"
                >
                  <RotateCcw className="h-4 w-4" />
                  重新开始
                </button>
              </>
            ) : (
              <button
                onClick={() => onStart(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#FF6B35] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e55e2e]"
              >
                <Play className="h-4 w-4" />
                开始练习
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TraineeSelector() {
  const trainees = useStore((s) => s.trainees)
  const currentTraineeId = useStore((s) => s.currentTraineeId)
  const addTrainee = useStore((s) => s.addTrainee)
  const removeTrainee = useStore((s) => s.removeTrainee)
  const setCurrentTrainee = useStore((s) => s.setCurrentTrainee)

  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    addTrainee(trimmed)
    setNewName('')
    setShowInput(false)
  }

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#2B5EA7]" />
          <h2 className="text-base font-semibold text-[#4A4A4A]">带教班组</h2>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="flex items-center gap-1 rounded-md bg-[#2B5EA7]/10 px-2.5 py-1 text-xs font-medium text-[#2B5EA7] transition-colors hover:bg-[#2B5EA7]/20"
        >
          <UserPlus className="h-3.5 w-3.5" />
          新增学员
        </button>
      </div>

      {showInput && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="输入学员姓名..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#4A4A4A] placeholder-gray-400 focus:border-[#2B5EA7] focus:outline-none focus:ring-1 focus:ring-[#2B5EA7]/30"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-lg bg-[#2B5EA7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234d87] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            添加
          </button>
          <button
            onClick={() => setShowInput(false)}
            className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-300"
          >
            取消
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCurrentTrainee(null)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
            currentTraineeId === null
              ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
              : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
          )}
        >
          <User className="h-3.5 w-3.5" />
          未指定
        </button>
        {trainees.map((t) => (
          <div
            key={t.id}
            className={cn(
              'group flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
              currentTraineeId === t.id
                ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            <button
              onClick={() => setCurrentTrainee(t.id)}
              className="flex items-center gap-1.5"
            >
              <UserCheck className="h-3.5 w-3.5" />
              {t.name}
            </button>
            <button
              onClick={() => removeTrainee(t.id)}
              className="ml-1 opacity-0 text-gray-400 transition-opacity hover:text-red-500 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {trainees.length === 0 && (
          <p className="py-2 text-sm text-gray-400">还未添加学员，点击"新增学员"录入班组人员</p>
        )}
      </div>
    </div>
  )
}

function TeamDashboard() {
  const navigate = useNavigate()
  const trainees = useStore((s) => s.trainees)
  const trainingRecords = useStore((s) => s.trainingRecords)

  const traineeStats = useMemo(() => {
    return trainees.map((t) => {
      const records = trainingRecords.filter((r) => r.traineeId === t.id)
      const sortedRecords = [...records].sort((a, b) => b.completedAt - a.completedAt)
      const lastRecord = sortedRecords[0] || null
      const passCount = records.filter((r) => r.teacherComment?.passed === true).length
      const pendingCount = records.reduce(
        (sum, r) => sum + r.scoreResult.actionItems.filter((a) => !a.completed).length,
        0
      )
      const lastScore = lastRecord?.score ?? null
      const lastTime = lastRecord?.completedAt ?? null
      const needsAttention = pendingCount > 0 || passCount === 0
      return { trainee: t, records, lastScore, passCount, pendingCount, lastTime, needsAttention }
    })
  }, [trainees, trainingRecords])

  if (trainees.length === 0) {
    return (
      <div className="mb-8 rounded-xl border border-dashed border-gray-300 bg-white/60 px-6 py-6 text-center backdrop-blur-sm">
        <TrendingUp className="mx-auto mb-2 h-6 w-6 text-gray-300" />
        <p className="text-sm text-gray-400">添加学员后可查看班组训练看板</p>
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-[#2B5EA7]" />
        <h2 className="text-base font-semibold text-[#4A4A4A]">班组训练看板</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {traineeStats.map(({ trainee, lastScore, passCount, pendingCount, lastTime, needsAttention }) => (
          <button
            key={trainee.id}
            onClick={() => navigate(`/trainee/${trainee.id}`)}
            className={cn(
              'group relative rounded-xl border-2 p-3.5 text-left transition-all hover:shadow-md',
              needsAttention
                ? 'border-orange-300 bg-orange-50/50 hover:border-[#FF6B35]'
                : 'border-gray-200 bg-white hover:border-[#2B5EA7]/40'
            )}
          >
            {needsAttention && (
              <div className="absolute right-2 top-2">
                <AlertTriangle className="h-4 w-4 text-[#FF6B35]" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  needsAttention ? 'bg-orange-100' : 'bg-[#2B5EA7]/10'
                )}
              >
                <UserCheck className={cn('h-4 w-4', needsAttention ? 'text-[#FF6B35]' : 'text-[#2B5EA7]')} />
              </div>
              <span className="text-sm font-bold text-[#4A4A4A] truncate">{trainee.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-400">最近得分</p>
                <p className={cn('text-base font-bold', lastScore !== null ? getScoreColor(lastScore) : 'text-gray-300')}>
                  {lastScore !== null ? lastScore : '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">通过</p>
                <p className={cn('text-base font-bold', passCount > 0 ? 'text-green-600' : 'text-gray-300')}>
                  {passCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">待整改</p>
                <p className={cn('text-base font-bold', pendingCount > 0 ? 'text-red-600' : 'text-gray-300')}>
                  {pendingCount}
                </p>
              </div>
            </div>
            {lastTime !== null && (
              <p className="mt-2 text-[10px] text-gray-400">
                最近训练：{formatDate(lastTime)}
              </p>
            )}
            <div className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function TrainingModeSelector() {
  const trainingMode = useStore((s) => s.trainingMode)
  const setTrainingMode = useStore((s) => s.setTrainingMode)

  const modes: TrainingMode[] = ['beginner', 'focus', 'exam']

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-5 w-5 text-[#FF6B35]" />
        <h2 className="text-base font-semibold text-[#4A4A4A]">训练目标模式</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {modes.map((mode) => {
          const Icon = modeIcons[mode]
          const colors = modeColors[mode]
          const isActive = trainingMode === mode
          return (
            <button
              key={mode}
              onClick={() => setTrainingMode(mode)}
              className={cn(
                'rounded-xl border-2 p-3 text-left transition-all',
                isActive
                  ? `${colors.border} ${colors.bg} shadow-sm`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    isActive ? `${colors.bg}` : 'bg-gray-100'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? colors.text : 'text-gray-500')} />
                </div>
                <span className={cn('text-sm font-bold', isActive ? colors.text : 'text-[#4A4A4A]')}>
                  {trainingModeLabels[mode]}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-gray-500">
                {trainingModeDescriptions[mode]}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HistoryPanel({
  records,
  onViewRecord,
}: {
  records: TrainingRecord[]
  onViewRecord: (recordId: string) => void
}) {
  const trainees = useStore((s) => s.trainees)
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilter>('all')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')
  const [traineeFilter, setTraineeFilter] = useState<TraineeFilter>('all')
  const [showFilter, setShowFilter] = useState(false)

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (scenarioFilter !== 'all' && r.scenarioId !== scenarioFilter) return false
      if (scoreFilter === '>=80' && r.score < 80) return false
      if (scoreFilter === '60-79' && (r.score < 60 || r.score >= 80)) return false
      if (scoreFilter === '<60' && r.score >= 60) return false
      if (traineeFilter === 'none' && r.traineeId !== null) return false
      if (traineeFilter !== 'all' && traineeFilter !== 'none' && r.traineeId !== traineeFilter) return false
      return true
    })
  }, [records, scenarioFilter, scoreFilter, traineeFilter])

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-6 py-8 text-center backdrop-blur-sm">
        <History className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-400">暂无训练记录，完成练习后会显示在这里</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#4A4A4A]">最近训练</h3>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
            showFilter ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          筛选
        </button>
      </div>

      {showFilter && (
        <div className="border-b border-gray-100 bg-[#F5F5F0]/50 px-4 py-3">
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-gray-500">按学员筛选</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setTraineeFilter('all')}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs transition-colors',
                    traineeFilter === 'all'
                      ? 'bg-[#2B5EA7] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  )}
                >
                  全部
                </button>
                <button
                  onClick={() => setTraineeFilter('none')}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs transition-colors',
                    traineeFilter === 'none'
                      ? 'bg-[#2B5EA7] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  )}
                >
                  未指定
                </button>
                {trainees.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTraineeFilter(t.id)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs transition-colors',
                      traineeFilter === t.id
                        ? 'bg-[#2B5EA7] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-gray-500">按场景筛选</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setScenarioFilter('all')}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs transition-colors',
                    scenarioFilter === 'all'
                      ? 'bg-[#2B5EA7] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  )}
                >
                  全部
                </button>
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScenarioFilter(s.id)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs transition-colors',
                      scenarioFilter === s.id
                        ? 'bg-[#2B5EA7] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-gray-500">按得分筛选</p>
              <div className="flex flex-wrap gap-1.5">
                {(['all', '>=80', '60-79', '<60'] as ScoreFilter[]).map((sf) => {
                  const label = sf === 'all' ? '全部' : sf === '>=80' ? '80分以上' : sf === '60-79' ? '60-79分' : '60分以下'
                  return (
                    <button
                      key={sf}
                      onClick={() => setScoreFilter(sf)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs transition-colors',
                        scoreFilter === sf
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {filteredRecords.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            没有符合筛选条件的记录
          </div>
        ) : (
          filteredRecords.slice(0, 10).map((record) => (
            <button
              key={record.id}
              onClick={() => onViewRecord(record.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  getScoreBgColor(record.score)
                )}
              >
                <FileText className={cn('h-5 w-5', getScoreColor(record.score))} />
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
                  {record.traineeName && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                      {record.traineeName}
                    </span>
                  )}
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
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(record.completedAt)} · {record.totalEvents}题 · 用时{formatDuration(record.totalTime)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn('text-lg font-bold', getScoreColor(record.score))}>
                  {record.score}
                </span>
                <span className="text-xs text-gray-400">分</span>
                <ChevronRight className="ml-1 h-4 w-4 text-gray-300" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default function ScenarioSelect() {
  const navigate = useNavigate()
  const {
    selectScenario,
    trainingRecords,
    inProgressState,
    initFromStorage,
    loadTrainingRecord,
    clearInProgress,
    currentTraineeId,
    trainees,
  } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exitingId, setExitingId] = useState<string | null>(null)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null)

  const currentTrainee = trainees.find((t) => t.id === currentTraineeId)

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  const handleToggle = (id: string) => {
    setSelectedId(selectedId === id ? null : id)
  }

  const handleStart = (scenarioId: string, resume: boolean) => {
    setExitingId(scenarioId)
    setTimeout(() => {
      if (!resume) {
        clearInProgress()
        selectScenario(scenarioId, false)
      } else {
        selectScenario(scenarioId, true)
      }
      navigate(`/scenario/${scenarioId}`)
    }, 300)
  }

  const handleCardClick = (scenarioId: string) => {
    const hasProgress = inProgressState && inProgressState.scenarioId === scenarioId
    if (hasProgress && selectedId !== scenarioId) {
      setPendingScenarioId(scenarioId)
      setShowResumeModal(true)
      return
    }
    handleToggle(scenarioId)
  }

  const handleViewRecord = (recordId: string) => {
    const record = trainingRecords.find((r) => r.id === recordId)
    if (!record) return
    loadTrainingRecord(recordId)
    navigate(`/review/${record.scenarioId}`)
  }

  const handleResumeConfirm = (resume: boolean) => {
    if (!pendingScenarioId) return
    setShowResumeModal(false)
    if (resume) {
      handleStart(pendingScenarioId, true)
    } else {
      clearInProgress()
      setSelectedId(pendingScenarioId)
      setPendingScenarioId(null)
    }
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

      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#2B5EA7] shadow-lg shadow-[#2B5EA7]/25">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#4A4A4A] sm:text-4xl">
            混凝土浇筑旁站情景练习
          </h1>
          <p className="mt-3 text-base text-gray-500 sm:text-lg">
            {currentTrainee
              ? `当前学员：${currentTrainee.name}，选择训练模式和浇筑场景`
              : '选择训练模式和浇筑场景，开始旁站训练'}
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#FF6B35]" />
        </header>

        <TraineeSelector />
        <TeamDashboard />
        <TrainingModeSelector />

        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#4A4A4A]">
            <MapPin className="h-5 w-5 text-[#FF6B35]" />
            选择浇筑场景
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedId === scenario.id}
                isExiting={exitingId !== null && exitingId !== scenario.id}
                onToggle={() => handleCardClick(scenario.id)}
                onStart={(resume) => handleStart(scenario.id, resume)}
              />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#4A4A4A]">
            <History className="h-5 w-5 text-[#2B5EA7]" />
            训练记录
          </h2>
          <HistoryPanel records={trainingRecords} onViewRecord={handleViewRecord} />
        </section>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-6 py-4 text-center text-sm text-gray-400 backdrop-blur-sm">
          <p>
            <span className="font-semibold text-[#4A4A4A]">训练流程：</span>
            录入学员 → 选择训练模式 → 选择场景 → 查看现场概况 → 逐题判断旁站要点 → 填写判定依据 → 获取复盘报告 → 老师点评
          </p>
        </div>
      </div>

      {showResumeModal && pendingScenarioId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <AlertCircle className="h-5 w-5 text-[#FF6B35]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#4A4A4A]">检测到未完成的练习</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {inProgressState?.traineeName
                    ? `${inProgressState.traineeName} 在`
                    : '你在'}
                  「{scenarios.find((s) => s.id === pendingScenarioId)?.name}」场景有未完成的练习，是否继续？
                </p>
              </div>
              <button
                onClick={() => setShowResumeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inProgressState && inProgressState.scenarioId === pendingScenarioId && (
              <div className="mb-4 rounded-lg bg-[#F5F5F0] px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">学员</span>
                  <span className="font-medium text-[#4A4A4A]">
                    {inProgressState.traineeName || '未指定'}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-gray-400">训练模式</span>
                  <span className="font-medium text-[#4A4A4A]">
                    {trainingModeLabels[inProgressState.mode]}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-gray-400">当前进度</span>
                  <span className="font-medium text-[#4A4A4A]">
                    {inProgressState.answers.length} 题已作答
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-gray-400">上次保存</span>
                  <span className="font-medium text-[#4A4A4A]">
                    {formatDate(inProgressState.lastSavedAt)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleResumeConfirm(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium bg-gray-200 text-[#4A4A4A] transition-colors hover:bg-gray-300"
              >
                重新开始
              </button>
              <button
                onClick={() => handleResumeConfirm(true)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors bg-[#FF6B35] hover:bg-[#e55e2e]"
              >
                继续练习
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
