import { PlayCircle, Monitor, CheckCircle2 } from 'lucide-react'
import Card3D from '../Card3D.jsx'
import styles from './PageDemo.module.css'

const DEMO_LABELS = {
  'demo1.mp4': 'Ommaviy joy',
  'demo2.mp4': 'Koridor kuzatuv',
  'demo3.mp4': 'Ochiq maydon',
}

const DEMO_ICONS = {
  'demo1.mp4': '🏬',
  'demo2.mp4': '🚶',
  'demo3.mp4': '🌆',
}

export default function PageDemo({ samples, demoPath, setDemoPath, onStart }) {
  const items = samples.length > 0 ? samples : FALLBACK_DEMOS

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Demo rejim</h1>
        <p className={styles.sub}>
          Tayyor video namunalarida tizimni sinab ko'ring
        </p>
      </div>

      <div className={styles.content}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <Monitor size={36} strokeWidth={1.2} style={{color:'var(--text-3)'}}/>
            <p>Demo videolar topilmadi</p>
            <p style={{fontSize:'0.75rem', color:'var(--text-3)'}}>
              Backend/samples/ papkasiga MP4 fayllar qo'ying
            </p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {items.map((name) => {
                const isSelected = demoPath === name
                const label = DEMO_LABELS[name] || name.replace(/\.[^.]+$/, '')
                const icon  = DEMO_ICONS[name] || '🎬'
                return (
                  <Card3D key={name} className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                          intensity={6}>
                    <button className={styles.cardBtn} onClick={() => setDemoPath(name)}>
                      <div className={styles.thumbnail}>
                        <span className={styles.thumbIcon}>{icon}</span>
                        {isSelected && (
                          <div className={styles.selectedOverlay}>
                            <CheckCircle2 size={28} strokeWidth={1.8} style={{color:'var(--cyan)'}}/>
                          </div>
                        )}
                        <span className={styles.thumbBadge}>MP4</span>
                      </div>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardName}>{label}</span>
                        <span className={styles.cardFile}>{name}</span>
                      </div>
                    </button>
                  </Card3D>
                )
              })}
            </div>

            {demoPath && (
              <div className={styles.selectedInfo}>
                <span className="badge badge-cyan">
                  <CheckCircle2 size={11}/>
                  Tanlandi: {demoPath}
                </span>
              </div>
            )}

            <button className="btn btn-primary btn-lg"
                    disabled={!demoPath}
                    onClick={onStart}>
              <PlayCircle size={18} strokeWidth={2}/>
              Demo tahlilini boshlash
            </button>
          </>
        )}

        {/* What to expect */}
        <div className={styles.expect}>
          <p className={styles.expectTitle}>Nima ko'rish mumkin?</p>
          <div className={styles.expectGrid}>
            {EXPECTS.map(({icon, text}) => (
              <div key={text} className={styles.expectItem}>
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const FALLBACK_DEMOS = []

const EXPECTS = [
  { icon: '🟢', text: 'Odamlar atrofida yashil ramkalar' },
  { icon: '🔴', text: 'Shubhali shaxslarda qizil alert' },
  { icon: '📊', text: 'Real vaqtda kadr/trek/FPS ko\'rsatkichlari' },
  { icon: '📋', text: 'Tahlil tugaganda batafsil hisobot' },
]
