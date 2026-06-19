'use client'

import { useState, useRef } from 'react'
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

type Analysis = {
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ai_confidence: 'high' | 'low'
  ai_notes: string
}

type InputMode = 'photo' | 'desc' | 'manual'
type Step = 'mode' | 'photo' | 'desc' | 'review'

type Props = {
  date: string
  initialCategory: Category
  onClose: () => void
}

const EMPTY_ANALYSIS: Analysis = {
  food_name: '', calories: 0, protein: 0, carbs: 0, fat: 0,
  ai_confidence: 'high', ai_notes: '',
}

export default function AddMealModal({ date, initialCategory, onClose }: Props) {
  const [step, setStep] = useState<Step>('mode')
  const [inputMode, setInputMode] = useState<InputMode | null>(null)
  const [category, setCategory] = useState<Category>(initialCategory)
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const toast = useToast()

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function runAnalysis(body: object) {
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setAnalysis({
          food_name: data.food_name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          ai_confidence: data.confidence,
          ai_notes: data.ai_notes,
        })
        setStep('review')
      } else {
        setAnalyzeError(data.error ?? 'Error al analizar')
      }
    } catch {
      setAnalyzeError('Error de conexión')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleAnalyzePhoto() {
    if (!imageFile) return
    const base64 = await fileToBase64(imageFile)
    await runAnalysis({ image: base64, mimeType: imageFile.type, description: description || undefined })
  }

  async function handleAnalyzeDesc() {
    if (!description.trim()) return
    await runAnalysis({ description })
  }

  function handleManual() {
    setInputMode('manual')
    setAnalysis(EMPTY_ANALYSIS)
    setStep('review')
  }

  function handleBack() {
    setAnalyzeError(null)
    if (step === 'review') {
      if (inputMode === 'photo') setStep('photo')
      else if (inputMode === 'desc') setStep('desc')
      else setStep('mode')
    } else {
      setStep('mode')
    }
  }

  async function handleSave() {
    if (!analysis.food_name || !analysis.calories) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imageUrl: string | null = null
    let imagePath: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${date}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(path, imageFile, { contentType: imageFile.type })

      if (!uploadError) {
        imagePath = path
        const { data: signed } = await supabase.storage
          .from('meal-images')
          .createSignedUrl(path, 60 * 60 * 24 * 365)
        imageUrl = signed?.signedUrl ?? null
      }
    }

    await supabase.from('meals').insert({
      user_id: user.id,
      date,
      category,
      description: description || null,
      food_name: analysis.food_name,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      ai_confidence: analysis.ai_confidence,
      ai_notes: analysis.ai_notes || null,
      image_url: imageUrl,
      image_path: imagePath,
    })

    setSaving(false)
    router.refresh()
    toast('Comida guardada')
    onClose()
  }

  const STEP_TITLE: Record<Step, string> = {
    mode: 'Nueva comida',
    photo: 'Foto + IA',
    desc: 'Descripción + IA',
    review: 'Revisar y guardar',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            {step !== 'mode' && (
              <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xl leading-none">‹</button>
            )}
            <h2 className="font-semibold text-slate-800 dark:text-white">{STEP_TITLE[step]}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xl leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col gap-4">

          {/* ── STEP: Selección de modo ── */}
          {step === 'mode' && (
            <>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">¿Qué comida es?</p>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                        category === cat
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'
                      }`}>
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs font-medium text-gray-500">¿Cómo querés registrarla?</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setInputMode('photo'); setStep('photo') }}
                  className="flex items-center gap-4 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left group"
                >
                  <span className="text-3xl shrink-0">📷</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Foto + IA</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Sacá o subí una foto y la IA estima los nutrientes</p>
                  </div>
                  <span className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-400 text-lg">›</span>
                </button>

                <button
                  onClick={() => { setInputMode('desc'); setStep('desc') }}
                  className="flex items-center gap-4 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left group"
                >
                  <span className="text-3xl shrink-0">📝</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Descripción + IA</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Describí el plato con detalle, la IA lo analiza</p>
                  </div>
                  <span className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-400 text-lg">›</span>
                </button>

                <button
                  onClick={handleManual}
                  className="flex items-center gap-4 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left group"
                >
                  <span className="text-3xl shrink-0">✏️</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">Manual</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ingresá calorías y macros directamente</p>
                  </div>
                  <span className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-slate-400 text-lg">›</span>
                </button>
              </div>
            </>
          )}

          {/* ── STEP: Foto ── */}
          {step === 'photo' && (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[180px] ${
                  imagePreview ? 'border-blue-300 dark:border-blue-600' : 'border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full max-h-52 object-cover rounded-xl" />
                ) : (
                  <>
                    <span className="text-4xl mb-2">📷</span>
                    <span className="text-sm text-slate-400 dark:text-slate-500">Tocá para sacar o subir foto</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handleImageChange} />

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descripción opcional (ej: porción grande, sin sal...)"
                rows={2}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {analyzeError && <p className="text-xs text-red-500">{analyzeError}</p>}

              <button
                onClick={handleAnalyzePhoto}
                disabled={!imageFile || analyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl py-3 disabled:opacity-50 transition"
              >
                {analyzing ? '⏳ Analizando...' : '✨ Analizar con IA'}
              </button>
            </>
          )}

          {/* ── STEP: Descripción ── */}
          {step === 'desc' && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Describí el plato con detalle</p>
                <p className="text-xs text-gray-400 mb-3">
                  Incluí ingredientes, cantidades y método de cocción. Cuanto más detalle, mejor la estimación.
                </p>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ej: 200g de arroz blanco cocido, 150g de pechuga de pollo a la plancha con un chorrito de aceite de oliva, ensalada mixta con tomate y zanahoria sin aderezo"
                  rows={7}
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {analyzeError && <p className="text-xs text-red-500">{analyzeError}</p>}

              <button
                onClick={handleAnalyzeDesc}
                disabled={!description.trim() || analyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl py-3 disabled:opacity-50 transition"
              >
                {analyzing ? '⏳ Analizando...' : '✨ Analizar con IA'}
              </button>
            </>
          )}

          {/* ── STEP: Revisión ── */}
          {step === 'review' && (
            <>
              {imagePreview && (
                <img src={imagePreview} alt="comida" className="w-full max-h-40 object-cover rounded-xl" />
              )}

              {analysis.ai_notes ? (
                <div className={`text-xs px-3 py-2 rounded-lg ${
                  analysis.ai_confidence === 'low'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {analysis.ai_confidence === 'low' && '⚠ '}{analysis.ai_notes}
                </div>
              ) : inputMode === 'manual' ? (
                <p className="text-xs text-gray-400">Completá los datos del plato. Solo las calorías son obligatorias.</p>
              ) : null}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Nombre del plato</span>
                <input
                  type="text"
                  value={analysis.food_name}
                  onChange={e => setAnalysis(a => ({ ...a, food_name: e.target.value }))}
                  className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Milanesa con ensalada"
                  autoFocus={inputMode === 'manual'}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <NumericField label="Calorías" unit="kcal" value={analysis.calories}
                  onChange={v => setAnalysis(a => ({ ...a, calories: v }))} integer />
                <NumericField label="Proteína" unit="g" value={analysis.protein}
                  onChange={v => setAnalysis(a => ({ ...a, protein: v }))} />
                <NumericField label="Carbohidratos" unit="g" value={analysis.carbs}
                  onChange={v => setAnalysis(a => ({ ...a, carbs: v }))} />
                <NumericField label="Grasa" unit="g" value={analysis.fat}
                  onChange={v => setAnalysis(a => ({ ...a, fat: v }))} />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`py-2 rounded-lg text-xs font-medium border transition ${
                      category === cat
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                    }`}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !analysis.food_name || !analysis.calories}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-60 transition"
              >
                {saving ? 'Guardando...' : 'Guardar comida'}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

function NumericField({
  label, unit, value, onChange, integer,
}: {
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
