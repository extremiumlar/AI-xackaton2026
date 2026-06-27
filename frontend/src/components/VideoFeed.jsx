import { Upload, Camera, PlayCircle, Film, Square } from 'lucide-react'
import styles from './VideoFeed.module.css'

const API = 'http://localhost:8000'

export default function VideoFeed({
  sourceType, setSourceType,
  jobId, setJobId,
  status, setStatus,
  frame, config,
  onStart, onStop,
  samples,
  demoPath, setDemoPath,
  camIndex, setCamIndex,
}) {
  const isRunning = status === 'running'
  const canStart = (sourceType === 'webcam') ||
                   (sourceType === 'demo' && demoPath) ||
                   (sourceType === 'file' && jobId)

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('uploading')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`${API}/api/upload`, { method: 'POST', body: form })
      const data = await res.json()
      setJobId(data.job_id)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div className={styles.wrap}>
      {/* Source tabs */}
      <div className="tabs">
        <button className={`tab ${sourceType === 'file' ? 'active' : ''}`}
          onClick={() => setSourceType('file')}>
          <Upload size={13} /> Fayl yuklash
        </button>
        <button className={`tab ${sourceType === 'webcam' ? 'active' : ''}`}
          onClick={() => setSourceType('webcam')}>
          <Camera size={13} /> Veb-kamera
        </button>
        <button className={`tab ${sourceType === 'demo' ? 'active' : ''}`}
          onClick={() => setSourceType('demo')}>
          <Film size={13} /> Demo
        </button>
      </div>

      {/* Source controls */}
      <div className={styles.sourceBox}>
        {sourceType === 'file' && (
          <label className={styles.uploadArea}>
            <input type="file" accept=".mp4,.avi,.mov,.mkv"
              onChange={handleFileUpload} hidden disabled={isRunning} />
            <Upload size={28} className={styles.uploadIcon} />
            <span className={styles.uploadTitle}>
              {status === 'uploading' ? 'Yuklanmoqda...'
               : jobId ? '✓ Fayl yuklandi — tayyor'
               : 'Video faylni tanlang'}
            </span>
            <span className={styles.uploadSub}>MP4 · AVI · MOV · MKV</span>
          </label>
        )}

        {sourceType === 'webcam' && (
          <div className={styles.camCard}>
            <Camera size={32} className={styles.camIcon} />
            <div>
              <div className={styles.camTitle}>Veb-kamera</div>
              <div className={styles.camSub}>Ishga tushirilganda avtomatik ulanadi</div>
              <div className={styles.camIndexRow}>
                <span className={styles.rowLabel}>Kamera indeksi:</span>
                <input type="number" className="input" min={0} max={10} value={camIndex}
                  onChange={e => setCamIndex(+e.target.value)}
                  style={{ width: 70 }} disabled={isRunning} />
              </div>
            </div>
          </div>
        )}

        {sourceType === 'demo' && (
          <div className={styles.demoBox}>
            {samples.length === 0
              ? <p className={styles.noDemo}>samples/ papkasida video topilmadi</p>
              : (
                <select className="input" value={demoPath}
                  onChange={e => setDemoPath(e.target.value)} disabled={isRunning}>
                  <option value="">— Tanlang —</option>
                  {samples.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
          </div>
        )}
      </div>

      {/* Run / Stop button */}
      <div className={styles.btnRow}>
        {!isRunning ? (
          <button className="btn btn-green w-full" style={{ padding: '0.75rem', fontSize: '0.95rem', letterSpacing: '0.05em' }}
            onClick={onStart} disabled={!canStart || status === 'uploading'}>
            <PlayCircle size={18} />
            TAHLILNI BOSHLASH
          </button>
        ) : (
          <button className="btn btn-red w-full" style={{ padding: '0.75rem', fontSize: '0.95rem' }}
            onClick={onStop}>
            <Square size={16} />
            TO'XTATISH
          </button>
        )}
      </div>

      {/* Video frame */}
      <div className={styles.videoWrap}>
        {frame ? (
          <>
            <img src={frame} alt="Live feed" className={styles.videoImg} />
            <div className={styles.scanline} />
            <div className={styles.liveTag}>
              <span className="dot-blink red" /> LIVE
            </div>
            <div className={styles.cornerTL} />
            <div className={styles.cornerTR} />
            <div className={styles.cornerBL} />
            <div className={styles.cornerBR} />
          </>
        ) : (
          <div className={styles.idleScreen}>
            <div className={styles.idleGrid} />
            <div className={styles.idleCenter}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" opacity="0.25">
                <rect x="2" y="12" width="38" height="26" rx="4" stroke="#00c8ee" strokeWidth="1.5"/>
                <path d="M40 22l18-10v26l-18-10V22z" stroke="#00c8ee" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <span className={styles.idleText}>Video manbani tanlang va tahlilni boshlang</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
