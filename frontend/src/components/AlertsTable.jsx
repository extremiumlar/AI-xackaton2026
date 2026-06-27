import { AlertTriangle, Download } from 'lucide-react'
import styles from './AlertsTable.module.css'

export default function AlertsTable({ alertLog, outputVideo, status }) {
  if (status !== 'done' && alertLog.length === 0) return null

  function downloadVideo() {
    if (!outputVideo) return
    const name = outputVideo.split('/').pop() || outputVideo.split('\\').pop()
    window.open(`http://localhost:8000/api/download/${name}`, '_blank')
  }

  return (
    <div className={`card ${styles.wrap} slide-up`}>
      <div className={styles.head}>
        <div className="section-label" style={{ margin: 0 }}>
          <AlertTriangle size={12} style={{ color: '#ff4466' }} />
          Aniqlangan ogohlantirishlar
          {alertLog.length > 0 && (
            <span className={styles.count}>{alertLog.length}</span>
          )}
        </div>
        {outputVideo && (
          <button className="btn btn-cyan" onClick={downloadVideo} style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem' }}>
            <Download size={13} /> Video yuklab olish
          </button>
        )}
      </div>

      {alertLog.length === 0 ? (
        <div className={styles.empty}>Ogohlantirish aniqlanmadi</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Track ID</th>
                <th>Vaqt (s)</th>
                <th>Shubha bali</th>
                <th>Belgilar</th>
              </tr>
            </thead>
            <tbody>
              {alertLog.map((row, i) => {
                const score = typeof row.score === 'number' ? row.score.toFixed(3) : row.score
                const ts    = typeof row.timestamp_s === 'number' ? row.timestamp_s.toFixed(2) : row.timestamp_s
                const flags = row.flags ? Object.entries(row.flags)
                  .filter(([, v]) => v)
                  .map(([k]) => k)
                  .join(', ') : '—'
                const high = row.score >= 0.75
                return (
                  <tr key={i} className={high ? styles.highAlert : ''}>
                    <td className={styles.idCell}>#{row.track_id ?? '—'}</td>
                    <td>{ts}</td>
                    <td>
                      <span className={styles.scoreBadge} style={{
                        background: high ? 'rgba(255,68,102,0.15)' : 'rgba(255,153,0,0.12)',
                        color: high ? '#ff4466' : '#ff9900',
                        borderColor: high ? 'rgba(255,68,102,0.3)' : 'rgba(255,153,0,0.25)',
                      }}>
                        {score}
                      </span>
                    </td>
                    <td className={styles.flagCell}>{flags}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
