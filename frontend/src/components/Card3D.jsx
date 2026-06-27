import { useRef } from 'react'
import styles from './Card3D.module.css'

export default function Card3D({ children, className = '', intensity = 7 }) {
  const ref = useRef(null)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width  - 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    el.style.transform = `perspective(700px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(4px)`
  }

  const onLeave = () => {
    if (ref.current)
      ref.current.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) translateZ(0)'
  }

  return (
    <div ref={ref} className={`${styles.card} ${className}`}
         onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}
