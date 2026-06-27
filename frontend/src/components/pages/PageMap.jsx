import { useState, useMemo } from 'react'
import { AlertTriangle, Camera, MapPin, TrendingUp, TrendingDown, Minus,
         Clock, RefreshCw } from 'lucide-react'
import MapDeck from '../MapDeck.jsx'
import Card3D  from '../Card3D.jsx'
import styles  from './PageMap.module.css'

/* ─── Simulated data ──────────────────────────── */
const SIM = {
  '24h': {
    tashkent_city:    { score: 0.84, alerts: 47, cameras: 38, change: +12 },
    namangan:         { score: 0.68, alerts: 31, cameras: 22, change: +5  },
    andijan:          { score: 0.73, alerts: 39, cameras: 28, change: +8  },
    fergana:          { score: 0.58, alerts: 26, cameras: 19, change: -3  },
    tashkent_region:  { score: 0.45, alerts: 19, cameras: 15, change: +2  },
    samarkand:        { score: 0.41, alerts: 16, cameras: 14, change: -1  },
    surkhandarya:     { score: 0.55, alerts: 23, cameras: 11, change: +6  },
    kashkadarya:      { score: 0.34, alerts: 12, cameras:  9, change:  0  },
    bukhara:          { score: 0.30, alerts: 10, cameras: 12, change: -2  },
    khorezm:          { score: 0.37, alerts: 14, cameras: 10, change: +1  },
    jizzakh:          { score: 0.26, alerts:  8, cameras:  7, change: -1  },
    navoiy:           { score: 0.17, alerts:  5, cameras:  8, change:  0  },
    sirdarya:         { score: 0.22, alerts:  6, cameras:  5, change: +1  },
    karakalpakstan:   { score: 0.14, alerts:  3, cameras: 14, change:  0  },
  },
  '1w': {
    tashkent_city:    { score: 0.78, alerts: 312, cameras: 38, change: +8  },
    namangan:         { score: 0.72, alerts: 198, cameras: 22, change: +11 },
    andijan:          { score: 0.65, alerts: 241, cameras: 28, change: +3  },
    fergana:          { score: 0.62, alerts: 183, cameras: 19, change: +7  },
    tashkent_region:  { score: 0.50, alerts: 125, cameras: 15, change: +4  },
    samarkand:        { score: 0.44, alerts:  98, cameras: 14, change: +2  },
    surkhandarya:     { score: 0.48, alerts: 142, cameras: 11, change: +9  },
    kashkadarya:      { score: 0.38, alerts:  76, cameras:  9, change: +1  },
    bukhara:          { score: 0.33, alerts:  62, cameras: 12, change: -1  },
    khorezm:          { score: 0.41, alerts:  89, cameras: 10, change: +3  },
    jizzakh:          { score: 0.28, alerts:  44, cameras:  7, change:  0  },
    navoiy:           { score: 0.19, alerts:  28, cameras:  8, change: +1  },
    sirdarya:         { score: 0.24, alerts:  38, cameras:  5, change: +2  },
    karakalpakstan:   { score: 0.16, alerts:  19, cameras: 14, change:  0  },
  },
  '1m': {
    tashkent_city:    { score: 0.81, alerts: 1248, cameras: 38, change: +15 },
    namangan:         { score: 0.74, alerts:  832, cameras: 22, change: +18 },
    andijan:          { score: 0.70, alerts:  974, cameras: 28, change: +12 },
    fergana:          { score: 0.65, alerts:  711, cameras: 19, change: +10 },
    tashkent_region:  { score: 0.52, alerts:  498, cameras: 15, change:  +5 },
    samarkand:        { score: 0.47, alerts:  387, cameras: 14, change:  +3 },
    surkhandarya:     { score: 0.51, alerts:  562, cameras: 11, change: +14 },
    kashkadarya:      { score: 0.40, alerts:  298, cameras:  9, change:  +2 },
    bukhara:          { score: 0.36, alerts:  248, cameras: 12, change:  -3 },
    khorezm:          { score: 0.43, alerts:  354, cameras: 10, change:  +4 },
    jizzakh:          { score: 0.29, alerts:  172, cameras:  7, change:  -1 },
    navoiy:           { score: 0.20, alerts:  108, cameras:  8, change:  +1 },
    sirdarya:         { score: 0.25, alerts:  148, cameras:  5, change:  +3 },
    karakalpakstan:   { score: 0.17, alerts:   74, cameras: 14, change:  +1 },
  },
}

const TIME_OPTS = [
  { id: '24h', label: "So'nggi 24 soat" },
  { id: '1w',  label: '1 hafta'          },
  { id: '1m',  label: '1 oy'             },
]

const REGIONS_META = [
  { id: 'tashkent_city',   name: 'Toshkent shahri'  },
  { id: 'andijan',         name: 'Andijon'            },
  { id: 'namangan',        name: 'Namangan'           },
  { id: 'fergana',         name: "Farg'ona"           },
  { id: 'surkhandarya',    name: 'Surxondaryo'        },
  { id: 'tashkent_region', name: 'Toshkent viloyati' },
  { id: 'samarkand',       name: 'Samarqand'          },
  { id: 'khorezm',         name: 'Xorazm'             },
  { id: 'kashkadarya',     name: 'Qashqadaryo'        },
  { id: 'bukhara',         name: 'Buxoro'             },
  { id: 'sirdarya',        name: 'Sirdaryo'           },
  { id: 'jizzakh',         name: 'Jizzax'             },
  { id: 'navoiy',          name: 'Navoiy'             },
  { id: 'karakalpakstan',  name: "Qoraqalpog'iston"  },
]

