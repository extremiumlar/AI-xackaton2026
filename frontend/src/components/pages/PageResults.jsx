import { Download, RotateCcw, AlertTriangle, CheckCircle, Users, Activity, ShieldAlert, ShieldCheck } from 'lucide-react'
import Card3D from '../Card3D.jsx'
import styles from './PageResults.module.css'

const API = 'http://localhost:8000'

const FLAG_COLORS = {
  "Cho'qqayish":            'badge-orange',
  "Yerga qo'l uzatish":     'badge-red',
  "Bir joyda turib qolish": 'badge-cyan',
  "Atrofga qarab turish":   'badge-orange',
}

function fmtTime(s) {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1).padStart(4, '0')
  return m > 0 ? `${m}:${sec}` : `${sec}s`
}

export default function PageResults({ metrics, alertLog, outputVideo, onReset }) {
  const { frames, tracks, alerts } = metrics
  const hasAlerts = alertLog.length > 0

  // Qaysi xatti-harakatlar eng ko'p uchragan
  const flagCounts = {}
  alertLog.forEach(row => {
    (row.flags || []).forEach(f => { flagCounts[f] = (flagCounts[f] || 0) + 1 })
  })
  const topFlags = Object.entries(flagCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className={styles.page}>
      {/* ── Verdict banner ── */}
      <div className={`${styles.verdictBanner} ${hasAlerts ? styles.verdictDanger : styles.verdictSafe}`}>
        <div className={styles.verdictIcon}>
          {hasAlerts
            ? <ShieldAlert size={36} strokeWidth={1.5}/>
            : <ShieldCheck size={36} strokeWidth={1.5}/>
          }
        </div>
        <div className={styles.verdictText}>
          <div className={styles.verdictTitle}>
            {hasAlerts
              ? `⚠️  ${alertLog.length} ta shubhali odam aniqlandi`
              : '✅  Xavfli harakatlar aniqlanmadi'}
          </div>
          <div className={styles.verdictSub}>
            {hasAlerts
              ? topFlags.length > 0
                  ? `Asosiy belgilar: ${topFlags.map(([f, n]) => `${f} (${n}×)`).join(' · ')}`
                  : 'Suspicion bali chegara qiymatidan oshdi'
              : 'Barcha kuzatilgan odamlar normal holda harakatlanishgan'}
          </div>
        </div>
        <div className={styles.headerActions}>
          {outputVideo && (
            <a href={`${API}/api/download/${outputVideo.split('/').pop()}`} download
               className="btn btn-cyan">
              <Download size={14} strokeWidth={2}/> Video yuklab olish
            </a>
          )}
          <button className="btn btn-ghost" onClick={onReset}>
            <RotateCcw size={14} strokeWidth={2}/> Yangi tahlil
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className={styles.summaryGrid}>
        {[
          { icon: Activity,      label: 'Jami kadrlar',        value: frames ?? '—', color: '#00b4d8' },
          { icon: Users,         label: 'Kuzatilgan odamlar',  value: tracks ?? '—', color: '#10b981' },
          { icon: AlertTriangle, label: 'Alert signallari',    value: alerts ?? '—',
            color: hasAlerts ? '#f43f5e' : '#10b981' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card3D key={label} className={styles.summaryCard} intensity={4}>
            <Icon size={22} strokeWidth={1.5} style={{ color }} className={styles.summaryIcon}/>
            <div className={styles.summaryVal} style={{ color }}>{value}</div>
            <div className={styles.summaryLabel}>{label}</div>
          </Card3D>
        ))}
      </div>

      {/* ── Alert log table ── */}
      {alertLog.length > 0 && (
        <div className={styles.tableWrap}>
          <div className={styles.tableTitle}>
            <AlertTriangle size={14} strokeWidth={2} style={{color:'var(--red)'}}/>
            Shubhali hodisalar jurnali — {alertLog.length} ta voqea
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Odam #</th>
                <th>Vaqt</th>
                <th>Xavf bali</th>
                <th>Aniqlangan harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {alertLog.map((row, i) => {
                const score = typeof row.score === 'number' ? row.score : 0
                const isHigh = score >= 0.75
                const flags = row.flags || []
                return (
                  <tr key={i} className={isHigh ? styles.rowHigh : ''}>
                    <td><span className={styles.trackId}>#{row.track_id}</span></td>
                    <td className={styles.cellMono}>{fmtTime(row.timestamp_s)}</td>
                    <td>
                      <div className={styles.scoreWrap}>
                        <span className={`badge ${isHigh ? 'badge-red' : 'badge-orange'}`}>
                          {(score * 100).toFixed(0)}%
                        </span>
                        <div className={styles.scoreBar}>
                          <div className={styles.scoreBarFill}
                               style={{ width: `${score * 100}%`,
                                        background: isHigh ? 'var(--red)' : 'var(--orange)' }}/>
                        </div>
                      </div>
                    </td>
                    <td className={styles.flags}>
                      {flags.length > 0
                        ? flags.map(f => (
                            <span key={f} className={`badge ${FLAG_COLORS[f] || 'badge-muted'}`}>{f}</span>
                          ))
                        : <span className="text-dim text-xs">—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {alertLog.length === 0 && (
        <div className={styles.noAlerts}>
          <CheckCircle size={36} strokeWidth={1.5} style={{color:'var(--green)'}}/>
          <p>Shubhali harakatlar aniqlanmadi</p>
          <p className="text-sm text-muted">Barcha kuzatilgan odamlar normal holda harakatlanishgan</p>
        </div>
      )}
    </div>
  )
}
