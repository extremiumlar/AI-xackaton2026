import styles from './Header.module.css'

const BADGES = [
  { icon: '◎', label: 'YOLOv8 Detektor' },
  { icon: '◈', label: 'ByteTrack Kuzatuv' },
  { icon: '◉', label: '17-keypoint Poza' },
  { icon: '◆', label: 'Real-vaqt Alert' },
]

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.bgGrid} />

      {/* 3D orbit + shield logo */}
      <div className={styles.logoWrap}>
        <div className={`${styles.orbitRing} ${styles.orbit1}`} />
        <div className={`${styles.orbitRing} ${styles.orbit2}`} />
        <div className={`${styles.orbitRing} ${styles.orbit3}`} />

        {/* Center shield */}
        <div className={styles.shield}>
          <svg viewBox="0 0 80 80" width="78" height="78" fill="none">
            <path
              d="M40 7 L65 20 L65 44 Q65 64 40 74 Q15 64 15 44 L15 20 Z"
              fill="rgba(0,180,220,0.07)"
              stroke="#00c8ee"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <ellipse cx="40" cy="44" rx="14" ry="9" stroke="#00c8ee" strokeWidth="1.4" opacity="0.9" />
            <circle cx="40" cy="44" r="5.5" fill="rgba(0,200,238,0.14)" stroke="#00c8ee" strokeWidth="1.3" />
            <circle cx="40" cy="44" r="2.8" fill="#00c8ee" />
            <circle cx="42" cy="42" r="1.2" fill="white" opacity="0.8" />
            <line
              x1="40" y1="44" x2="40" y2="12"
              stroke="#00e87a" strokeWidth="1.8" opacity="0.9"
              className={styles.sweepLine}
              style={{ transformOrigin: '40px 44px', animation: 'sweep 3s linear infinite' }}
            />
          </svg>
        </div>

        {/* Radar blip targets */}
        <span className={`${styles.blip} ${styles.blip1}`} />
        <span className={`${styles.blip} ${styles.blip2}`} />
        <span className={`${styles.blip} ${styles.blip3}`} />
      </div>

      <h1 className={styles.title}>
        SENTINEL<span className={styles.ai}>AI</span>
      </h1>
      <p className={styles.subtitle}>
        Xulq-atvor tahlili &nbsp;&middot;&nbsp; Xavfsiz Shahar &nbsp;&middot;&nbsp; AI Platforma
      </p>

      <div className={styles.badges}>
        {BADGES.map(({ icon, label }) => (
          <span key={label} className={styles.badge}>
            <span className={styles.badgeIcon}>{icon}</span>
            {label}
          </span>
        ))}
      </div>
    </header>
  )
}
