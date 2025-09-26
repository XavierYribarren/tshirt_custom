import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { TshirtM } from './TshirtM' // multi-decal version (mesh={shirtRef}, alphaTest, etc.)

export default function TshirtPlayground() {
  // Decals array + selection
  const [decals, setDecals] = useState([]) // [{id,name,color,opacity,fillFromAlpha,map,pos,rot,scl,baseScl,uiScale,aspect}]
  const [selectedId, setSelectedId] = useState(null)
  const fileAddRef = useRef(null)
  const fileReplaceRef = useRef(null)

  // Scene/UI bits
  const [envBlur, setEnvBlur] = useState(1)
  const [showGizmo, setShowGizmo] = useState(true)
  const [keepAspect, setKeepAspect] = useState(true) // 👈 NEW

  // -------- helpers --------
  const createTextureFromFile = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const tex = new THREE.Texture(img)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.flipY = true
        tex.generateMipmaps = false
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.premultiplyAlpha = true
        tex.needsUpdate = true
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        URL.revokeObjectURL(url)
        resolve({ tex, w, h }) // 👈 return dimensions
      }
      img.onerror = reject
      img.src = url
    })
  }, [])

  const baseDecal = useCallback((name, map, imgW = 1024, imgH = 1024) => {
    const aspect = imgW && imgH ? imgW / imgH : 1
    const baseH = 20.3
    const baseW = baseH * aspect
    const baseScl = [baseW, baseH, 20.3]
    return {
      id: crypto.randomUUID(),
      name,
      color: '#ffffff',
      opacity: 1,
      fillFromAlpha: false,
      map,
      pos: [2.5, 30, 13 + 0.05], // tiny normal offset helps reduce acne
      rot: [0, 0, 0],
      baseScl,
      uiScale: 1,
      scl: [...baseScl], // effective scale = baseScl * uiScale
      aspect,            // 👈 keep the native aspect on the decal
    }
  }, [])

  const addFromFile = useCallback(async (file) => {
    if (!file) return
    const { tex, w, h } = await createTextureFromFile(file)
    const d = baseDecal(file.name.replace(/\.[^.]+$/, ''), tex, w, h)
    setDecals((prev) => [...prev, d])
    setSelectedId(d.id)
  }, [baseDecal, createTextureFromFile])

  const replaceSelectedFromFile = useCallback(async (file) => {
    if (!file || !selectedId) return
    const { tex, w, h } = await createTextureFromFile(file)
    const newAspect = w && h ? w / h : 1
    setDecals((prev) => prev.map(d => {
      if (d.id !== selectedId) return d
      // keep height, adjust width to new aspect
      const base = d.baseScl ?? d.scl ?? [20.3, 20.3, 20.3]
      const baseH = base[1]
      const baseW = baseH * newAspect
      const ui = d.uiScale ?? 1
      return {
        ...d,
        name: file.name.replace(/\.[^.]+$/, ''),
        map: tex,
        aspect: newAspect,
        baseScl: [baseW, baseH, base[2]],
        scl: [baseW * ui, baseH * ui, base[2]],
      }
    }))
  }, [selectedId, createTextureFromFile])

  const updateDecal = useCallback((id, patch) => {
    setDecals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }, [])

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    setDecals((prev) => {
      const idx = prev.findIndex(d => d.id === selectedId)
      const next = prev.filter((d) => d.id !== selectedId)
      if (next.length) {
        const newIdx = Math.min(idx, next.length - 1)
        setSelectedId(next[newIdx].id)
      } else {
        setSelectedId(null)
      }
      return next
    })
  }, [selectedId])

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return
    setDecals((prev) => {
      const src = prev.find(d => d.id === selectedId)
      if (!src) return prev
      const copyBase = src.baseScl ?? src.scl ?? [20.3, 20.3, 20.3]
      const copy = {
        ...src,
        id: crypto.randomUUID(),
        name: src.name + ' copy',
        pos: [src.pos[0] + 2, src.pos[1], src.pos[2]],
        baseScl: [...copyBase],
        uiScale: src.uiScale ?? 1,
        scl: [copyBase[0]*(src.uiScale??1), copyBase[1]*(src.uiScale??1), copyBase[2]],
      }
      setSelectedId(copy.id)
      return [...prev, copy]
    })
  }, [selectedId])

  // Move up/down = changes stacking order (renderOrder is 10 + index)
  const moveSelected = useCallback((dir) => {
    if (!selectedId) return
    setDecals((prev) => {
      const idx = prev.findIndex(d => d.id === selectedId)
      if (idx < 0) return prev
      const j = dir === 'up' ? idx - 1 : idx + 1
      if (j < 0 || j >= prev.length) return prev
      const next = prev.slice()
      const [item] = next.splice(idx, 1)
      next.splice(j, 0, item)
      return next
    })
  }, [selectedId])

  // Called by TshirtM PivotControls
  // If keepAspect, we force X = Y * aspect on the base scale coming from the gizmo
  const onTransform = useCallback((id, patch) => {
    setDecals((prev) => prev.map(d => {
      if (d.id !== id) return d
      const aspect = d.aspect ?? 1
      let baseScl = patch.scl ? [...patch.scl] : (d.baseScl ?? d.scl)
      if (baseScl && keepAspect) {
        // take Y as the driver, force X by aspect
        baseScl[0] = baseScl[1] * aspect
      }
      const uiScale = d.uiScale ?? 1
      const scl = baseScl
        ? [baseScl[0]*uiScale, baseScl[1]*uiScale, baseScl[2]]
        : d.scl
      return { ...d, ...patch, baseScl, scl }
    }))
  }, [keepAspect])

  // Selection
  const sel = useMemo(() => decals.find(d => d.id === selectedId) || null, [decals, selectedId])

  // UI scale handler for the selected decal (uniform)
  const setSelectedScale = useCallback((val) => {
    if (!sel) return
    const newScale = parseFloat(val)
    const base = sel.baseScl ?? sel.scl ?? [20.3, 20.3, 20.3]
    updateDecal(sel.id, {
      uiScale: newScale,
      scl: [base[0]*newScale, base[1]*newScale, base[2]],
    })
  }, [sel, updateDecal])

  const resetSelectedScale = useCallback(() => {
    if (!sel) return
    const base = sel.baseScl ?? sel.scl ?? [20.3, 20.3, 20.3]
    updateDecal(sel.id, { uiScale: 1, scl: [...base] })
  }, [sel, updateDecal])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Canvas shadows camera={{ position: [38.33, 18.25, 155.75], fov: 35 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[0, 5, -4]} intensity={2.5} castShadows/>
        <TshirtM
          decals={decals}
          selectedId={selectedId}
          onTransform={onTransform}
          showGizmo={showGizmo}
        />
        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr" background backgroundIntensity={.025} blur={envBlur} environmentIntensity={.5}/>
        <OrbitControls makeDefault 
          makeDefault
            // enablePan={false}
             target={[-24.90, 18.25, 5.24]}
            maxPolarAngle={Math.PI * 0.5}
            maxZoom={10}
            dollyOut={10}
            dollyIn={5}
            // maxDistance={25}
            // minDistance={8}
        />
          <ContactShadows
        // depthWrite={false}
        position={[0, -10.95, 0]}
        opacity={0.85}
        scale={60}
        blur={5.7}
        far={30}
        frames={100}
        resolution={1024}
      />
      </Canvas>

      {/* Controls overlay */}
      <div style={panelStyle}>
        <div style={row}>
          <button style={btn} onClick={() => fileAddRef.current?.click()}>+ Add image…</button>
          <input ref={fileAddRef} type="file" accept="image/*" style={{ display: 'none' }}
                 onChange={(e) => addFromFile(e.target.files?.[0])} />
          <button style={btn} onClick={() => duplicateSelected()} disabled={!sel}>Duplicate</button>
          <button style={btn} onClick={() => moveSelected('up')} disabled={!sel}>Move up</button>
          <button style={btn} onClick={() => moveSelected('down')} disabled={!sel}>Move down</button>
          <button style={btnDanger} onClick={() => deleteSelected()} disabled={!sel}>Delete</button>

          <button style={{ ...btn, marginLeft: 'auto' }} onClick={() => setShowGizmo(s => !s)}>
            {showGizmo ? 'Hide gizmo' : 'Show gizmo'}
          </button>
        </div>

        {/* Aspect & env */}
        {/* <div style={row}>
          <label style={label}>Keep aspect</label>
          <input type="checkbox" checked={keepAspect} onChange={(e)=>setKeepAspect(e.target.checked)} />
          <label style={{ ...label, width: 80, marginLeft: 12 }}>Env blur</label>
          <input type="range" min={0} max={8} step={0.1} value={envBlur}
                 onChange={(e) => setEnvBlur(parseFloat(e.target.value))} style={slider} />
          <span style={value}>{envBlur.toFixed(1)}</span>
        </div> */}

        {/* Decal list */}
        <div style={{ marginBottom: 10, maxHeight: 180, overflow: 'auto', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8 }}>
          {decals.length === 0 ? (
            <div style={{ padding: 8, opacity: 0.7 }}>Add an image to place a decal.</div>
          ) : (
            decals.map((d) => (
              <div key={d.id}
                   onClick={() => setSelectedId(d.id)}
                   style={{
                     display: 'flex', alignItems: 'center', padding: 6, gap: 8,
                     background: d.id === selectedId ? '#1f2937' : 'transparent',
                     cursor: 'pointer'
                   }}>
                <div style={{ width: 12, height: 12, background: d.color, borderRadius: 2, border: '1px solid #444' }} />
                <div style={{ flex: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{d.name}</div>
                <small style={{ opacity: 0.6 }}>{d.opacity.toFixed(2)}</small>
              </div>
            ))
          )}
        </div>

        {/* Selection controls */}
        {!sel ? (
          <div style={{ opacity: 0.7 }}>Select a decal to tweak its properties.</div>
        ) : (
          <>
            <div style={row}>
              <label style={label}>Name</label>
              <input style={textInput} value={sel.name}
                     onChange={(e) => updateDecal(sel.id, { name: e.target.value })} />
            </div>

            <div style={row}>
              <label style={label}>Color</label>
              <input type="color" value={sel.color}
                     onChange={(e) => updateDecal(sel.id, { color: e.target.value })} />
              <label style={{ marginLeft: 12 }}>Opacity</label>
              <input type="range" min={0} max={1} step={0.01} value={sel.opacity}
                     onChange={(e) => updateDecal(sel.id, { opacity: parseFloat(e.target.value) })} style={slider} />
              <span style={value}>{sel.opacity.toFixed(2)}</span>
            </div>

            <div style={row}>
              <label style={label}>Fill α</label>
              <input type="checkbox" checked={sel.fillFromAlpha}
                     onChange={(e) => updateDecal(sel.id, { fillFromAlpha: e.target.checked })} />
              <span style={{ opacity: 0.65, marginLeft: 6 }}>Ignore texture, use solid color</span>
            </div>

            {/* Per-decal SCALE (uniform) */}
            <div style={row}>
              <label style={label}>Scale</label>
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.01}
                value={sel.uiScale ?? 1}
                onChange={(e) => setSelectedScale(e.target.value)}
                style={slider}
              />
              <span style={value}>{(sel.uiScale ?? 1).toFixed(2)}×</span>
              <button style={{ ...btn, padding: '6px 10px', marginLeft: 6 }} onClick={resetSelectedScale}>Reset</button>
            </div>

            {/* Replace image */}
            <div style={row}>
              <label style={label}>Replace</label>
              <input ref={fileReplaceRef} type="file" accept="image/*"
                     onChange={(e) => replaceSelectedFromFile(e.target.files?.[0])} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------- UI styles ----------
const panelStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  padding: '12px 14px',
  background: 'rgba(20,20,20,0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#eee',
  minWidth: 380,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
  lineHeight: 1.2,
  zIndex: 100,
  maxHeight: '90vh',
  overflow: 'auto',
}
const row = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }
const label = { width: 90, opacity: 0.9 }
const slider = { flex: 1 }
const value = { width: 42, textAlign: 'right', opacity: 0.8 }
const btn = { background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }
const btnDanger = { ...btn, background: '#7f1d1d', borderColor: '#991b1b' }
const textInput = { flex: 1, background: '#0b1220', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 8, padding: '6px 8px' }
