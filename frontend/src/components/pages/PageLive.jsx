import { Square, Activity, Users, AlertTriangle, Zap, ShieldAlert, ShieldCheck } from 'lucide-react'
import styles from './PageLive.module.css'

const FLAG_COLOR = {
  "Cho'qqayish":       '#f97316',
  "Qo'l yerga":        '#ef4444',
  "Turib qolgan":      '#00b4d8',
  "Atrofga qaraydi":   '#f97316',
}

export default function PageLive({ frame, metrics, liveAlerts = [], onStop }) {
  const { frames, tracks, alerts, fps } = metrics
  const danger = liveAlerts.filter(a => a.alert)
  const hasDanger = danger.length > 0

  return (
    <div className={styles.page}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.liveIndicator}>
          <span className="dot dot-red"/>
          <span className={styles.liveText}>JONLI TAHLIL</span>
        </div>
        <div className={styles.statsRow}>
          <Stat icon={Activity}       label="Kadr"  value={frames ?? '—'} color="var(--cyan)"/>
          <Stat icon={Users}          label="Odam"  value={tracks ?? '—'} color="var(--green)"/>
          <Stat icon={AlertTriangle}  label="Alert" value={alerts ?? '—'}
                color={alerts > 0 ? 'var(--red)' : 'var(--text-2)'} blink={alerts > 0}/>
          <Stat icon={Zap}            label="FPS"   value={fps ? fps.toFixed(1) : '—'} color="var(--orange)"/>
        </div>
        <button className="btn btn-danger" onClick={onStop}>
          <Square size={13} strokeWidth={2.5}/> To'xtatish
        </button>
      </div>

      {/* ── Main area ── */}
      <div className={styles.main}>
        {/* Video feed */}
        <div className={styles.frameWrap}>
          {frame ? (
            <>
              <img src={frame} className={styles.frame} alt="live"/>
              <div className={styles.scanline}/>
              <span className={`${styles.corner} ${styles.tl}`}/>
              <span className={`${styles.corner} ${styles.tr}`}/>
              <span className={`${styles.corner} ${styles.bl}`}/>
              <span className={`${styles.corner} ${styles.br}`}/>

              {/* Verdict overlay */}
              <div className={`${styles.verdictOverlay} ${hasDanger ? styles.verdictDanger : styles.verdictOk}`}>
                {hasDanger
                  ? <><ShieldAlert size={14}/> {danger.length} SHUBHALI ODAM</>
                  : <><ShieldCheck size={14}/> XAVFSIZ</>
                }
              </div>
            </>
          ) : (
            <div className={styles.frameIdle}>
              <div className={styles.loadRing}/>
              <p>Oqim kutilmoqda…</p>
            </div>
          )}
        </div>

        {/* Live alerts side panel */}
        <div className={styles.alertPanel}>
          <div className={styles.alertPanelTitle}>
            <span className="dot dot-red"/>
            Real-time tahlil
          </div>

          {liveAlerts.length === 0 ? (
            <div className={styles.alertEmpty}>
              <ShieldCheck size={28} strokeWidth={1.5} style={{color:'var(--green)'}}/>
              <p>Shubhali harakat yo'q</p>
            </div>
          ) : (
            <div className={styles.alertList}>
              {liveAlerts.map(a => (
                <div key={a.id}
                     className={`${styles.alertItem} ${a.alert ? styles.alertItemDanger : styles.alertItemWarn}`}>
                  <div className={styles.alertHead}>
                    <span className={styles.alertId}>Odam #{a.id}</span>
                    <span className={`badge ${a.alert ? 'badge-red' : 'badge-orange'}`}>
                      {(a.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className={styles.alertBar}>
                    <div className={styles.alertBarFill}
                         style={{
                           width: `${a.score * 100}%`,
                           background: a.alert ? 'var(--red)' : 'var(--orange)'
                         }}/>
                  </div>

                  {/* Behavior flags */}
                  {a.flags.length > 0 ? (
                    <div className={styles.alertFlags}>
                      {a.flags.map(f => (
                        <span key={f} className={styles.alertFlag}
                              style={{color: FLAG_COLOR[f] || 'var(--text-2)',
                                      borderColor: (FLAG_COLOR[f] || 'var(--border)') + '44'}}>
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.alertNoFlags}>Kuzatilmoqda…</p>
                  )}

                  {a.alert && (
                    <div className={styles.alertBanner}>
                      ⚠️ XAVFLI HARAKAT ANIQLANDI
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color, blink }) {
  return (
    <div className={`${styles.stat} ${blink ? styles.statBlink : ''}`}>
      <Icon size={13} strokeWidth={2} style={{ color }}/>
      <span className={styles.statVal} style={{ color }}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
