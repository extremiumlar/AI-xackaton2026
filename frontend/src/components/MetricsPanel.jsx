import { Layers, Users, AlertTriangle, Gauge } from 'lucide-react'
import styles from './MetricsPanel.module.css'

function MetricCard({ icon: Icon, label, value, color = '#00c8ee', blink = false }) {
  return (
    <div className={styles.card} style={{ '--accent': color }}>
      <div className={styles.topBar} />
      <div className={styles.iconRow}>
        <Icon size={14} className={styles.icon} />
        <span className={styles.label}>{label}</span>
        {blink && value !== '—' && +value > 0 && (
          <span className="dot-blink red" style={{ marginLeft: 'auto' }} />
        )}
      </div>
      <div className={styles.value}>{value}</div>
    </div>
  )
}

export default function MetricsPanel({ metrics, status }) {
  const fmt = v => (v === null || v === undefined) ? '—' : String(v)

  return (
    <aside className={styles.panel}>
      <div className="section-label">
        <Gauge size={11} /> Real-vaqt
      </div>

      <div className={styles.grid}>
        <MetricCard icon={Layers}       label="Kadrlar"          value={fmt(metrics.frames)} />
        <MetricCard icon={Users}        label="Kuzatuv"          value={fmt(metrics.tracks)} color="#00e87a" />
        <MetricCard icon={AlertTriangle} label="Ogohlantirishlar" value={fmt(metrics.alerts)} color="#ff4466" blink />
        <MetricCard icon={Gauge}        label="FPS"              value={fmt(metrics.fps)} color="#ff9900" />
      </div>

      <div className={styles.statusRow}>
        <div className="section-label" style={{ marginTop: '1rem' }}>
          Holat
        </div>
        <span className={`status-badge ${status}`}>
          {status === 'idle'      && '● Tayyor'}
          {status === 'uploading' && '↑ Yuklanmoqda'}
          {status === 'running'   && <><span className="dot-blink green" /> Tahlil davom etmoqda</>}
          {status === 'done'      && '✓ Yakunlandi'}
          {status === 'error'     && '✕ Xatolik'}
        </span>
      </div>

      <div className={styles.infoBox}>
        <div className="section-label" style={{ marginTop: '1rem' }}>Sozlamalar</div>
        <div className={styles.infoText}>
          Chap paneldan barcha parametrlarni sozlash mumkin
        </div>
      </div>
    </aside>
  )
}
