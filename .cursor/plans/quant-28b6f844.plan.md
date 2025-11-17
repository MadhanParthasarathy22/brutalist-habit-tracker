<!-- 28b6f844-8ae8-4b14-acbc-2072eccb34b6 2e132443-7a42-4b0d-887a-205a53b1b48c -->
# Add Month Labels to Heatmap Grid

## Overview

Add month labels (e.g., "jan", "feb", "mar") positioned to the left of the heatmap grid, aligned with the row where each month begins. The labels will be absolutely positioned so they don't affect the grid's centering.

## Implementation Details

### 1. Calculate Month Start Positions

In `components/habit-heatmap.tsx`, create a `useMemo` to compute which week index each month starts at:

```typescript
const monthLabels = useMemo(() => {
  const labels: { month: string; weekIndex: number }[] = []
  const seenMonths = new Set<string>()
  
  weeks.forEach((weekDays, weekIndex) => {
    weekDays.forEach(date => {
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      if (!seenMonths.has(monthKey) && date >= yearStart && date <= todayStart) {
        seenMonths.add(monthKey)
        const monthName = date.toLocaleString('en', { month: 'short' }).toLowerCase()
        labels.push({ month: monthName, weekIndex })
      }
    })
  })
  
  return labels
}, [weeks, yearStart, todayStart])
```

### 2. Add Month Labels Container

Wrap the heatmap grid in a relative-positioned container and add absolutely positioned month labels:

- Update the `heatmap-grid` parent div to use `relative` positioning
- Add month labels as absolutely positioned elements to the left of the grid
- Calculate vertical position based on `weekIndex` and tile height
- Position labels at `-40px` (or appropriate offset) from the left edge of the grid
- Style labels: 14px Geist Mono, grey color matching existing month labels (e.g., `text-muted-foreground/60`)

### 3. Structure Changes

```typescript
<div className="relative w-full">
  {/* Month labels - absolutely positioned */}
  <div className="absolute left-0 top-0 w-0 h-full pointer-events-none">
    {monthLabels.map(({ month, weekIndex }) => (
      <div
        key={month}
        className="absolute font-mono text-[14px] text-muted-foreground/60"
        style={{
          top: `calc(${weekIndex * (100 / visibleWeeks)}% + var(--tile-height) / 2)`,
          right: '12px', // 12px gap from grid
          transform: 'translateY(-50%)'
        }}
      >
        {month}
      </div>
    ))}
  </div>
  
  {/* Existing grid */}
  <div id="heatmap-grid" className="grid grid-cols-7 gap-0 content-end w-full">
    {/* existing tile code */}
  </div>
</div>
```

### 4. Dynamic Height Calculation

Since tiles use `aspect-square` and the grid is responsive, we'll need to:

- Use a ref to measure actual tile height after render
- Update label positioning dynamically, or use CSS calc with the grid's natural flow

**Alternative simpler approach**: Since the grid is 7 columns with no gaps, and each week is a row, we can position labels using grid row alignment:

- Keep the grid structure as-is
- Add a separate absolutely-positioned overlay for month labels
- Calculate label Y position as: `(weekIndex / totalVisibleWeeks) * gridHeight`

## Files to Modify

- `components/habit-heatmap.tsx` - Add month label calculation and rendering

### To-dos

- [ ] Create useMemo to calculate month start positions (month name + week index)
- [ ] Add absolutely positioned month labels overlay to the left of the grid
- [ ] Style labels with 14px Geist Mono and appropriate grey color