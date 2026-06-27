import { useState } from 'react'
import { Cpu, Target, Brain, Scale, Film, ChevronDown } from 'lucide-react'
import styles from './Sidebar.module.css'

function Section({ icon: Icon, title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={styles.section}>
      <button className={styles.sectionHead} onClick={() => setOpen(v => !v)}>
        <span className={styles.sectionIcon}><Icon size={13} strokeWidth={2} /></span>
        <span className={styles.sectionTitle}>{title}</span>
        <ChevronDown size={13} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <div className="field-label">{label}</div>
      {children}
    </div>
  )
}

function SliderField({ label, value, min, max, step = 0.01, fmt, onChange }) {
  return (
    <div className={styles.field}>
      <div className={styles.sliderHead}>
        <span className="field-label">{label}</span>
        <span className={styles.sliderVal}>{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step}
             value={value} onChange={e => onChange(+e.target.value)} />
    </div>
  )
}

export default function Sidebar({ config, onChange, status }) {
  const set = (key) => (val) => onChange(prev => ({ ...prev, [key]: val }))
  const isRunning = status === 'running'

  const wTotal = ((config.w_crouch + config.w_hand + config.w_loiter + config.w_look) * 100).toFixed(0)
  const wColor  = +wTotal === 100 ? '#10b981' : +wTotal > 100 ? '#f43f5e' : '#f59e0b'

  return (
    <aside className={`${styles.sidebar} ${isRunning ? styles.disabled : ''}`}>

      <Section icon={Cpu} title="Model">
        <Field label="Detektor">
          <select className="select" value={config.detector}
                  onChange={e => onChange(p => ({...p, detector: e.target.value}))}>
            <option value="yolov8n.pt">YOLOv8n — Nano</option>
            <option value="yolov8s.pt">YOLOv8s — Small</option>
            <option value="yolov8m.pt">YOLOv8m — Medium</option>
          </select>
        </Field>
        <Field label="Poza modeli">
          <select className="select" value={config.pose}
                  onChange={e => onChange(p => ({...p, pose: e.target.value}))}>
            <option value="yolov8n-pose.pt">Pose-Nano</option>
            <option value="yolov8s-pose.pt">Pose-Small</option>
          </select>
        </Field>
        <Field label="Hisoblash qurilmasi">
          <select className="select" value={config.device}
                  onChange={e => onChange(p => ({...p, device: e.target.value}))}>
            <option value="cpu">CPU</option>
            <option value="cuda">CUDA (GPU)</option>
            <option value="mps">MPS (Apple)</option>
          </select>
        </Field>
      </Section>

      <Section icon={Target} title="Aniqlash">
        <SliderField label="Ishonch chegarasi" value={config.conf}
          min={0.1} max={0.95} step={0.05} fmt={v => `${(v*100).toFixed(0)}%`}
          onChange={set('conf')} />
        <SliderField label="Alert chegarasi" value={config.alert_threshold}
          min={0.1} max={1} step={0.05} fmt={v => `${(v*100).toFixed(0)}%`}
          onChange={set('alert_threshold')} />
        <SliderField label="Davomiylik (kadr)" value={config.sustained_frames}
          min={1} max={60} step={1} fmt={v => `${v} kadr`}
          onChange={set('sustained_frames')} />
      </Section>

      <Section icon={Brain} title="Xulq parametrlari">
        <SliderField label="Cho'qqayish nisbati" value={config.crouch_ratio}
          min={0.3} max={0.9} step={0.05} fmt={v => v.toFixed(2)}
          onChange={set('crouch_ratio')} />
        <SliderField label="Qo'l nisbati" value={config.hand_ratio}
          min={0.5} max={1.2} step={0.05} fmt={v => v.toFixed(2)}
          onChange={set('hand_ratio')} />
        <SliderField label="Kutish muddati" value={config.loiter_sec}
          min={3} max={60} step={1} fmt={v => `${v}s`}
          onChange={set('loiter_sec')} />
        <SliderField label="Kutish radiusi" value={config.loiter_radius}
          min={20} max={300} step={10} fmt={v => `${v}px`}
          onChange={set('loiter_radius')} />
      </Section>

      <Section icon={Scale} title="Shubha vaznlari">
        <div className={styles.weightTotal} style={{ color: wColor }}>
          Jami: {wTotal}%
          {+wTotal !== 100 && <span className={styles.weightWarn}> (100% bo'lsin)</span>}
        </div>
        {[
          ['w_crouch', "Cho'qqayish"],
          ['w_hand',   "Qo'l uzatish"],
          ['w_loiter', "Kutish"],
          ['w_look',   "Atrofga qarash"],
        ].map(([key, lbl]) => (
          <SliderField key={key} label={lbl} value={config[key]}
            min={0} max={1} step={0.05} fmt={v => `${(v*100).toFixed(0)}%`}
            onChange={set(key)} />
        ))}
      </Section>

      <Section icon={Film} title="Video sozlama" defaultOpen={false}>
        <SliderField label="Kenglik" value={config.resize_width}
          min={320} max={1920} step={80} fmt={v => `${v}px`}
          onChange={set('resize_width')} />
        <SliderField label="Kadr o'tkazish" value={config.skip_frames}
          min={0} max={10} step={1} fmt={v => v === 0 ? 'yo\'q' : `${v} ta`}
          onChange={set('skip_frames')} />
        <SliderField label="Maks. kadr" value={config.max_frames}
          min={0} max={3000} step={100} fmt={v => v === 0 ? '∞' : String(v)}
          onChange={set('max_frames')} />
      </Section>
    </aside>
  )
}
