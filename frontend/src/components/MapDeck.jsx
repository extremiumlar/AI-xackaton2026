import { useState, useMemo, useRef, useCallback } from 'react'
import { REGIONS_GEO } from '../data/uzbekistanGeo.js'

/* ── Projection ─────────────────────────────────────── */
const W = 900, H = 500
const LON_MIN = 55.5, LON_MAX = 73.5
const LAT_MIN = 36.8, LAT_MAX = 46.2
const PAD = 24

function project([lon, lat]) {
  const x = PAD + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (W - PAD * 2)
  const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (H - PAD * 2)
  return [x, y]
}

function ringToPath(ring) {
  return ring.map(([lon, lat], i) => {
    const [x, y] = project([lon, lat])
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ') + ' Z'
}

/* ── Score → color ──────────────────────────────────── */
function scoreColor(s, alpha = 1) {
  if (s >= 0.75) return `rgba(220,38,38,${alpha})`
  if (s >= 0.55) return `rgba(234,88,12,${alpha})`
  if (s >= 0.38) return `rgba(202,138,4,${alpha})`
  if (s >= 0.22) return `rgba(101,163,13,${alpha})`
  return `rgba(5,150,105,${alpha})`
}

function scoreStroke(s) {
  if (s >= 0.75) return '#ef4444'
  if (s >= 0.55) return '#f97316'
  if (s >= 0.38) return '#eab308'
  if (s >= 0.22) return '#84cc16'
  return '#10b981'
}

function levelLabel(s) {
  if (s >= 0.75) return 'Juda xavfli'
  if (s >= 0.55) return 'Xavfli'
  if (s >= 0.38) return "O'rta"
  if (s >= 0.22) return 'Past'
  return 'Xavfsiz'
}

export default function MapDeck({ regionData }) {
  const [hovered, setHovered] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)

  const regions = useMemo(() =>
    REGIONS_GEO.features.map(feat => {
      const id    = feat.properties.id
      const score = regionData[id]?.score ?? 0.1
      const path  = ringToPath(feat.geometry.coordinates[0])
      return { id, score, path, props: feat.properties }
    }),
  [regionData])

  const onMouseMove = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const hData = hovered ? regionData[hovered.id] : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#060b14', borderRadius: 10 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 40" fill="none" stroke="rgba(0,180,220,0.04)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" rx="10"/>

        {/* Region polygons */}
        {regions.map(r => (
          <path
            key={r.id}
            d={r.path}
            fill={scoreColor(r.score, hovered?.id === r.id ? 1.0 : 0.82)}
            stroke={hovered?.id === r.id ? scoreStroke(r.score) : 'rgba(255,255,255,0.15)'}
            strokeWidth={hovered?.id === r.id ? 2 : 0.8}
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={() => setHovered(r)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Region labels for large regions */}
        {regions.filter(r => r.score >= 0.55).map(r => {
          const coords = REGIONS_GEO.features.find(f => f.properties.id === r.id)?.geometry.coordinates[0] ?? []
          if (!coords.length) return null
          const cx = coords.reduce((s, c) => s + c[0], 0) / coords.length
          const cy = coords.reduce((s, c) => s + c[1], 0) / coords.length
          const [px, py] = project([cx, cy])
          return (
            <text key={r.id + '_lbl'} x={px} y={py}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.9)"
                  style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {(r.score * 100).toFixed(0)}%
            </text>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          left: Math.min(mousePos.x + 14, W - 200),
          top: Math.max(mousePos.y - 80, 8),
          background: 'rgba(6,10,18,0.97)',
          border: `1px solid ${scoreStroke(hovered.score)}55`,
          borderLeft: `3px solid ${scoreStroke(hovered.score)}`,
          borderRadius: 9,
          padding: '10px 14px',
          minWidth: 180,
          pointerEvents: 'none',
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0', marginBottom: 6 }}>
            {hovered.props.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Xavf darajasi</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: scoreStroke(hovered.score) }}>
              {(hovered.score * 100).toFixed(0)}% — {levelLabel(hovered.score)}
            </span>
          </div>
          {hData && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.73rem', color: '#64748b' }}>Alertlar</span>
              <span style={{ fontSize: '0.78rem', color: '#f97316', fontWeight: 600 }}>{hData.alerts}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.73rem', color: '#64748b' }}>Kameralar</span>
              <span style={{ fontSize: '0.78rem', color: '#00b4d8', fontWeight: 600 }}>{hData.cameras}</span>
            </div>
          </>}
          {hovered.props.capital && (
            <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#475569' }}>
              Markaz: {hovered.props.capital}
            </div>
          )}
          {/* Score bar */}
          <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${hovered.score * 100}%`,
              background: scoreStroke(hovered.score),
              transition: 'width 0.3s',
            }}/>
          </div>
        </div>
      )}
    </div>
  )
}
