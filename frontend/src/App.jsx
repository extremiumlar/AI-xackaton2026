import { useCallback, useEffect, useRef, useState } from 'react'
import Topbar       from './components/Topbar.jsx'
import Sidebar      from './components/Sidebar.jsx'
import PageUpload   from './components/pages/PageUpload.jsx'
import PageWebcam   from './components/pages/PageWebcam.jsx'
import PageDemo     from './components/pages/PageDemo.jsx'
import PageLive     from './components/pages/PageLive.jsx'
import PageResults  from './components/pages/PageResults.jsx'
import PageMap      from './components/pages/PageMap.jsx'

const WS = 'ws://localhost:8000'
const API = 'http://localhost:8000'

const DEFAULT_CONFIG = {
  detector:         'yolov8n.pt',
  pose:             'yolov8n-pose.pt',
  device:           'cpu',
  conf:             0.40,
  alert_threshold:  0.55,
  sustained_frames: 10,
  crouch_ratio:     0.65,
  hand_ratio:       0.85,
  loiter_sec:       15,
  loiter_radius:    80,
  w_crouch:         0.30,
  w_hand:           0.40,
  w_loiter:         0.20,
  w_look:           0.10,
  resize_width:     960,
  skip_frames:      0,
  max_frames:       0,
}

export default function App() {
  // ── Page routing ───────────────────────────────────────────────────
  const [page,       setPage]       = useState('upload')  // upload | webcam | demo | live | results

  // ── Source config ──────────────────────────────────────────────────
  const [jobId,      setJobId]      = useState(null)
  const [camIndex,   setCamIndex]   = useState(0)
  const [demoPath,   setDemoPath]   = useState('')
  const [samples,    setSamples]    = useState([])

  // ── Pipeline config ────────────────────────────────────────────────
  const [config,     setConfig]     = useState(DEFAULT_CONFIG)

  // ── Pipeline state ─────────────────────────────────────────────────
  const [status,     setStatus]     = useState('idle')    // idle | running | done | error
  const [frame,      setFrame]      = useState(null)
  const [metrics,    setMetrics]    = useState({ frames: 0, tracks: 0, alerts: 0, fps: 0 })
  const [alertLog,   setAlertLog]   = useState([])
  const [liveAlerts, setLiveAlerts] = useState([])
  const [outputVideo,setOutputVideo]= useState(null)
  const [error,      setError]      = useState(null)

  const wsRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/api/samples`)
      .then(r => r.json())
      .then(d => setSamples(d.samples || []))
      .catch(() => {})
  }, [])

  const sourceType = page === 'webcam' ? 'webcam'
                   : page === 'demo'   ? 'demo'
                   : 'file'

  const startPipeline = useCallback(() => {
    const wsJobId = jobId || `live_${Date.now()}`

    setStatus('running')
    setFrame(null)
    setAlertLog([])
    setLiveAlerts([])
    setOutputVideo(null)
    setError(null)
    setMetrics({ frames: 0, tracks: 0, alerts: 0, fps: 0 })
    setPage('live')

    const ws = new WebSocket(`${WS}/ws/${wsJobId}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        ...config,
        source_type: sourceType,
        cam_index:   camIndex,
        demo_path:   demoPath,
      }))
    }

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      if (msg.type === 'frame') {
        setFrame(`data:image/jpeg;base64,${msg.frame}`)
        setMetrics({ frames: msg.idx + 1, tracks: msg.tracks, alerts: msg.alerts, fps: msg.fps })
        setLiveAlerts(msg.live || [])
      } else if (msg.type === 'done') {
        setStatus('done')
        setAlertLog(msg.alert_log || [])
        setOutputVideo(msg.output_video || null)
        setMetrics(p => ({ ...p, frames: msg.frames, alerts: msg.alerts_total }))
        setPage('results')
        wsRef.current = null
      } else if (msg.type === 'error') {
        setStatus('error')
        setError(msg.message)
        setPage('upload')
        wsRef.current = null
      }
    }

    ws.onerror = () => {
      setStatus('error')
      setError('WebSocket ulanishida xatolik. Backend ishlaayotganini tekshiring.')
      setPage('upload')
      wsRef.current = null
    }

    ws.onclose = (evt) => {
      if (evt.code !== 1000 && wsRef.current) {
        setStatus('idle')
        wsRef.current = null
      }
    }
  }, [config, sourceType, jobId, camIndex, demoPath])

  const stopPipeline = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    setStatus('idle')
    setPage('upload')
  }, [])

  const resetAll = useCallback(() => {
    setStatus('idle')
    setFrame(null)
    setAlertLog([])
    setOutputVideo(null)
    setError(null)
    setMetrics({ frames: 0, tracks: 0, alerts: 0, fps: 0 })
    setJobId(null)
    setPage('upload')
  }, [])

  useEffect(() => () => wsRef.current?.close(), [])

  // ── Current page component ─────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case 'upload':
        return <PageUpload onStart={startPipeline} setJobId={setJobId}
                           error={error} />
      case 'webcam':
        return <PageWebcam camIndex={camIndex} setCamIndex={setCamIndex}
                           onStart={startPipeline} />
      case 'demo':
        return <PageDemo samples={samples} demoPath={demoPath}
                         setDemoPath={setDemoPath} onStart={startPipeline} />
      case 'live':
        return <PageLive frame={frame} metrics={metrics} liveAlerts={liveAlerts} onStop={stopPipeline} />
      case 'results':
        return <PageResults metrics={metrics} alertLog={alertLog}
                            outputVideo={outputVideo} onReset={resetAll} />
      case 'map':
        return <PageMap />
      default:
        return null
    }
  }

  const isRunning = status === 'running'

  return (
    <>
      {/* 3D grid floor background */}
      <div className="bg-floor"/>

      <div className="app-shell">
        <div className="app-topbar">
          <Topbar page={page} setPage={setPage}
                  status={status} metrics={metrics} />
        </div>

        {page !== 'live' && page !== 'map' && (
          <div className="app-sidebar">
            <Sidebar config={config} onChange={setConfig} status={status}/>
          </div>
        )}

        <div className="app-main"
             style={(page === 'live' || page === 'map') ? {gridColumn:'1/-1'} : {}}>
          {renderPage()}
        </div>
      </div>
    </>
  )
}
