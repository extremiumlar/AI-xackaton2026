import { useState } from 'react'
import styles from './UzbekistanMap.module.css'

/* ─── Threat color scale ──────────────────────────────── */
export function threatColor(score) {
  if (score >= 0.75) return '#ef4444'  // red
  if (score >= 0.55) return '#f97316'  // orange
  if (score >= 0.38) return '#eab308'  // yellow
  if (score >= 0.22) return '#84cc16'  // lime
  return '#10b981'                      // green
}

export function threatLevel(score) {
  if (score >= 0.75) return 'Juda xavfli'
  if (score >= 0.55) return 'Xavfli'
  if (score >= 0.38) return "O'rta"
  if (score >= 0.22) return 'Past'
  return 'Xavfsiz'
}

/* ─── SVG Region paths (900×560 viewBox) ─────────────── */
/*  Scale: ~53px/°lon, ~65px/°lat
    Origin: 56°E = x:0, 45.5°N = y:0                     */
export const REGIONS = [
  {
    id: 'karakalpakstan',
    name: "Qoraqalpog'iston AR",
    capital: 'Nukus',
    path: 'M15,5 L395,5 L440,102 L462,212 L414,268 L342,290 L238,290 L188,242 L128,172 L65,145 L15,90 Z',
    label: [185, 155],
  },
  {
    id: 'khorezm',
    name: 'Xorazm',
    capital: 'Urganch',
    path: 'M238,248 L342,248 L342,290 L238,290 Z',
    label: [290, 272],
  },
  {
    id: 'bukhara',
    name: 'Buxoro',
    capital: 'Buxoro',
    path: 'M238,290 L414,268 L505,255 L528,342 L512,476 L362,488 L232,460 L228,380 Z',
    label: [360, 385],
  },
  {
    id: 'navoiy',
    name: 'Navoiy',
    capital: "Navoiy sh.",
    path: 'M414,268 L505,255 L582,220 L620,268 L656,336 L620,418 L528,420 L512,342 Z',
    label: [562, 335],
  },
  {
    id: 'samarkand',
    name: 'Samarqand',
    capital: 'Samarqand',
    path: 'M512,342 L620,418 L648,340 L692,336 L700,378 L668,472 L512,476 Z',
    label: [600, 418],
  },
  {
    id: 'jizzakh',
    name: 'Jizzax',
    capital: 'Jizzax',
    path: 'M582,220 L648,172 L700,212 L694,272 L656,336 L620,268 Z',
    label: [642, 262],
  },
  {
    id: 'sirdarya',
    name: 'Sirdaryo',
    capital: 'Guliston',
    path: 'M648,172 L722,140 L752,168 L752,218 L700,212 Z',
    label: [706, 180],
  },
  {
    id: 'tashkent_region',
    name: 'Toshkent viloyati',
    capital: 'Toshkent (viloyat)',
    path: 'M700,90 L790,82 L834,148 L812,228 L752,218 L722,140 L700,118 Z',
    label: [763, 155],
  },
  {
    id: 'tashkent_city',
    name: 'Toshkent shahri',
    capital: 'Toshkent',
    path: 'M742,162 L774,162 L774,202 L742,202 Z',
    label: [758, 182],
  },
  {
    id: 'namangan',
    name: 'Namangan',
    capital: 'Namangan',
    path: 'M808,82 L890,82 L890,202 L814,222 L782,192 L810,148 Z',
    label: [848, 148],
  },
  {
    id: 'fergana',
    name: "Farg'ona",
    capital: "Farg'ona",
    path: 'M814,222 L890,202 L890,342 L810,368 L762,310 L794,248 Z',
    label: [840, 278],
  },
  {
    id: 'andijan',
    name: 'Andijon',
    capital: 'Andijon',
    path: 'M810,368 L890,342 L890,432 L810,432 L762,398 Z',
    label: [838, 398],
  },
  {
    id: 'kashkadarya',
    name: 'Qashqadaryo',
    capital: 'Qarshi',
    path: 'M512,476 L668,472 L700,378 L762,402 L762,538 L512,548 Z',
    label: [630, 502],
  },
  {
    id: 'surkhandarya',
    name: 'Surxondaryo',
    capital: 'Termiz',
    path: 'M762,398 L810,368 L810,432 L888,438 L888,540 L762,540 Z',
    label: [825, 488],
  },
]

/* ─── Component ──────────────────────────────────────── */
export default function UzbekistanMap({ data, onSelect, selected }) {
  const [tooltip, setTooltip] = useState(null)
  const [mouse,   setMouse]   = useState({ x: 0, y: 0 })

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMouse({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 40 })
  }

  return (
    <div className={styles.wrap} onMouseMove={handleMove}>
      <svg viewBox="0 0 905 560" className={styles.svg} role="img" aria-label="O'zbekiston viloyatlari xaritasi">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse">
            <path d="M45,0 L0,0 0,45" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/>
          </pattern>
          <filter id="glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect width="905" height="560" fill="url(#grid)"/>

        {/* Region shapes */}
        {REGIONS.map((r, i) => {
          const d = data[r.id]
          const score = d?.score ?? 0
          const color = threatColor(score)
          const isSelected = selected === r.id
          const isSmall = r.id === 'tashkent_city'

          return (
            <g key={r.id} className={styles.region}
               style={{ animationDelay: `${i * 45}ms` }}
               onMouseEnter={() => setTooltip(r)}
               onMouseLeave={() => setTooltip(null)}
               onClick={() => onSelect?.(r.id)}>
              <path
                d={r.path}
                fill={color}
                fillOpacity={isSelected ? 0.82 : 0.55}
                stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.18)'}
                strokeWidth={isSelected ? 1.8 : 0.8}
                className={styles.regionPath}
                style={{ filter: isSelected ? 'url(#glow)' : undefined }}
              />
              {/* Pulse ring for high threat */}
              {score >= 0.75 && (
                <path d={r.path} fill="none" stroke={color}
                      strokeWidth="2" opacity="0.4"
                      className={styles.pulse}/>
              )}
              {/* Label — skip for tiny Toshkent city */}
              {!isSmall && (
                <text x={r.label[0]} y={r.label[1]}
                      className={styles.label}
                      textAnchor="middle"
                      fontSize={r.id === 'sirdarya' || r.id === 'khorezm' ? 7 : 8.5}>
                  {r.name.split(' ')[0]}
                </text>
              )}
            </g>
          )
        })}

        {/* Toshkent city star marker */}
        <text x="758" y="186" fontSize="10" textAnchor="middle"
              fill="white" opacity="0.9" style={{pointerEvents:'none'}}>★</text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div className={styles.tooltip} style={{ left: mouse.x, top: mouse.y }}>
          <div className={styles.ttName}>{tooltip.name}</div>
          <div className={styles.ttRow}>
            <span>Markaz:</span><span>{tooltip.capital}</span>
          </div>
          {data[tooltip.id] && (
            <>
              <div className={styles.ttRow}>
                <span>Xavf bali:</span>
                <span style={{ color: threatColor(data[tooltip.id].score), fontWeight: 700 }}>
                  {(data[tooltip.id].score * 100).toFixed(0)}%
                  &nbsp;— {threatLevel(data[tooltip.id].score)}
                </span>
              </div>
              <div className={styles.ttRow}>
                <span>Alertlar:</span>
                <span style={{color:'#f97316'}}>{data[tooltip.id].alerts} ta</span>
              </div>
              <div className={styles.ttRow}>
                <span>Kameralar:</span>
                <span style={{color:'var(--cyan)'}}>{data[tooltip.id].cameras} ta</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
