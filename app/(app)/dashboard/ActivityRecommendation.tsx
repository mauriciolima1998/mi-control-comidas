'use client'

import { useState } from 'react'
import { Sparkles, Clock, Flame, ChevronRight, RotateCcw } from 'lucide-react'

type Recommendation = {
  exercise: string
  duration_minutes: number
  estimated_calories: number
  intensity: string
  achieves_deficit: boolean
  instructions: string
  message: string
}

type Props = {
  remainingCalories: number
  burnedToday: number
  age: number | null
  weightKg: number | null
}

const INTENSITY_STYLE: Record<string, string> = {
  baja:     'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50',
  moderada: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/50',
  alta:     'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/50',
}

export default function ActivityRecommendation({ remainingCalories, burnedToday, age, weightKg }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [availableMinutes, setAvailableMinutes] = useState<number>(30)
  const [location, setLocation] = useState('al aire libre')
  const [fitnessLevel, setFitnessLevel] = useState('moderado')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Recommendation | null>(null)

  async function handleRecommend() {
    setLoading(true)
    try {
      const res = await fetch('/api/recommend-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remainingCalories, burnedToday, age, weightKg, availableMinutes, location, fitnessLevel }),
      })
      const data = await res.json()
      if (res.ok) setResult(data)
    } finally {
      setLoading(false)
      setShowForm(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recomendación IA</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {remainingCalories > 0
                ? `Faltan ${remainingCalories} kcal para el déficit`
                : 'Déficit del día alcanzado'}
            </p>
          </div>
        </div>

        {!result ? (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Sparkles size={12} />
            Consultar IA
          </button>
        ) : (
          <button
            onClick={() => { setResult(null); setShowForm(false) }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={12} /> Nueva
          </button>
        )}
      </div>

      {/* Cuestionario */}
      {showForm && !result && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col gap-4">
          <Question label="¿Cuánto tiempo tenés?">
            {[15, 30, 45, 60, 90, 120].map(min => (
              <Chip key={min} active={availableMinutes === min} onClick={() => setAvailableMinutes(min)}>
                {min < 60 ? `${min}m` : `${min / 60}h`}
              </Chip>
            ))}
          </Question>

          <Question label="¿Dónde?">
            {['al aire libre', 'en casa', 'en el gimnasio'].map(loc => (
              <Chip key={loc} active={location === loc} onClick={() => setLocation(loc)}>
                {loc}
              </Chip>
            ))}
          </Question>

          <Question label="Nivel de actividad">
            {[
              { v: 'sedentario', l: 'Sedentario' },
              { v: 'moderado', l: 'Moderado' },
              { v: 'activo', l: 'Activo' },
            ].map(({ v, l }) => (
              <Chip key={v} active={fitnessLevel === v} onClick={() => setFitnessLevel(v)}>{l}</Chip>
            ))}
          </Question>

          <button
            onClick={handleRecommend}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="animate-spin">⏳</span> Consultando IA...</>
            ) : (
              <><Sparkles size={14} /> Obtener recomendación</>
            )}
          </button>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{result.exercise}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{result.instructions}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${INTENSITY_STYLE[result.intensity] ?? 'text-slate-600 bg-slate-100'}`}>
              {result.intensity}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Clock size={15} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-white">{result.duration_minutes} min</p>
                <p className="text-xs text-slate-400">duración</p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Flame size={15} className="text-orange-400 shrink-0" />
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-white">~{result.estimated_calories}</p>
                <p className="text-xs text-slate-400">kcal quemarías</p>
              </div>
            </div>
          </div>

          {result.achieves_deficit ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">✓ Con esto lográs tu déficit del día</p>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">⚠ No alcanza el déficit, pero suma a la rutina</p>
            </div>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500 italic">{result.message}</p>
        </div>
      )}
    </div>
  )
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <div className="flex gap-2 flex-wrap">{children}</div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'
      }`}
    >
      {children}
    </button>
  )
}
