import { useState } from 'react'
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
} from 'lucide-react'
import { scenarios } from '@/data/scenarios'
import type { Scenario } from '@/data/types'
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

function ScenarioCard({
  scenario,
  onClick,
  isExiting,
}: {
  scenario: Scenario
  onClick: () => void
  isExiting: boolean
}) {
  const Icon = iconMap[scenario.icon]
  const WeatherIcon = getWeatherIcon(scenario.weather)

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-left rounded-lg border-2 border-gray-200 bg-white p-6',
        'transition-all duration-300 ease-out',
        'hover:border-l-[#FF6B35] hover:border-l-4 hover:shadow-xl hover:scale-[1.02]',
        'focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2',
        isExiting && 'opacity-0 scale-95 translate-y-2'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#2B5EA7]/10 text-[#2B5EA7] transition-colors group-hover:bg-[#2B5EA7] group-hover:text-white">
          {Icon && <Icon className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#4A4A4A] group-hover:text-[#2B5EA7] transition-colors">
            {scenario.name}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {scenario.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <WeatherIcon className="h-3.5 w-3.5" />
              {scenario.weather}
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-[#4A4A4A]">
              {scenario.concreteGrade}
            </span>
            <span>{scenario.pumpMethod}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-[#FF6B35]" />
      </div>
    </button>
  )
}

export default function ScenarioSelect() {
  const navigate = useNavigate()
  const selectScenario = useStore((s) => s.selectScenario)
  const [exitingId, setExitingId] = useState<string | null>(null)

  const handleClick = (id: string) => {
    setExitingId(id)
    setTimeout(() => {
      selectScenario(id)
      navigate(`/scenario/${id}`)
    }, 300)
  }

  return (
    <div className="relative min-h-screen bg-[#F5F5F0]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #4A4A4A 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#2B5EA7] shadow-lg shadow-[#2B5EA7]/25">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#4A4A4A] sm:text-4xl">
            混凝土浇筑旁站情景练习
          </h1>
          <p className="mt-3 text-base text-gray-500 sm:text-lg">
            选择浇筑场景，开始旁站训练
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#FF6B35]" />
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onClick={() => handleClick(scenario.id)}
              isExiting={exitingId !== null && exitingId !== scenario.id}
            />
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-dashed border-gray-300 bg-white/60 px-6 py-4 text-center text-sm text-gray-400 backdrop-blur-sm">
          <p>
            <span className="font-semibold text-[#4A4A4A]">训练流程：</span>
            选择场景 → 逐题判断旁站要点 → 填写判定依据 → 获取评分报告
          </p>
        </div>
      </div>
    </div>
  )
}
