import { Upload, Video, Monitor, Activity, AlertTriangle, Map } from 'lucide-react'
import styles from './Topbar.module.css'

const MODES = [
  { id: 'upload',  label: 'Fayl yuklash', Icon: Upload  },
  { id: 'webcam',  label: 'Veb-kamera',   Icon: Video   },
  { id: 'demo',    label: 'Demo',          Icon: Monitor },
  { id: 'map',     label: 'Xarita',        Icon: Map     },
]

export default function Topbar({ page, setPage, status, metrics }) {
  const isRunning = status === 'running'
  const isDone    = status === 'done'
  const isError   = status === 'error'

  const canSwitch = !isRunning

  return (
    <header className={styles.topbar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="rgba(0,180,220,0.25)" strokeWidth="1"/>
            <path d="M14 4 L22 9 L22 19 L14 24 L6 19 L6 9 Z"
                  stroke="#00b4d8" strokeWidth="1.5" fill="rgba(0,180,220,0.06)"/>
            <circle cx="14" cy="14" r="3" fill="#00b4d8" fillOpacity=".9"/>
            <line x1="14" y1="14" x2="14" y2="4"
                  stroke="#00b4d8" strokeWidth="1.2" strokeOpacity=".5"
                  style={{transformOrigin:'14px 14px', animation:'radar-sweep 3s linear infinite'}}/>
          </svg>
          <div className={styles.ring1}/>
          <div className={styles.ring2}/>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>SENTINEL<span className={styles.logoAI}>AI</span></span>
          <span className={styles.logoSub}>Surveillance Platform</span>
        </div>
      </div>

      {/* Mode tabs */}
      <nav className={styles.nav}>
        {MODES.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`${styles.navBtn} ${page === id || (page === 'live' && false) ? styles.navActive : ''}`}
            onClick={() => canSwitch && setPage(id)}
            disabled={!canSwitch}
            data-active={page === id}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>

      {/* Status chip */}
      <div className={styles.statusArea}>
        {isRunning && metrics?.fps != null && (
          <span className={`${styles.chip} ${styles.chipCyan}`}>
            <Activity size={11} strokeWidth={2.5} />
            {metrics.fps.toFixed(1)} FPS
          </span>
        )}
        {isRunning && (
          <span className={`${styles.chip} ${styles.chipGreen}`}>
            <span className="dot dot-green" />
            LIVE
          </span>
        )}
        {isDone && (
          <span className={`${styles.chip} ${styles.chipMuted}`}>
            Tahlil yakunlandi
          </span>
        )}
        {isError && (
          <span className={`${styles.chip} ${styles.chipRed}`}>
            <AlertTriangle size={11} strokeWidth={2.5} />
            Xatolik
          </span>
        )}
        {!isRunning && !isDone && !isError && (
          <span className={`${styles.chip} ${styles.chipMuted}`}>
            <span className="dot dot-cyan" />
            Tayyor
          </span>
        )}
      </div>
    </header>
  )
}
