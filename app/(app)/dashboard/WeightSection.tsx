'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  date: string
  todayWeight: number | null
  currentWeight: number | null
  currentWeightDate: string | null
  targetWeight: number | null
  avgDailyDeficit: number
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function WeightSection({ date, todayWeight, currentWeight, currentWeightDate, targetWeight, avgDailyDeficit }: Props) {
  const [weight, setWeight] = useState(todayWeight?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [estimate, setEstimate] = useState<{ days: number; message: string } | null>(null)
  const [loadingEstimate, setLoadingEstimate] = useState(false)
  const router = useRouter()

  async function handleSaveWeight() {
    const val = parseFloat(weight)
    if (!val || val < 20 || val > 300) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('weight_logs').upsert({
      user_id: user.id,
      date,
      weight: val,
    }, { onConflict: 'user_id,date' })

    await supabase.from('profiles').update({ current_weight: val }).eq('id', user.id)

    setSaving(false)
    router.refresh()

    if (targetWeight && avgDailyDeficit > 0) {
      fetchEstimate(val)
    }
  }

  async function fetchEstimate(cw: number) {
    setLoadingEstimate(true)
    try {
      const res = await fetch('/api/estimate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentWeight: cw, targetWeight, avgDailyDeficit }),
      })
      const data = await res.json()
      if (data.days) setEstimate(data)
    } finally {
      setLoadingEstimate(false)
    }
  }

  const activeWeight = parseFloat(weight) || currentWeight || null
  const diff = targetWeight && activeWeight ? activeWeight - targetWeight : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Peso</h3>
        {currentWeight && currentWeightDate && !todayWeight && (
          <span className="text-xs text-gray-400">
            Último registro: <span className="font-medium text-gray-600">{currentWeight} kg</span> · {formatDate(currentWeightDate)}
          </span>
        )}
      </div>

      {/* Peso actual destacado */}
      {currentWeight && (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl font-bold text-gray-800">{todayWeight ?? currentWeight} kg</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {todayWeight ? 'registrado hoy' : `registrado el ${formatDate(currentWeightDate!)}`}
            </p>
          </div>
          {targetWeight && diff !== null && (
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Objetivo</p>
              <p className="text-sm font-semibold text-gray-700">{targetWeight} kg</p>
              <p className={`text-xs font-medium mt-0.5 ${diff > 0 ? 'text-blue-500' : 'text-green-500'}`}>
                {diff > 0 ? `−${diff.toFixed(1)} kg` : '🎉 Logrado'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Input para registrar peso de hoy */}
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder={currentWeight ? `${currentWeight}` : 'Tu peso hoy'}
          step="0.1"
          min={20}
          max={300}
          className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">kg hoy</span>
        <button
          onClick={handleSaveWeight}
          disabled={saving || !weight}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-40 transition"
        >
          {saving ? '...' : todayWeight ? 'Actualizar' : 'Registrar'}
        </button>
      </div>

      {loadingEstimate && (
        <p className="text-xs text-gray-400 animate-pulse">Calculando estimado con IA...</p>
      )}

      {estimate && !loadingEstimate && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <p className="text-sm text-green-800 font-medium">~{estimate.days} días para llegar al objetivo</p>
          <p className="text-xs text-green-600 mt-0.5">{estimate.message}</p>
        </div>
      )}

      {!estimate && !loadingEstimate && targetWeight && avgDailyDeficit > 0 && activeWeight && (
        <button
          onClick={() => fetchEstimate(activeWeight)}
          className="text-xs text-blue-500 hover:underline text-left"
        >
          Ver estimado con IA →
        </button>
      )}
    </div>
  )
}
