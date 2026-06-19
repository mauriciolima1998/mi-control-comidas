'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useToast } from '@/lib/toast'
import { User, Flame, Weight } from 'lucide-react'

type Profile = {
  full_name: string | null
  daily_calorie_goal: number | null
  current_weight: number | null
  target_weight: number | null
  age: number | null
} | null

export default function SettingsForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [age, setAge] = useState(profile?.age?.toString() ?? '')
  const [calorieGoal, setCalorieGoal] = useState(profile?.daily_calorie_goal ?? 2000)
  const [currentWeight, setCurrentWeight] = useState(profile?.current_weight?.toString() ?? '')
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      full_name: fullName || null,
      age: age ? parseInt(age) : null,
      daily_calorie_goal: calorieGoal,
      current_weight: currentWeight ? parseFloat(currentWeight) : null,
      target_weight: targetWeight ? parseFloat(targetWeight) : null,
    }).eq('id', user.id)
    setSaving(false)
    toast('Ajustes guardados')
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
  const smallInputClass = "bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Perfil */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <User size={15} className="text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Perfil</h2>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre</span>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Tu nombre" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Edad</span>
          <div className="flex items-center gap-2">
            <input type="number" value={age} onChange={e => setAge(e.target.value)}
              placeholder="28" min={10} max={100}
              className={`${smallInputClass} w-24`} />
            <span className="text-sm text-slate-500 dark:text-slate-400">años</span>
          </div>
        </label>
      </section>

      {/* Calorías */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={15} className="text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Calorías</h2>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Meta diaria</span>
          <div className="flex items-center gap-2">
            <input type="number" value={calorieGoal} onChange={e => setCalorieGoal(Number(e.target.value))}
              min={500} max={6000}
              className={`${smallInputClass} w-32`} />
            <span className="text-sm text-slate-500 dark:text-slate-400">kcal</span>
          </div>
        </label>
      </section>

      {/* Peso */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Weight size={15} className="text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Peso y objetivo</h2>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Peso actual</span>
          <div className="flex items-center gap-2">
            <input type="number" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)}
              placeholder="75" step="0.1" min={20} max={300}
              className={`${smallInputClass} w-32`} />
            <span className="text-sm text-slate-500 dark:text-slate-400">kg</span>
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Peso objetivo</span>
          <div className="flex items-center gap-2">
            <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
              placeholder="68" step="0.1" min={20} max={300}
              className={`${smallInputClass} w-32`} />
            <span className="text-sm text-slate-500 dark:text-slate-400">kg</span>
          </div>
          {currentWeight && targetWeight && parseFloat(currentWeight) > parseFloat(targetWeight) && (
            <p className="text-xs text-blue-500 font-medium">
              {(parseFloat(currentWeight) - parseFloat(targetWeight)).toFixed(1)} kg por bajar
            </p>
          )}
        </label>
      </section>

      <button type="submit" disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl py-3 transition-colors disabled:opacity-60 shadow-sm">
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
