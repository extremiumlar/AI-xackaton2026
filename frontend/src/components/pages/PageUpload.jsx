import { useCallback, useRef, useState } from 'react'
import { Upload, FileVideo, PlayCircle, CheckCircle, X } from 'lucide-react'
import Card3D from '../Card3D.jsx'
import styles from './PageUpload.module.css'

const API = 'http://localhost:8000'

export default function PageUpload({ onStart, setJobId }) {
  const [file,       setFile]       = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [uploaded,   setUploaded]   = useState(false)
  const [drag,       setDrag]       = useState(false)
  const [error,      setError]      = useState(null)
  const inputRef = useRef()

  const handleFile = useCallback(async (f) => {
    if (!f) return
    if (!f.type.startsWith('video/')) { setError('Faqat video fayllar qabul qilinadi'); return }
    setFile(f)
    setError(null)
    setUploaded(false)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', f)
      const res = await fetch(`${API}/api/upload`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Yuklash amalga oshmadi')
      const data = await res.json()
      setJobId(data.job_id)
      setUploaded(true)
    } catch (e) {
      setError(e.message)
      setFile(null)
    } finally {
      setUploading(false)
    }
  }, [setJobId])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const fmt = (b) => b > 1e9 ? `${(b/1e9).toFixed(1)} GB` : `${(b/1e6).toFixed(1)} MB`

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Fayl yuklash</h1>
        <p className={styles.sub}>Video faylni yuklang va shubhali xulq-atvor tahlilini boshlang</p>
      </div>

      <div className={styles.content}>
        {/* Drop zone */}
        <div
          className={`${styles.dropzone} ${drag ? styles.dropDrag : ''} ${uploaded ? styles.dropDone : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => !uploaded && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="video/*" hidden
                 onChange={e => handleFile(e.target.files[0])} />

          {/* 3D corner brackets */}
          <span className={`${styles.corner} ${styles.tl}`}/>
          <span className={`${styles.corner} ${styles.tr}`}/>
          <span className={`${styles.corner} ${styles.bl}`}/>
          <span className={`${styles.corner} ${styles.br}`}/>

          {uploading && (
            <div className={styles.dzInner}>
              <div className={styles.spinner}/>
              <p className={styles.dzTitle}>Yuklanmoqda…</p>
            </div>
          )}

          {!uploading && !file && (
            <div className={styles.dzInner}>
              <div className={styles.dzIconWrap}>
                <Upload size={36} strokeWidth={1.5} className={styles.dzIcon}/>
              </div>
              <p className={styles.dzTitle}>Video faylni shu yerga tashlang</p>
              <p className={styles.dzSub}>yoki bosib fayl tanlang</p>
              <div className={styles.formats}>
                {['MP4','AVI','MOV','MKV','WEBM'].map(f => (
                  <span key={f} className={styles.fmt}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {!uploading && file && !uploaded && (
            <div className={styles.dzInner}>
              <FileVideo size={32} strokeWidth={1.5} style={{color:'var(--cyan)'}}/>
              <p className={styles.dzTitle}>{file.name}</p>
              <p className={styles.dzSub}>{fmt(file.size)}</p>
            </div>
          )}

          {uploaded && (
            <div className={styles.dzInner}>
              <CheckCircle size={40} strokeWidth={1.5} style={{color:'var(--green)'}}/>
              <p className={styles.dzTitle} style={{color:'var(--green)'}}>Yuklandi!</p>
              <p className={styles.dzSub}>{file?.name} · {fmt(file?.size ?? 0)}</p>
              <button className={`btn btn-ghost ${styles.changeBtn}`}
                onClick={e => { e.stopPropagation(); setFile(null); setUploaded(false); setJobId(null) }}>
                <X size={13}/> Boshqa fayl
              </button>
            </div>
          )}
        </div>

        {error && <div className={styles.error}><X size={13}/> {error}</div>}

        {/* Info cards */}
        <div className={styles.infoGrid}>
          {INFO.map(({icon, title, desc}) => (
            <Card3D key={title} className={styles.infoCard} intensity={5}>
              <span className={styles.infoIcon}>{icon}</span>
              <span className={styles.infoTitle}>{title}</span>
              <span className={styles.infoDesc}>{desc}</span>
            </Card3D>
          ))}
        </div>

        <button className="btn btn-primary btn-lg"
                disabled={!uploaded}
                onClick={onStart}>
          <PlayCircle size={18} strokeWidth={2}/>
          Tahlilni boshlash
        </button>
      </div>
    </div>
  )
}

const INFO = [
  { icon: '🎯', title: 'YOLOv8 aniqlash',  desc: 'Har kadrda odamlar real vaqtda aniqlanadi' },
  { icon: '🔗', title: 'ByteTrack kuzatuv', desc: 'Har kishiga noyob ID beriladi va kuzatiladi' },
  { icon: '🦴', title: '17-nuqta poza',     desc: 'Skelet tahlili orqali harakatlar baholanadi' },
  { icon: '🚨', title: 'Avtomatik alert',   desc: 'Shubhali xulq aniqlansa signal beriladi' },
]
