import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { remainingCalories, burnedToday, age, weightKg, availableMinutes, location, fitnessLevel } = await request.json()

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `Sos un entrenador personal. Basándote en estos datos, recomendá una actividad física:

Datos del usuario:
- Edad: ${age ?? 'no especificada'} años
- Peso: ${weightKg ?? 'no especificado'} kg
- Calorías ya quemadas hoy: ${burnedToday} kcal
- Calorías que le quedan para llegar a su meta de déficit: ${remainingCalories} kcal
- Tiempo disponible: ${availableMinutes} minutos
- Lugar: ${location}
- Nivel de actividad: ${fitnessLevel}

Reglas importantes:
- Si la edad es mayor a 60 o el nivel es "sedentario", priorizá caminata o ejercicios de bajo impacto
- Si no puede lograr el déficit con el tiempo disponible, decíselo claramente y recomendá igual para mantener rutina
- Sé específico con la duración y el ritmo (ej: "caminá 45 min a paso sostenido")
- Considerá ejercicios apropiados para el lugar elegido
- Si el déficit ya está logrado, recomendá igual algo liviano para mantener hábito

Respondé ÚNICAMENTE con JSON válido, sin markdown:
{
  "exercise": "nombre del ejercicio",
  "duration_minutes": número,
  "estimated_calories": número,
  "intensity": "baja" | "moderada" | "alta",
  "achieves_deficit": true | false,
  "instructions": "descripción breve de cómo hacerlo (máx 120 caracteres)",
  "message": "mensaje motivador personalizado (máx 100 caracteres)"
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      exercise: String(data.exercise ?? 'Caminata'),
      duration_minutes: Math.round(Number(data.duration_minutes) || 30),
      estimated_calories: Math.round(Number(data.estimated_calories) || 0),
      intensity: data.intensity ?? 'moderada',
      achieves_deficit: Boolean(data.achieves_deficit),
      instructions: String(data.instructions ?? ''),
      message: String(data.message ?? ''),
    })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'Error al generar recomendación' }, { status: 500 })
  }
}
