type Props = {
  currentStreak: number
  longestStreak: number
  totalEntries: number
  averageScore: number
  primaryColor: string
  secondaryColor: string
}

export default function StatsCards({ currentStreak, longestStreak, totalEntries, averageScore, primaryColor, secondaryColor }: Props) {
  function pad2(n: number) {
    return n.toString().padStart(2, "0")
  }

  function formatAvg(n: number) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1)
  }

  return (
    <div id="stats-cards" className="font-mono">
      <div id="stats-grid" className="grid grid-cols-2 items-baseline gap-y-1 text-[14px]">
        <div id="stat-current-streak-label" className="tracking-wide" style={{ color: secondaryColor }}>current streak</div>
        <div id="stat-current-streak-value" className="text-right font-medium tabular-nums" style={{ color: primaryColor }}>{currentStreak}</div>

        <div id="stat-longest-streak-label" className="tracking-wide" style={{ color: secondaryColor }}>longest streak</div>
        <div id="stat-longest-streak-value" className="text-right font-medium tabular-nums" style={{ color: primaryColor }}>{longestStreak}</div>

        <div id="stat-total-entries-label" className="tracking-wide" style={{ color: secondaryColor }}>total entries</div>
        <div id="stat-total-entries-value" className="text-right font-medium tabular-nums" style={{ color: primaryColor }}>{totalEntries}</div>

        <div id="stat-average-score-label" className="tracking-wide" style={{ color: secondaryColor }}>average score</div>
        <div id="stat-average-score-value" className="text-right font-medium tabular-nums" style={{ color: primaryColor }}>{formatAvg(averageScore)}</div>
      </div>
    </div>
  )
}
