type WeightLog = { weight: number; date: string }

function fmt(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function WeightChart({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) return (
    <div className="h-32 flex items-center justify-center text-xs text-gray-400">
      Necesitás al menos 2 registros para ver el gráfico
    </div>
  )

  const W = 320, H = 120
  const pad = { top: 12, right: 12, bottom: 28, left: 44 }
  const cw = W - pad.left - pad.right
  const ch = H - pad.top - pad.bottom

  const weights = logs.map(l => l.weight)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1

  function px(i: number) { return pad.left + (i / (logs.length - 1)) * cw }
  function py(w: number) { return pad.top + ch - ((w - minW) / range) * ch }

  const linePts = logs.map((l, i) => `${px(i)},${py(l.weight)}`).join(' ')
  const areaPts = [
    `${px(0)},${pad.top + ch}`,
    ...logs.map((l, i) => `${px(i)},${py(l.weight)}`),
    `${px(logs.length - 1)},${pad.top + ch}`,
  ].join(' ')

  const trend = logs[logs.length - 1].weight - logs[0].weight
  const lineColor = trend <= 0 ? '#2563eb' : '#ef4444'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {[0, 0.5, 1].map(t => {
        const y = pad.top + t * ch
        const w = minW + (1 - t) * range
        return (
          <g key={t}>
            <line x1={pad.left} y1={y} x2={pad.left + cw} y2={y}
              stroke="#e5e7eb" strokeWidth="1" />
            <text x={pad.left - 4} y={y + 4} textAnchor="end"
              fontSize="9" fill="#9ca3af">{w.toFixed(1)}</text>
          </g>
        )
      })}

      {/* Area fill */}
      <polygon points={areaPts} fill="url(#wg)" />

      {/* Line */}
      <polyline points={linePts} fill="none" stroke={lineColor}
        strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {logs.map((l, i) => (
        <circle key={i} cx={px(i)} cy={py(l.weight)} r="3"
          fill="white" stroke={lineColor} strokeWidth="2" />
      ))}

      {/* X axis: first and last date */}
      <text x={px(0)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">
        {fmt(logs[0].date)}
      </text>
      <text x={px(logs.length - 1)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">
        {fmt(logs[logs.length - 1].date)}
      </text>
    </svg>
  )
}

export default function WeightHistoryModal({
  logs,
  onClose,
}: {
  logs: WeightLog[]
  onClose: () => void
}) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const reversed = [...sorted].reverse()

  const trend = sorted.length >= 2
    ? sorted[sorted.length - 1].weight - sorted[0].weight
    : null

  const daySpan = sorted.length >= 2
    ? Math.round((new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / 86400000)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Historial de peso</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xl leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* Gráfico */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
            <WeightChart logs={sorted} />
          </div>

          {/* Resumen */}
          {trend !== null && daySpan !== null && (
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Inicio</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{sorted[0].weight} kg</p>
                <p className="text-xs text-slate-400">{fmt(sorted[0].date)}</p>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Último</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{sorted[sorted.length - 1].weight} kg</p>
                <p className="text-xs text-slate-400">{fmt(sorted[sorted.length - 1].date)}</p>
              </div>
              <div className={`flex-1 rounded-xl px-4 py-3 text-center ${trend <= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-400 mb-0.5">Cambio</p>
                <p className={`text-lg font-bold ${trend <= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg
                </p>
                <p className="text-xs text-gray-400">{daySpan} días</p>
              </div>
            </div>
          )}

          {/* Lista */}
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Todavía no registraste ningún peso</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              {reversed.map((log, i) => (
                <div key={log.date} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{fmt(log.date)}</span>
                  <div className="flex items-center gap-2">
                    {i < reversed.length - 1 && (() => {
                      const diff = log.weight - reversed[i + 1].weight
                      return diff !== 0 ? (
                        <span className={`text-xs ${diff < 0 ? 'text-green-500' : 'text-red-400'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </span>
                      ) : null
                    })()}
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{log.weight} kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
