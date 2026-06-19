'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast'

type Category = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const CATEGORY_LABELS: Record<Category, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

type Meal = {
  id: string
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  category: Category
  image_url: string | null
  ai_confidence: 'high' | 'low'
}

export default function EditMealModal({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const [foodName, setFoodName] = useState(meal.food_name)
  const [calories, setCalories] = useState(meal.calories)
  const [protein, setProtein] = useState(meal.protein)
  const [carbs, setCarbs] = useState(meal.carbs)
  const [fat, setFat] = useState(meal.fat)
  const [category, setCategory] = useState<Category>(meal.category)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()
  const toast = useToast()

  async function handleSave() {
    if (!foodName || !calories) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('meals').update({
      food_name: foodName,
      calories,
      protein,
      carbs,
      fat,
      category,
      updated_at: new Date().toISOString(),
    }).eq('id', meal.id)
    setSaving(false)
    router.refresh()
    toast('Cambios guardados')
    onClose()
  }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    const supabase = createClient()

    if (meal.image_url) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const path = meal.image_url.match(/meal-images\/(.+?)(\?|$)/)?.[1]
        if (path) await supabase.storage.from('meal-images').remove([decodeURIComponent(path)])
      }
    }

    await supabase.from('meals').delete().eq('id', meal.id)
    router.refresh()
    toast('Comida eliminada', 'info')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Editar comida</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xl leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {meal.image_url && (
            <img src={meal.image_url} alt={meal.food_name} className="w-full max-h-40 object-cover rounded-xl" />
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Nombre</span>
            <input
              type="text"
              value={foodName}
              onChange={e => setFoodName(e.target.value)}
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="Calorías" unit="kcal" value={calories} onChange={setCalories} integer />
            <NumField label="Proteína" unit="g" value={protein} onChange={setProtein} />
            <NumField label="Carbohidratos" unit="g" value={carbs} onChange={setCarbs} />
            <NumField label="Grasa" unit="g" value={fat} onChange={setFat} />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                  category === cat
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl disabled:opacity-60 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>

          <button
            onClick={handleDelete}
            className={`w-full py-3 rounded-2xl font-semibold transition-colors text-sm ${
              confirming
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
            }`}
          >
            {confirming ? 'Confirmar eliminación' : 'Eliminar comida'}
          </button>

          {confirming && (
            <button onClick={() => setConfirming(false)} className="text-xs text-slate-400 text-center hover:underline">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function NumField({ label, unit, value, onChange, integer }: {
  label: string; unit: string; value: number; onChange: (v: number) => void; integer?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(integer ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
          step={integer ? 1 : 0.1}
          min={0}
          className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-400 dark:text-slate-500">{unit}</span>
      </div>
    </label>
  )
}
