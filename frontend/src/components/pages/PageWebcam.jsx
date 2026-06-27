import { useState } from 'react'
import { Video, PlayCircle, Camera, AlertCircle } from 'lucide-react'
import Card3D from '../Card3D.jsx'
import styles from './PageWebcam.module.css'

export default function PageWebcam({ camIndex, setCamIndex, onStart }) {
  const [testing, setTesting] = useState(false)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Veb-kamera</h1>
        <p className={styles.sub}>Real vaqtda kamera oqimini tahlil qiling</p>
      </div>

      <div className={styles.content}>
        {/* Camera preview placeholder */}
        <div className={styles.camPreview}>
          <span className={`${styles.corner} ${styles.tl}`}/>
          <span className={`${styles.corner} ${styles.tr}`}/>
          <span className={`${styles.corner} ${styles.bl}`}/>
          <span className={`${styles.corner} ${styles.br}`}/>

          <div className={styles.camInner}>
            <div className={styles.camIconWrap}>
              <Camera size={44} strokeWidth={1.2} className={styles.camIcon}/>
              <div className={styles.camPulse}/>
            </div>
            <p className={styles.camTitle}>Kamera #{camIndex}</p>
            <p className={styles.camSub}>Tahlil boshlanishi bilan jonli oqim ko'rsatiladi</p>
          </div>

          <div className={styles.liveBadge}>
            <span className="dot dot-red"/>
            LIVE
          </div>
        </div>

        {/* Camera index selector */}
        <Card3D className={styles.settingsCard} intensity={4}>
          <div className={styles.settingsTitle}>
            <Video size={15} strokeWidth={2} style={{color:'var(--cyan)'}}/>
            Kamera indeksini tanlang
          </div>
          <div className={styles.camIndexRow}>
            {[0, 1, 2, 3].map(i => (
              <button key={i}
                className={`btn ${camIndex === i ? 'btn-cyan' : 'btn-ghost'} ${styles.camIndexBtn}`}
                onClick={() => setCamIndex(i)}>
                #{i}
              </button>
            ))}
          </div>
          <p className={styles.settingsNote}>
            <AlertCircle size={12} strokeWidth={2}/>
            Kamera mavjud bo'lmasa keyingi indeksni sinab ko'ring
          </p>
        </Card3D>

        <button className="btn btn-primary btn-lg" onClick={onStart}>
          <PlayCircle size={18} strokeWidth={2}/>
          Kamerani ishga tushirish
        </button>

        {/* Specs */}
        <div className={styles.specGrid}>
          {SPECS.map(({label, val}) => (
            <div key={label} className={styles.specItem}>
              <span className={styles.specLabel}>{label}</span>
              <span className={styles.specVal}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SPECS = [
  { label: 'Protokol',    val: 'OpenCV VideoCapture' },
  { label: 'Kodek',       val: 'Avtomatik' },
  { label: 'Kechikish',   val: '< 200ms' },
  { label: 'Kadr tezligi',val: 'Qurilmaga bog\'liq' },
]
