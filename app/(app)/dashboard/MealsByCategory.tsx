import { Plus, Coffee, Sun, Moon, Apple, AlertTriangle } from 'lucide-react'

type Meal = {
  id: string
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  image_url: string | null
  ai_confidence: 'high' | 'low'
}

const CATEGORIES = [
  { key: 'breakfast', label: 'Desayuno',  icon: Coffee,  accent: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { key: 'lunch',     label: 'Almuerzo',  icon: Sun,     accent: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/40' },
  { key: 'dinner',    label: 'Cena',      icon: Moon,    accent: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  { key: 'snack',     label: 'Snack',     icon: Apple,   accent: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
] as const

export default function MealsByCategory({
  meals,
  onAdd,
  onEdit,
}: {
  meals: Meal[]
  onAdd: (category: string) => void
  onEdit: (meal: Meal) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {meals.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Sin comidas registradas hoy</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Usá el + de cada categoría o el botón flotante</p>
        </div>
      )}

      {CATEGORIES.map(({ key, label, icon: Icon, accent, bg }) => {
        const categoryMeals = meals.filter(m => m.category === key)
        const total = categoryMeals.reduce((s, m) => s + m.calories, 0)

        return (
          <div key={key} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Category header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon size={14} className={accent} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {categoryMeals.length > 0 && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                    {total.toLocaleString()} kcal
                  </span>
                )}
                <button
                  onClick={() => onAdd(key)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Meals list */}
            {categoryMeals.length === 0 ? (
              <button
                onClick={() => onAdd(key)}
                className="w-full py-3 text-xs text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={13} /> Agregar {label.toLowerCase()}
              </button>
            ) : (
              <div>
                {categoryMeals.map(meal => (
                  <button
                    key={meal.id}
                    onClick={() => onEdit(meal)}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border-b border-slate-50 dark:border-slate-700/40 last:border-0"
                  >
                    <div className="flex items-center gap-2 text-left">
                      {meal.ai_confidence === 'low' && (
                        <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                      )}
                      <span className="text-sm text-slate-700 dark:text-slate-200">{meal.food_name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                      {meal.calories.toLocaleString()} <span className="text-xs font-normal text-slate-400">kcal</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
