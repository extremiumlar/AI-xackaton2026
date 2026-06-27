import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { REGIONS_GEO, DISTRICTS_GEO } from '../data/uzbekistanGeo.js'
import styles from './MapDeck.module.css'

/* ── Project lon/lat → local XZ plane ─────────────────────── */
const LON0 = 63.0, LAT0 = 41.8, SCALE = 18
function project([lon, lat]) {
  return [
    (lon - LON0) * SCALE,
    -(lat - LAT0) * SCALE,
  ]
}

/* ── Score → hex color ────────────────────────────────────── */
function scoreHex(s) {
  if (s >= 0.75) return 0xef4444
  if (s >= 0.55) return 0xf97316
  if (s >= 0.38) return 0xeab308
  if (s >= 0.22) return 0x84cc16
  return 0x10b981
}

/* ── Build an extruded mesh from a GeoJSON polygon ring ────── */
function buildMesh(ring, height, color, emissive = 0x000000) {
  const pts = ring.slice(0, -1).map(c => {
    const [x, y] = project(c)
    return new THREE.Vector2(x, y)
  })

  const shape = new THREE.Shape(pts)
  const geo   = new THREE.ExtrudeGeometry(shape, {
    depth: height, bevelEnabled: false,
  })

  const mat = new THREE.MeshPhongMaterial({
    color,
    emissive,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

/* ── Build edge lines ──────────────────────────────────────── */
function buildEdge(ring) {
  const pts = ring.map(c => {
    const [x, y] = project(c)
    return new THREE.Vector3(x, 0.05, y)
  })
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true })
  return new THREE.Line(geo, mat)
}

export default function MapDeck({ regionData }) {
  const mountRef  = useRef(null)
  const stateRef  = useRef({})      // holds THREE objects
  const [hovered, setHovered]   = useState(null)
  const [mousePos,setMousePos]  = useState({ x: 0, y: 0 })
  const [showDist,setShowDist]  = useState(false)

  /* ── District scores ──── */
  const districtScores = useRef({})
  useEffect(() => {
    const out = {}
    DISTRICTS_GEO.features.forEach(f => {
      const base = regionData[f.properties.regionId]?.score ?? 0.3
      const seed = f.properties.id.charCodeAt(f.properties.id.length - 1) / 127
      out[f.properties.id] = Math.max(0, Math.min(1, base + (seed - 0.5) * 0.28))
    })
    districtScores.current = out
  }, [regionData])

  /* ── Init Three.js ──────────────────────────────────────── */
  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    /* Scene */
    const scene  = new THREE.Scene()
    scene.background = new THREE.Color(0x050810)
    scene.fog = new THREE.Fog(0x050810, 60, 160)

    /* Camera */
    const w = el.clientWidth, h = el.clientHeight
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500)
    camera.position.set(0, 45, 30)
    camera.lookAt(0, 0, 0)

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    /* Lights */
    scene.add(new THREE.AmbientLight(0x334466, 2.5))
    const dir = new THREE.DirectionalLight(0xffffff, 1.8)
    dir.position.set(10, 30, 10)
    scene.add(dir)

    /* Grid floor */
    const grid = new THREE.GridHelper(200, 80, 0x0a1628, 0x0a1628)
    grid.position.y = -0.1
    scene.add(grid)

    /* ── Build region meshes ── */
    const regionMeshes   = []
    const districtMeshes = []

    REGIONS_GEO.features.forEach(feat => {
      const id    = feat.properties.id
      const score = regionData[id]?.score ?? 0.1
      const color = scoreHex(score)
      const h     = Math.max(0.3, score * 8)

      const mesh = buildMesh(feat.geometry.coordinates[0], h, color)
      mesh.userData = { type: 'region', id, props: feat.properties, score }
      scene.add(mesh)
      scene.add(buildEdge(feat.geometry.coordinates[0]))
      regionMeshes.push(mesh)
    })

    DISTRICTS_GEO.features.forEach(feat => {
      const id    = feat.properties.id
      const score = districtScores.current[id] ?? 0.3
      const color = scoreHex(score)
      const h     = Math.max(0.15, score * 3.5)

      const mesh = buildMesh(feat.geometry.coordinates[0], h, color)
      mesh.userData = { type: 'district', id, props: feat.properties, score }
      mesh.visible  = false
      scene.add(mesh)
      districtMeshes.push(mesh)
    })

    /* ── Orbit controls (manual) ── */
    let isDragging = false, prevMouse = { x: 0, y: 0 }
    let spherical  = { theta: 0.4, phi: 0.85, radius: 55 }

    function updateCamera() {
      camera.position.set(
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.radius * Math.cos(spherical.phi),
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta),
      )
      camera.lookAt(0, 0, 0)
    }
    updateCamera()

    /* ── Raycaster for hover ── */
    const raycaster = new THREE.Raycaster()
    const mouse2d   = new THREE.Vector2()
    let   animFrame = null

    function onMouseMove(e) {
      const rect = el.getBoundingClientRect()
      mouse2d.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse2d.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })

      if (isDragging) {
        const dx = e.clientX - prevMouse.x
        const dy = e.clientY - prevMouse.y
        spherical.theta -= dx * 0.008
        spherical.phi    = Math.max(0.2, Math.min(1.4, spherical.phi + dy * 0.008))
        prevMouse = { x: e.clientX, y: e.clientY }
        updateCamera()
      }
    }

    function onMouseDown(e) {
      isDragging = true
      prevMouse  = { x: e.clientX, y: e.clientY }
    }
    function onMouseUp()   { isDragging = false }

    function onWheel(e) {
      spherical.radius = Math.max(10, Math.min(120, spherical.radius + e.deltaY * 0.05))
      updateCamera()
    }

    function checkHover() {
      raycaster.setFromCamera(mouse2d, camera)
      const targets = showDist
        ? districtMeshes.filter(m => m.visible)
        : regionMeshes
      const hits = raycaster.intersectObjects(targets)
      if (hits.length) {
        const obj = hits[0].object
        setHovered(obj.userData.props ?? null)
        el.style.cursor = 'pointer'
      } else {
        setHovered(null)
        el.style.cursor = 'grab'
      }
    }

    /* ── Click: toggle region→districts ── */
    function onClick() {
      raycaster.setFromCamera(mouse2d, camera)
      const hits = raycaster.intersectObjects(regionMeshes)
      if (hits.length) {
        const rId = hits[0].object.userData.id
        regionMeshes.forEach(m => m.visible = false)
        districtMeshes.forEach(m => {
          m.visible = m.userData.props?.regionId === rId
        })
        stateRef.current.showDistricts = true
        setShowDist(true)
      }
    }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mouseup',   onMouseUp)
    el.addEventListener('wheel',     onWheel, { passive: true })
    el.addEventListener('click',     onClick)

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    /* ── Animate ── */
    const animate = () => {
      animFrame = requestAnimationFrame(animate)
      checkHover()
      renderer.render(scene, camera)
    }
    animate()

    /* Store refs for external controls */
    stateRef.current = {
      scene, camera, renderer, spherical, updateCamera,
      regionMeshes, districtMeshes, showDistricts: false,
    }

    return () => {
      cancelAnimationFrame(animFrame)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mouseup',   onMouseUp)
      el.removeEventListener('wheel',     onWheel)
      el.removeEventListener('click',     onClick)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [regionData])

  /* ── External: go home ── */
  const flyHome = useCallback(() => {
    const s = stateRef.current
    if (!s.regionMeshes) return
    s.regionMeshes.forEach(m => m.visible = true)
    s.districtMeshes.forEach(m => m.visible = false)
    s.spherical.theta  = 0.4
    s.spherical.phi    = 0.85
    s.spherical.radius = 55
    s.updateCamera()
    s.showDistricts = false
    setShowDist(false)
    setHovered(null)
  }, [])

  /* ── Zoom ── */
  const zoom = useCallback((dir) => {
    const s = stateRef.current
    if (!s.spherical) return
    s.spherical.radius = Math.max(10, Math.min(120, s.spherical.radius - dir * 8))
    s.updateCamera()
  }, [])

  const rData = hovered
    ? regionData[hovered.regionId ?? hovered.id]
    : null

  return (
    <div className={styles.wrap}>
      <div ref={mountRef} className={styles.canvas} />

      {/* Controls */}
      <div className={styles.controls}>
        <button className={`btn btn-ghost ${styles.ctrlBtn}`}
                onClick={flyHome} title="Orqaga">⌂</button>
        <button className={`btn btn-ghost ${styles.ctrlBtn}`}
                onClick={() => zoom(1)}>+</button>
        <button className={`btn btn-ghost ${styles.ctrlBtn}`}
                onClick={() => zoom(-1)}>−</button>
      </div>

      {/* Hint */}
      <div className={styles.zoomHint}>
        {!showDist
          ? <><span className={styles.dot}/>Viloyatni bosing → tumanlar · sichqoncha bilan aylantiring</>
          : <><span className={styles.dot} style={{background:'#f97316'}}/>
              Tumanlar ko'rinishi · ⌂ tugmasi → orqaga</>
        }
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className={styles.tooltip}
             style={{ left: mousePos.x + 16, top: mousePos.y - 70 }}>
          <div className={styles.ttTitle}>
            {hovered.name}
            {hovered.regionId && (
              <span className={styles.ttSub}> — {hovered.regionId.replace(/_/g,' ')}</span>
            )}
          </div>
          <div className={styles.ttRow}>
            <span>Xavf bali</span>
            <span style={{
              color: `#${scoreHex(
                hovered.regionId
                  ? (districtScores.current[hovered.id] ?? 0)
                  : (regionData[hovered.id]?.score ?? 0)
              ).toString(16).padStart(6,'0')}`,
              fontWeight: 700
            }}>
              {((hovered.regionId
                  ? (districtScores.current[hovered.id] ?? 0)
                  : (regionData[hovered.id]?.score ?? 0)) * 100).toFixed(0)}%
            </span>
          </div>
          {rData && <>
            <div className={styles.ttRow}>
              <span>Alertlar</span>
              <span style={{color:'#f97316'}}>{rData.alerts}</span>
            </div>
            <div className={styles.ttRow}>
              <span>Kameralar</span>
              <span style={{color:'#00b4d8'}}>{rData.cameras}</span>
            </div>
          </>}
          {hovered.capital && (
            <div className={styles.ttRow}>
              <span>Markaz</span>
              <span>{hovered.capital}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