function threatHex(s) {
  if (s >= 0.75) return '#ef4444'
  if (s >= 0.55) return '#f97316'
  if (s >= 0.38) return '#eab308'
  if (s >= 0.22) return '#84cc16'
  return '#10b981'
}

export default function PageMap() {
  const [period, setPeriod] = useState('24h')
  const data = SIM[period]

  const sorted = useMemo(() =>
    [...REGIONS_META].sort((a, b) => (data[b.id]?.score ?? 0) - (data[a.id]?.score ?? 0)),
    [period]
  )

  const totals = useMemo(() => {
    const vals = Object.values(data)
    return {
      alerts:   vals.reduce((s, v) => s + v.alerts,  0),
      cameras:  vals.reduce((s, v) => s + v.cameras, 0),
      avgScore: vals.reduce((s, v) => s + v.score, 0) / vals.length,
      danger:   vals.filter(v => v.score >= 0.55).length,
    }
  }, [period])

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Xavfsizlik xaritasi</h1>
          <p className={styles.sub}>
            O'zbekiston viloyat va tumanlari bo'yicha shubhali harakatlar · Viloyatni bosing → tumanlarga o'ting
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.timeTabs}>
            <Clock size={13} style={{ color: 'var(--text-3)' }}/>
            {TIME_OPTS.map(t => (
              <button key={t.id}
                className={`btn ${period === t.id ? 'btn-cyan' : 'btn-ghost'}`}
                onClick={() => setPeriod(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────── */}
      <div className={styles.summaryRow}>
        {[
          { label: 'Jami alertlar',      val: totals.alerts,                         color: '#f97316', Icon: AlertTriangle },
          { label: 'Faol kameralar',     val: totals.cameras,                        color: '#00b4d8', Icon: Camera        },
          { label: "O'rtacha xavf",      val: `${(totals.avgScore*100).toFixed(0)}%`,color: '#eab308', Icon: MapPin        },
          { label: 'Xavfli hududlar',    val: totals.danger,                         color: '#ef4444', Icon: AlertTriangle },
        ].map(({ label, val, color, Icon }) => (
          <Card3D key={label} className={styles.summCard} intensity={4}>
            <Icon size={16} strokeWidth={1.8} style={{ color }}/>
            <div className={styles.summVal} style={{ color }}>{val}</div>
            <div className={styles.summLabel}>{label}</div>
          </Card3D>
        ))}
      </div>

      {/* ── Map + rank list ─────────────────────────── */}
      <div className={styles.body}>
        {/* 3D Deck.gl map */}
        <div className={styles.mapOuter}>
          <div className={styles.demoBadge}>
            <span className="dot dot-cyan"/>
            DEMO — Tahminy ma'lumotlar &nbsp;·&nbsp; 3D ko'rinish
          </div>
          <div className={styles.mapInner}>
            <MapDeck regionData={data} period={period}/>
          </div>
          {/* Legend */}
          <div className={styles.legend}>
            {LEGEND.map(({ label, color }) => (
              <div key={label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }}/>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Rank list */}
        <div className={styles.sidebar}>
          <div className={styles.rankTitle}>
            Xavf reytingi
            <span className={styles.rankPeriod}>{TIME_OPTS.find(t=>t.id===period)?.label}</span>
          </div>
          <div className={styles.rankList}>
            {sorted.map((r, i) => {
              const d = data[r.id]
              if (!d) return null
              const color = threatHex(d.score)
              return (
                <div key={r.id} className={styles.rankItem}>
                  <span className={styles.rankNum}>{i + 1}</span>
                  <span className={styles.rankDot} style={{ background: color }}/>
                  <span className={styles.rankName}>{r.name}</span>
                  <div className={styles.rankRight}>
                    <div className={styles.rankBar}>
                      <div className={styles.rankBarFill}
                           style={{ width: `${d.score * 100}%`, background: color }}/>
                    </div>
                    <span className={styles.rankScore} style={{ color }}>
                      {(d.score * 100).toFixed(0)}%
                    </span>
                    <Trend v={d.change}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Trend({ v }) {
  if (v > 0) return <span className={`${styles.trend} ${styles.tUp}`}><TrendingUp size={10}/> +{v}</span>
  if (v < 0) return <span className={`${styles.trend} ${styles.tDown}`}><TrendingDown size={10}/> {v}</span>
  return <span className={`${styles.trend} ${styles.tFlat}`}><Minus size={10}/> 0</span>
}

const LEGEND = [
  { color: '#10b981', label: 'Xavfsiz' },
  { color: '#84cc16', label: 'Past' },
  { color: '#eab308', label: "O'rta" },
  { color: '#f97316', label: 'Xavfli' },
  { color: '#ef4444', label: 'Juda xavfli' },
]
