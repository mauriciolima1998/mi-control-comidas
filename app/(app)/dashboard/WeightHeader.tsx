'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { Scale, Target, TrendingDown, TrendingUp, Sparkles, History } from 'lucide-react'
import WeightHistoryModal from './WeightHistoryModal'

type WeightLog = { weight: number; date: string }

type Props = {
  date: string
  currentWeight: number | null
  currentWeightDate: string | null
  todayWeight: number | null
  targetWeight: number | null
  avgDailyDeficit: number
  weightHistory: WeightLog[]
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function WeightHeader({ date, currentWeight, currentWeightDate, todayWeight, targetWeight, avgDailyDeficit, weightHistory }: Props) {
  const [showInput, setShowInput] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [weight, setWeight] = useState(todayWeight?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [estimate, setEstimate] = useState<{ days: number; message: string } | null>(null)
  const [loadingEstimate, setLoadingEstimate] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const displayWeight = todayWeight ?? currentWeight
  const diff = displayWeight && targetWeight ? displayWeight - targetWeight : null

  async function fetchEstimate() {
    if (!displayWeight || !targetWeight || avgDailyDeficit <= 0) return
    setLoadingEstimate(true)
    try {
      const res = await fetch('/api/estimate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentWeight: displayWeight, targetWeight, avgDailyDeficit }),
      })
      const data = await res.json()
      if (data.days) setEstimate(data)
    } finally {
      setLoadingEstimate(false)
    }
  }

  async function handleSave() {
    const val = parseFloat(weight)
    if (!val || val < 20 || val > 300) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('weight_logs').upsert({ user_id: user.id, date, weight: val }, { onConflict: 'user_id,date' })
    await supabase.from('profiles').update({ current_weight: val }).eq('id', user.id)
    setSaving(false)
    setShowInput(false)
    router.refresh()
    toast('Peso registrado')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between">
        {/* Peso actual + objetivo */}
        <div className="flex items-start gap-5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Scale size={13} className="text-slate-400" />
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Peso actual</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {displayWeight ? `${displayWeight}` : '—'}
              </span>
              {displayWeight && <span className="text-sm text-slate-400">kg</span>}
            </div>
            {currentWeightDate && !todayWeight && displayWeight && (
              <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(currentWeightDate)}</span>
            )}
            {todayWeight && <span className="text-xs text-blue-500 font-medium">hoy</span>}
          </div>

          {targetWeight && (
            <div className="border-l border-slate-100 dark:border-slate-700 pl-5">
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={13} className="text-slate-400" />
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Objetivo</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{targetWeight}</span>
                <span className="text-sm text-slate-400">kg</span>
              </div>
              {diff !== null && (
                <div className="flex items-center gap-1">
                  {diff > 0
                    ? <TrendingDown size={12} className="text-blue-500" />
                    : <TrendingUp size={12} className="text-emerald-500" />
                  }
                  <span className={`text-xs font-semibold ${diff > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                    {diff > 0 ? `−${diff.toFixed(1)} kg` : '¡Meta!'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowInput(v => !v)}
          className="text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl transition-colors shrink-0"
        >
          {todayWeight ? 'Actualizar' : 'Registrar hoy'}
        </button>
      </div>

      {/* Input de peso */}
      {showInput && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder={displayWeight?.toString() ?? 'Tu peso'}
            step="0.1" min={20} max={300} autoFocus
            className="w-28 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-500">kg</span>
          <button onClick={handleSave} disabled={saving || !weight}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 transition-colors font-medium">
            {saving ? '...' : 'Guardar'}
          </button>
          <button onClick={() => setShowInput(false)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 transition-colors">
            Cancelar
          </button>
        </div>
      )}

      {/* Estimado IA */}
      {targetWeight && diff !== null && diff > 0 && avgDailyDeficit > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          {!estimate ? (
            <button onClick={fetchEstimate} disabled={loadingEstimate}
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-40 transition-colors">
              <Sparkles size={12} />
              {loadingEstimate ? 'Calculando...' : 'Ver estimado de días al objetivo'}
            </button>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">~{estimate.days} días para llegar a {targetWeight} kg</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{estimate.message}</p>
              </div>
              <button onClick={() => setEstimate(null)} className="text-emerald-400 hover:text-emerald-600 text-sm shrink-0 leading-none">×</button>
            </div>
          )}
        </div>
      )}

      {/* Historial */}
      {weightHistory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">{weightHistory.length} registro{weightHistory.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <History size={12} /> Ver historial
          </button>
        </div>
      )}

      {showHistory && (
        <WeightHistoryModal logs={weightHistory} onClose={() => setShowHistory(false)} />
      )}
    </div>
  )
}
