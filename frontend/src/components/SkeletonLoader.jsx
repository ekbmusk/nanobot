export function SkeletonLine({ w = 'w-full', h = 'h-4' }) {
  return <div className={`skeleton ${w} ${h}`} />
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="card p-4 space-y-3">
      <SkeletonLine w="w-2/3" h="h-5" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} w={i % 2 === 0 ? 'w-full' : 'w-4/5'} />
      ))}
    </div>
  )
}

export default function SkeletonPage({ cards = 3 }) {
  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <SkeletonLine w="w-1/2" h="h-7" />
      <SkeletonLine w="w-3/4" h="h-4" />
      <div className="pt-2 space-y-3">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
    </div>
  )
}
