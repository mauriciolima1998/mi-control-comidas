import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DateSelector from './DateSelector'
import CalorieProgress from './CalorieProgress'
import ActivityInput from './ActivityInput'
import WeightHeader from './WeightHeader'
import ActivityRecommendation from './ActivityRecommendation'
import DashboardShell from './DashboardShell'

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: dateParam } = await searchParams
  const date = dateParam ?? toDateStr(new Date())

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const sevenDaysAgo = toDateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

  const [
    { data: profile },
    { data: meals },
    { data: activity },
    { data: todayWeightLog },
    { data: lastWeightLog },
    { data: weeklyData },
    { data: weightHistory },
  ] = await Promise.all([
    supabase.from('profiles')
      .select('daily_calorie_goal, current_weight, target_weight, age')
      .eq('id', user.id)
      .single(),
    supabase.from('meals')
      .select('id, food_name, calories, protein, carbs, fat, category, image_url, ai_confidence')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('created_at'),
    supabase.from('daily_activity')
      .select('calories_burned, steps')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle(),
    supabase.from('weight_logs')
      .select('weight, date')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle(),
    supabase.from('weight_logs')
      .select('weight, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('daily_calories')
      .select('total_calories, date')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo)
      .lte('date', date),
    supabase.from('weight_logs')
      .select('weight, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(60),
  ])

  const calorieGoal = profile?.daily_calorie_goal ?? 2000
  const burned = activity?.calories_burned ?? 0

  const totalConsumed = meals?.reduce((s, m) => s + m.calories, 0) ?? 0
  const totalProtein  = meals?.reduce((s, m) => s + Number(m.protein), 0) ?? 0
  const totalCarbs    = meals?.reduce((s, m) => s + Number(m.carbs), 0) ?? 0
  const totalFat      = meals?.reduce((s, m) => s + Number(m.fat), 0) ?? 0

  // Average daily deficit over last 7 days
  const avgDailyDeficit = (() => {
    if (!weeklyData || weeklyData.length === 0) return 0
    const avg = weeklyData.reduce((s, d) => s + Number(d.total_calories), 0) / weeklyData.length
    return Math.max(0, Math.round(calorieGoal - avg + (burned)))
  })()

  const currentWeight = lastWeightLog?.weight ?? profile?.current_weight ?? null

  return (
    <div className="flex flex-col gap-4">
      <WeightHeader
        date={date}
        currentWeight={currentWeight}
        currentWeightDate={lastWeightLog?.date ?? null}
        todayWeight={todayWeightLog?.weight ?? null}
        targetWeight={profile?.target_weight ?? null}
        avgDailyDeficit={avgDailyDeficit}
        weightHistory={weightHistory ?? []}
      />

      <DateSelector date={date} />

      <CalorieProgress
        consumed={totalConsumed}
        burned={burned}
        goal={calorieGoal}
        protein={totalProtein}
        carbs={totalCarbs}
        fat={totalFat}
      />

      <ActivityInput
        date={date}
        initialBurned={activity?.steps ? 0 : burned}
        initialSteps={activity?.steps ?? 0}
        weightKg={currentWeight}
      />

      <ActivityRecommendation
        remainingCalories={Math.max(0, totalConsumed - burned - calorieGoal)}
        burnedToday={burned}
        age={profile?.age ?? null}
        weightKg={currentWeight}
      />

      <DashboardShell meals={meals ?? []} date={date}>
        <></>
      </DashboardShell>
    </div>
  )
}
