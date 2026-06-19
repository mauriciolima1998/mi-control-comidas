'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

function formatDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function DateSelector({ date }: { date: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const isToday = date === today()

  function go(days: number) {
    router.push(`/dashboard?date=${addDays(date, days)}`)
  }

  function goTo(d: string) {
    if (d) router.push(`/dashboard?date=${d}`)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 px-3 py-2.5 flex items-center justify-between gap-2">
      <button
        onClick={() => go(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <CalendarDays size={15} className="text-slate-400 dark:text-slate-500" />
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold capitalize">{formatDisplay(date)}</span>
          {isToday && <span className="text-xs text-blue-500 font-medium">Hoy</span>}
        </div>
      </button>

      <input
        ref={inputRef}
        type="date"
        value={date}
        max={today()}
        onChange={e => goTo(e.target.value)}
        className="sr-only"
      />

      <button
        onClick={() => go(1)}
        disabled={isToday}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
