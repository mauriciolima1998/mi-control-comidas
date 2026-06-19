function SkeletonBlock({ h }: { h: string }) {
  return <div className={`bg-white rounded-xl border border-gray-200 ${h} animate-pulse`} />
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonBlock h="h-24" />
      <SkeletonBlock h="h-14" />
      <SkeletonBlock h="h-36" />
      <SkeletonBlock h="h-20" />
      <SkeletonBlock h="h-14" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          <div className="h-12 border-b border-gray-100" />
          <div className="h-12" />
        </div>
      ))}
    </div>
  )
}
