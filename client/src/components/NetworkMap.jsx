const PADDING = 100
const STATION_R = 14

// SVG network map. showLines controls whether the lines are drawn (Setup phase) or not (Planning phase)
function NetworkMap({ stations, lines = [], showLines = false, startId, destId }) {
  if (!stations || stations.length === 0) return null

  const xs = stations.map((s) => s.x)
  const ys = stations.map((s) => s.y)
  const minX = Math.min(...xs) - PADDING
  const minY = Math.min(...ys) - PADDING
  const width = Math.max(...xs) - Math.min(...xs) + 2 * PADDING
  const height = Math.max(...ys) - Math.min(...ys) + 2 * PADDING

  const byId = new Map(stations.map((s) => [s.id, s]))

  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      style={{ width: "100%", height: "auto", maxHeight: "60vh", background: "#fafafa", borderRadius: 8 }}
      role="img"
      aria-label="Network map"
    >
      {showLines &&
        lines.map((line) => {
          const points = line.stops
            .map((id) => byId.get(id))
            .filter(Boolean)
            .map((s) => `${s.x},${s.y}`)
            .join(" ")
          return (
            <polyline
              key={line.id}
              points={points}
              fill="none"
              stroke={line.color}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          )
        })}

      {stations.map((s) => {
        const isStart = s.id === startId
        const isDest = s.id === destId
        const fill = isStart ? "#2e7d32" : isDest ? "#c62828" : s.interchange ? "#ffffff" : "#37474f"
        const stroke = isStart || isDest ? "#000" : "#37474f"
        return (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r={STATION_R} fill={fill} stroke={stroke} strokeWidth={3} />
            <text
              x={s.x}
              y={s.y - STATION_R - 6}
              textAnchor="middle"
              fontSize={22}
              fontWeight={isStart || isDest ? "bold" : "normal"}
              fill="#222"
            >
              {s.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default NetworkMap
