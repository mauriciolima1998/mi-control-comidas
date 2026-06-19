import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { currentWeight, targetWeight, avgDailyDeficit } = await request.json()

  if (!currentWeight || !targetWeight || avgDailyDeficit == null) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `Una persona quiere bajar de peso. Sus datos son:
- Peso actual: ${currentWeight} kg
- Peso objetivo: ${targetWeight} kg
- Déficit calórico promedio diario (últimos 7 días): ${avgDailyDeficit} kcal

Calculá cuántos días tardaría en alcanzar su objetivo considerando:
1. 1 kg de grasa ≈ 7700 kcal
2. La adaptación metabólica hace que el déficit efectivo se reduce con el tiempo
3. La pérdida de peso no es lineal

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional:
{
  "days": número estimado de días (entero),
  "message": "frase corta y motivadora en español de máximo 80 caracteres con el estimado y un consejo clave"
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')

    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      days: Math.max(1, Math.round(Number(data.days) || 0)),
      message: String(data.message ?? ''),
    })
  } catch {
    // Fallback to pure math if Gemini fails
    const kgToLose = currentWeight - targetWeight
    const days = kgToLose > 0 && avgDailyDeficit > 0
      ? Math.round((kgToLose * 7700) / avgDailyDeficit)
      : null
    return NextResponse.json({
      days,
      message: days ? `Estimado: ~${days} días a tu ritmo actual.` : null,
    })
  }
}
