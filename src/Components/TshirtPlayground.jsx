import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  useGLTF,
  useCursor,
  useTexture,
  Text,
  Decal,
  Environment,
  OrbitControls,
  RenderTexture,
  RandomizedLight,
  PerspectiveCamera,
  AccumulativeShadows
} from '@react-three/drei'
import { TshirtM } from './TshirtM' // your component above

export default function TshirtPlayground() {
  const [color, setColor] = useState('#ffffff')
  const [fillFromAlpha, setFillFromAlpha] = useState(false)
  const [scale, setScale] = useState(1)

  const onScale = (e) => setScale(Number(e.target.value))
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#111' }}>
      <Canvas shadows camera={{ position: [0, 0, 120], fov: 35 }}>
        <ambientLight intensity={0.5} />
        {/* <directionalLight position={[50, 50, 50]} intensity={1.2} castShadow /> */}
        <TshirtM
          decalColor={color}
          fillFromAlpha={fillFromAlpha}
          scaleXMul={scale}
          scaleYMul={scale}
        />
        {/* <spotLight decay={0.2} position={[0, 250, 20]} angle={0.5} penumbra={1} intensity={10}/> */}
    {/* <group position={[0, -0.75, 0]}>
     <AccumulativeShadows frames={0} color="black" opacity={1} scale={12} position={[0, 0.04, 0]}>
        <RandomizedLight amount={8} radius={5} ambient={0.5} position={[5, 6, -10]} bias={0.001} />
      </AccumulativeShadows>
    </group> */}
    <Environment     files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr" background blur={1} />
    <OrbitControls makeDefault />
      </Canvas>

      {/* Controls overlay */}
      <div style={panelStyle}>
        <div style={rowStyle}>
          <label style={labelStyle}>Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: 40, height: 32, border: 'none', background: 'transparent' }}
          />
    
        </div>

        <div style={rowStyle}>
          <label style={labelStyle}>Scale X</label>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.01"
            value={scale}
            onChange={onScale}
                     style={sliderStyle}
          />
          <span style={valueStyle}>{scale.toFixed(2)}×</span>
        </div>

        {/* <div style={rowStyle}>
          <label style={labelStyle}>Scale Y</label>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.01"
            value={scaleY}
            onChange={onScaleY}
                  style={sliderStyle}
          />
          <span style={valueStyle}>{scaleY.toFixed(2)}×</span>
        </div> */}
      </div>
    </div>
  )
}

const panelStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  padding: '12px 14px',
  background: 'rgba(20,20,20,0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#eee',
  minWidth: 280,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
  lineHeight: 1.2,
  zIndex : 100
}

const rowStyle = { display: 'flex', alignItems: 'center', marginBottom: 10 }
const labelStyle = { width: 80, opacity: 0.9 }
const sliderStyle = { flex: 1, margin: '0 8px' }
const valueStyle = { width: 48, textAlign: 'right', opacity: 0.8 }
