'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { Footprints, Zap, Check } from 'lucide-react'

type Props = {
  date: string
  initialBurned: number
  initialSteps: number
  weightKg: number | null
}

function stepsToCalories(steps: number, weightKg: number) {
  return Math.round(steps * weightKg * 0.0005)
}

export default function ActivityInput({ date, initialBurned, initialSteps, weightKg }: Props) {
  const [mode, setMode] = useState<'calories' | 'steps'>(initialSteps > 0 ? 'steps' : 'calories')
  const [calories, setCalories] = useState(initialBurned > 0 && initialSteps === 0 ? initialBurned.toString() : '')
  const [steps, setSteps] = useState(initialSteps > 0 ? initialSteps.toString() : '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const effectiveWeight = weightKg ?? 70
  const stepsCalc = steps ? stepsToCalories(parseInt(steps), effectiveWeight) : 0
  const burnedToShow = mode === 'steps' ? stepsCalc : parseInt(calories) || 0

  async function handleSave() {
    setSaving(true)
    const burned = mode === 'steps' ? stepsCalc : parseInt(calories) || 0
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('daily_activity').upsert({
      user_id: user.id, date,
      calories_burned: burned,
      steps: mode === 'steps' ? parseInt(steps) || 0 : 0,
    }, { onConflict: 'user_id,date' })
    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    router.refresh()
    toast('Actividad guardada')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
            <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Actividad física</span>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-0.5 text-xs">
          <button
            onClick={() => setMode('calories')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'calories'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Calorías
          </button>
          <button
            onClick={() => setMode('steps')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'steps'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1"><Footprints size={12} /> Pasos</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mode === 'calories' ? (
          <>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              onBlur={handleSave}
              placeholder="0"
              min={0} max={5000}
              className="w-28 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">kcal quemadas</span>
          </>
        ) : (
          <>
            <input
              type="number"
              value={steps}
              onChange={e => setSteps(e.target.value)}
              onBlur={handleSave}
              placeholder="0"
              min={0} max={100000}
              className="w-28 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">pasos</span>
            {stepsCalc > 0 && (
              <span className="text-sm font-semibold text-emerald-500">≈ {stepsCalc} kcal</span>
            )}
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl disabled:opacity-40 transition-colors"
        >
          <Check size={13} />
          {saving ? '...' : 'Guardar'}
        </button>
      </div>

      {burnedToShow > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {mode === 'steps'
            ? `${parseInt(steps).toLocaleString()} pasos × ${effectiveWeight}kg`
            : 'Calorías quemadas'
          } → <span className="text-emerald-500 font-medium">−{burnedToShow} kcal</span> del total del día
        </p>
      )}
    </div>
  )
}
