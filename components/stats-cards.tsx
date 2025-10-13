type Props = {
  currentStreak: number
  longestStreak: number
  totalEntries: number
  averageScore: number
}

export default function StatsCards({ currentStreak, longestStreak, totalEntries, averageScore }: Props) {
  function pad2(n: number) {
    return n.toString().padStart(2, "0")
  }

  function formatAvg(n: number) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1)
  }

  return (
    <div id="stats-cards" className="max-w-[400px] w-full mx-auto font-mono">
      <div className="grid grid-cols-2 items-baseline gap-y-1 text-[14px]">
        <div id="stat-current-streak-label" className="text-muted-foreground/80 tracking-wide">current streak</div>
        <div id="stat-current-streak-value" className="text-right font-medium tabular-nums">{currentStreak}</div>

        <div id="stat-longest-streak-label" className="text-muted-foreground/80 tracking-wide">longest streak</div>
        <div id="stat-longest-streak-value" className="text-right font-medium tabular-nums">{longestStreak}</div>

        <div id="stat-total-entries-label" className="text-muted-foreground/80 tracking-wide">total entries</div>
        <div id="stat-total-entries-value" className="text-right font-medium tabular-nums">{totalEntries}</div>

        <div id="stat-average-score-label" className="text-muted-foreground/80 tracking-wide">average score</div>
        <div id="stat-average-score-value" className="text-right font-medium tabular-nums">{formatAvg(averageScore)}</div>
      </div>
    </div>
  )
}
