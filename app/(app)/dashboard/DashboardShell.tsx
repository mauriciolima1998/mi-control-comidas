'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import MealsByCategory from './MealsByCategory'
import AddMealModal from './AddMealModal'
import EditMealModal from './EditMealModal'

type Category = 'breakfast' | 'lunch' | 'dinner' | 'snack'

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

type Props = {
  meals: Meal[]
  date: string
  children: React.ReactNode
}

export default function DashboardShell({ meals, date, children }: Props) {
  const [addCategory, setAddCategory] = useState<Category | null>(null)
  const [editMeal, setEditMeal] = useState<Meal | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {children}

      <MealsByCategory
        meals={meals}
        onAdd={(category) => setAddCategory(category as Category)}
        onEdit={(meal) => setEditMeal(meal)}
      />

      {/* FAB */}
      <button
        onClick={() => setAddCategory('snack')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all"
        aria-label="Agregar comida"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {addCategory && (
        <AddMealModal
          date={date}
          initialCategory={addCategory}
          onClose={() => setAddCategory(null)}
        />
      )}

      {editMeal && (
        <EditMealModal
          meal={editMeal}
          onClose={() => setEditMeal(null)}
        />
      )}
    </div>
  )
}
