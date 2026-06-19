import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const JSON_SCHEMA = `{
  "food_name": "nombre del plato en español",
  "calories": número entero estimado de kilocalorías,
  "protein": gramos de proteína (número decimal con 1 decimal),
  "carbs": gramos de carbohidratos (número decimal con 1 decimal),
  "fat": gramos de grasa (número decimal con 1 decimal),
  "confidence": "high" o "low" según qué tan seguro estás,
  "ai_notes": "notas breves sobre el análisis o suposiciones (máx 100 caracteres)"
}`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { image, mimeType, description } = await request.json()

  if (!image && !description?.trim()) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  try {
    let result

    if (image && mimeType) {
      const prompt = `Analizá esta imagen de comida y devolvé ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional ni markdown:\n${JSON_SCHEMA}\n${description ? `Descripción adicional del usuario: "${description}"` : ''}\nSi no podés identificar comida en la imagen, usá confidence "low" y estimá con los datos disponibles.`
      result = await model.generateContent([
        { inlineData: { mimeType, data: image } },
        { text: prompt },
      ])
    } else {
      const prompt = `Sos un nutricionista. Basándote ÚNICAMENTE en la siguiente descripción de comida, estimá los valores nutricionales y devolvé ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional ni markdown:\n${JSON_SCHEMA}\n\nDescripción del plato: "${description}"\n\nConsiderá porciones estándar argentinas si no se especifican cantidades. Si la descripción es vaga usá confidence "low". Sé lo más preciso posible con los gramos de macros.`
      result = await model.generateContent(prompt)
    }

    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON en respuesta')

    const analysis = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      food_name: String(analysis.food_name ?? 'Comida desconocida'),
      calories: Math.round(Number(analysis.calories) || 0),
      protein: Number(Number(analysis.protein || 0).toFixed(1)),
      carbs: Number(Number(analysis.carbs || 0).toFixed(1)),
      fat: Number(Number(analysis.fat || 0).toFixed(1)),
      confidence: analysis.confidence === 'low' ? 'low' : 'high',
      ai_notes: String(analysis.ai_notes ?? ''),
    })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'Error al analizar' }, { status: 500 })
  }
}
