import { Flame } from 'lucide-react'

type Props = {
  consumed: number
  burned: number
  goal: number
  protein: number
  carbs: number
  fat: number
}

export default function CalorieProgress({ consumed, burned, goal, protein, carbs, fat }: Props) {
  const net = consumed - burned
  const pct = Math.min(100, Math.round((net / goal) * 100))
  const remaining = goal - net
  const over = remaining < 0

  const barColor = pct >= 100
    ? 'bg-red-500'
    : pct >= 80
    ? 'bg-amber-400'
    : 'bg-blue-500'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Calorías netas
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold tabular-nums ${over ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {net.toLocaleString()}
            </span>
            <span className="text-sm text-slate-400 dark:text-slate-500">kcal</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
            <Flame size={13} className="text-slate-400 dark:text-slate-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">meta {goal.toLocaleString()}</span>
          </div>
          {over
            ? <p className="text-sm font-semibold text-red-500">+{Math.abs(remaining).toLocaleString()} kcal sobre meta</p>
            : <p className="text-sm text-slate-500 dark:text-slate-400">Quedan <span className="font-semibold text-slate-700 dark:text-slate-200">{remaining.toLocaleString()}</span> kcal</p>
          }
          {burned > 0 && (
            <p className="text-xs text-emerald-500">−{burned.toLocaleString()} kcal actividad</p>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-2">
        <MacroCard label="Proteína" value={protein} unit="g"
          textColor="text-blue-500" bg="bg-blue-50 dark:bg-blue-950/40" />
        <MacroCard label="Carbos" value={carbs} unit="g"
          textColor="text-amber-500" bg="bg-amber-50 dark:bg-amber-950/40" />
        <MacroCard label="Grasa" value={fat} unit="g"
          textColor="text-orange-500" bg="bg-orange-50 dark:bg-orange-950/40" />
      </div>
    </div>
  )
}

function MacroCard({ label, value, unit, textColor, bg }: {
  label: string; value: number; unit: string; textColor: string; bg: string
}) {
  return (
    <div className={`${bg} rounded-xl px-3 py-2.5 flex flex-col items-center gap-0.5`}>
      <span className={`text-lg font-bold tabular-nums ${textColor}`}>{value.toFixed(0)}{unit}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  )
}
