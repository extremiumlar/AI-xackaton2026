import { Square, Activity, Users, AlertTriangle, Zap } from 'lucide-react'
import styles from './PageLive.module.css'

export default function PageLive({ frame, metrics, onStop }) {
  const { frames, tracks, alerts, fps } = metrics

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.liveIndicator}>
          <span className="dot dot-red"/>
          <span className={styles.liveText}>JONLI TAHLIL</span>
        </div>
        <div className={styles.statsRow}>
          <Stat icon={Activity} label="Kadr" value={frames ?? '—'} color="var(--cyan)"/>
          <Stat icon={Users}    label="Trek"  value={tracks ?? '—'} color="var(--green)"/>
          <Stat icon={AlertTriangle} label="Alert" value={alerts ?? '—'}
                color={alerts > 0 ? 'var(--red)' : 'var(--text-2)'} blink={alerts > 0}/>
          <Stat icon={Zap}     label="FPS"   value={fps ? fps.toFixed(1) : '—'} color="var(--orange)"/>
        </div>
        <button className="btn btn-danger" onClick={onStop}>
          <Square size={13} strokeWidth={2.5}/> To'xtatish
        </button>
      </div>

      {/* Video frame */}
      <div className={styles.frameWrap}>
        {frame ? (
          <>
            <img src={frame} className={styles.frame} alt="live"/>
            <div className={styles.scanline}/>
            {/* Corner brackets */}
            <span className={`${styles.corner} ${styles.tl}`}/>
            <span className={`${styles.corner} ${styles.tr}`}/>
            <span className={`${styles.corner} ${styles.bl}`}/>
            <span className={`${styles.corner} ${styles.br}`}/>
          </>
        ) : (
          <div className={styles.frameIdle}>
            <div className={styles.loadRing}/>
            <p>Oqim kutilmoqda…</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color, blink }) {
  return (
    <div className={`${styles.stat} ${blink ? styles.statBlink : ''}`} style={{ '--stat-color': color }}>
      <Icon size={13} strokeWidth={2} style={{ color }}/>
      <span className={styles.statVal} style={{ color }}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
