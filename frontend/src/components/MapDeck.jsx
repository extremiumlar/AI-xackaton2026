import { useState, useMemo, useRef, useCallback } from 'react'
import { REGIONS_GEO } from '../data/uzbekistanGeo.js'
import { NEIGHBORS, ARAL_SEA, CASPIAN_EAST, CAPITALS, RIVERS } from '../data/neighborGeo.js'

/* ── View bounds — Central Asia ─────────────────────── */
const W = 960, H = 560
const LON_MIN = 48.5, LON_MAX = 83.0
const LAT_MIN = 33.5, LAT_MAX = 57.0
const PAD = 20

function project([lon, lat]) {
  const x = PAD + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (W - PAD * 2)
  const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (H - PAD * 2)
  return [x, y]
}

function polyPath(coords) {
  return coords.map(([lon, lat], i) => {
    const [x, y] = project([lon, lat])
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ') + ' Z'
}

function linePath(points) {
  return points.map(([lon, lat], i) => {
    const [x, y] = project([lon, lat])
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
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

/* Polygon centroid */
function centroid(coords) {
  const cx = coords.reduce((s, c) => s + c[0], 0) / coords.length
  const cy = coords.reduce((s, c) => s + c[1], 0) / coords.length
  return [cx, cy]
}

export default function MapDeck({ regionData }) {
  const [hovered, setHovered] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)

  const regions = useMemo(() =>
    REGIONS_GEO.features.map(feat => {
      const id    = feat.properties.id
      const score = regionData[id]?.score ?? 0.1
      const coords = feat.geometry.coordinates[0]
      const path  = polyPath(coords)
      const cen   = centroid(coords)
      return { id, score, path, cen, props: feat.properties }
    }),
  [regionData])

  const onMouseMove = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    setMousePos({ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY })
  }, [])

  const hData = hovered ? regionData[hovered.id] : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#04090f', borderRadius: 10 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {/* Ocean gradient */}
          <radialGradient id="ocean" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#060d18"/>
            <stop offset="100%" stopColor="#03070e"/>
          </radialGradient>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(0,140,200,0.04)" strokeWidth="0.5"/>
          </pattern>
          {/* Glow filter for UZ */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.6)"/>
          </filter>
        </defs>

        {/* Ocean background */}
        <rect width={W} height={H} fill="url(#ocean)" rx="10"/>
        <rect width={W} height={H} fill="url(#grid)" rx="10"/>

        {/* Lat/Lon grid lines */}
        {[40, 45, 50, 55].map(lat => {
          const [, y] = project([65, lat])
          return <line key={`lat${lat}`} x1={PAD} x2={W-PAD} y1={y} y2={y}
                       stroke="rgba(0,120,180,0.06)" strokeWidth="0.5" strokeDasharray="4,6"/>
        })}
        {[55, 60, 65, 70, 75, 80].map(lon => {
          const [x] = project([lon, 45])
          return <line key={`lon${lon}`} x1={x} x2={x} y1={PAD} y2={H-PAD}
                       stroke="rgba(0,120,180,0.06)" strokeWidth="0.5" strokeDasharray="4,6"/>
        })}

        {/* Neighboring countries */}
        {NEIGHBORS.map(n => (
          <path key={n.id} d={polyPath(n.coords)}
                fill={n.color} stroke={n.stroke} strokeWidth="0.8"/>
        ))}

        {/* Caspian & Aral seas */}
        <path d={polyPath(CASPIAN_EAST)} fill="#0a1e30" stroke="rgba(0,120,180,0.3)" strokeWidth="0.6"/>
        <path d={polyPath(ARAL_SEA)}     fill="#0a1e2a" stroke="rgba(0,120,180,0.25)" strokeWidth="0.6"/>
        <text {...textAt(centroid(ARAL_SEA), 'Orol dengizi', 7, 'rgba(0,150,220,0.5)')}/>

        {/* Rivers */}
        {RIVERS.map(r => (
          <path key={r.name} d={linePath(r.points)}
                fill="none" stroke="rgba(0,100,160,0.25)" strokeWidth="1.2"
                strokeLinecap="round"/>
        ))}

        {/* Neighbor country labels */}
        {NEIGHBORS.map(n => {
          const cen = centroid(n.coords)
          const [px, py] = project(cen)
          return (
            <text key={n.id + '_lbl'} x={px} y={py}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="10" fontWeight="500" fill="rgba(150,170,190,0.6)"
                  style={{ pointerEvents: 'none', letterSpacing: '0.06em', userSelect: 'none' }}>
              {n.name}
            </text>
          )
        })}

        {/* ═══ Uzbekistan shadow (depth effect) ═══ */}
        {regions.map(r => (
          <path key={r.id + '_sh'} d={r.path}
                fill="rgba(0,0,0,0.4)" transform="translate(2,3)"
                style={{ pointerEvents: 'none' }}/>
        ))}

        {/* ═══ Uzbekistan regions ═══ */}
        {regions.map(r => (
          <path
            key={r.id}
            d={r.path}
            fill={scoreColor(r.score, hovered?.id === r.id ? 1.0 : 0.88)}
            stroke={hovered?.id === r.id ? scoreStroke(r.score) : 'rgba(255,255,255,0.22)'}
            strokeWidth={hovered?.id === r.id ? 1.8 : 0.9}
            style={{ cursor: 'pointer', transition: 'all 0.15s', filter: hovered?.id === r.id ? 'url(#glow)' : 'none' }}
            onMouseEnter={() => setHovered(r)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Score labels on regions */}
        {regions.filter(r => r.score >= 0.45).map(r => {
          const [px, py] = project(r.cen)
          return (
            <text key={r.id + '_lbl'} x={px} y={py}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7.5" fontWeight="700" fill="rgba(255,255,255,0.9)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {(r.score * 100).toFixed(0)}%
            </text>
          )
        })}

        {/* UZ border highlight */}
        <path
          d={regions.map(r => r.path).join(' ')}
          fill="none"
          stroke="rgba(0,200,255,0.12)"
          strokeWidth="0.5"
          style={{ pointerEvents: 'none' }}
        />

        {/* Capital cities */}
        {CAPITALS.map(cap => {
          const [px, py] = project([cap.lon, cap.lat])
          const isUZ = cap.id === 'UZ_cap'
          return (
            <g key={cap.id} style={{ pointerEvents: 'none' }}>
              <circle cx={px} cy={py} r={isUZ ? 4 : 2.5}
                      fill={isUZ ? '#00b4d8' : 'rgba(200,220,240,0.5)'}
                      stroke={isUZ ? 'rgba(0,180,220,0.8)' : 'rgba(150,180,200,0.3)'}
                      strokeWidth={isUZ ? 1.5 : 0.8}/>
              <text x={px + 6} y={py + 1}
                    fontSize={isUZ ? 8.5 : 7} fontWeight={isUZ ? '700' : '400'}
                    fill={isUZ ? '#7dd3fc' : 'rgba(160,190,210,0.7)'}
                    dominantBaseline="middle"
                    style={{ userSelect: 'none' }}>
                {cap.name}
              </text>
            </g>
          )
        })}

        {/* Compass rose */}
        <g transform={`translate(${W-42},${H-42})`} opacity="0.35">
          <circle cx="0" cy="0" r="18" fill="rgba(0,140,200,0.08)" stroke="rgba(0,140,200,0.3)" strokeWidth="0.8"/>
          <text x="0" y="-10" textAnchor="middle" fontSize="8" fill="#7dd3fc" fontWeight="700">N</text>
          <text x="0" y="14"  textAnchor="middle" fontSize="6" fill="#64748b">S</text>
          <text x="12" y="2" textAnchor="middle" fontSize="6" fill="#64748b">E</text>
          <text x="-12" y="2" textAnchor="middle" fontSize="6" fill="#64748b">W</text>
          <line x1="0" y1="-14" x2="0" y2="-7" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="0" y1="4"  x2="0" y2="11" stroke="#64748b" strokeWidth="0.8"/>
        </g>

        {/* Scale bar */}
        <g transform={`translate(${PAD + 8}, ${H - PAD - 14})`} opacity="0.5">
          <line x1="0" y1="0" x2="60" y2="0" stroke="#94a3b8" strokeWidth="1"/>
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#94a3b8" strokeWidth="1"/>
          <line x1="60" y1="-3" x2="60" y2="3" stroke="#94a3b8" strokeWidth="1"/>
          <text x="30" y="-6" textAnchor="middle" fontSize="7" fill="#94a3b8">≈ 500 km</text>
        </g>

        {/* "O'zbekiston" label */}
        {(() => {
          const uzCen = centroid(regions.map(r => REGIONS_GEO.features.find(f => f.properties.id === r.id).geometry.coordinates[0]).flat())
          const [px, py] = project(uzCen)
          return (
            <text x={px - 10} y={py + 38}
                  textAnchor="middle" fontSize="11" fontWeight="800"
                  fill="rgba(255,255,255,0.18)" letterSpacing="2"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
              O'ZBEKISTON
            </text>
          )
        })()}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          left: `${Math.min((hovered._px ?? mousePos.x) / W * 100 + 2, 62)}%`,
          top: `${Math.max((hovered._py ?? mousePos.y) / H * 100 - 22, 3)}%`,
          background: 'rgba(4,9,15,0.97)',
          border: `1px solid ${scoreStroke(hovered.score)}44`,
          borderLeft: `3px solid ${scoreStroke(hovered.score)}`,
          borderRadius: 10,
          padding: '11px 15px',
          minWidth: 190,
          pointerEvents: 'none',
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0', marginBottom: 7 }}>
            {hovered.props.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Xavf darajasi</span>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: scoreStroke(hovered.score) }}>
              {(hovered.score * 100).toFixed(0)}% · {levelLabel(hovered.score)}
            </span>
          </div>
          {hData && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.73rem', color: '#64748b' }}>Alertlar</span>
                <span style={{ fontSize: '0.78rem', color: '#f97316', fontWeight: 600 }}>{hData.alerts}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.73rem', color: '#64748b' }}>Kameralar</span>
                <span style={{ fontSize: '0.78rem', color: '#00b4d8', fontWeight: 600 }}>{hData.cameras}</span>
              </div>
            </>
          )}
          {hovered.props.capital && (
            <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#475569' }}>
              📍 {hovered.props.capital}
            </div>
          )}
          <div style={{ marginTop: 9, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${hovered.score * 100}%`,
              background: `linear-gradient(90deg, ${scoreStroke(hovered.score)}88, ${scoreStroke(hovered.score)})`,
              transition: 'width 0.3s',
            }}/>
          </div>
        </div>
      )}
    </div>
  )
}

/* Helper: SVG text element props */
function textAt([lon, lat], label, fontSize = 8, fill = 'rgba(100,130,150,0.5)') {
  const [x, y] = project([lon, lat])
  return { x, y, textAnchor: 'middle', dominantBaseline: 'middle',
           fontSize, fill, style: { pointerEvents: 'none', userSelect: 'none' } }
}
