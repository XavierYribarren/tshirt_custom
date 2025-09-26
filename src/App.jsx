import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
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
import { TshirtM } from './Components/TshirtM'
import TshirtPlayground from './Components/TshirtPlayground'

export default function App (){
  return (
    <>
  {/* <Canvas shadows camera={{ position: [-2.5, 1, 40], fov: 37 }}>
    <color attach="background" args={['#f0f0f0']} />
   <spotLight decay={0} position={[10, 10, 10]} angle={0.15} penumbra={1} />
    <group position={[0, -0.75, 0]}>
     <AccumulativeShadows frames={80} color="black" opacity={1} scale={12} position={[0, 0.04, 0]}>
        <RandomizedLight amount={8} radius={5} ambient={0.5} position={[5, 6, -10]} bias={0.001} />
      </AccumulativeShadows>
    </group>
    <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr" background blur={1} />
    <OrbitControls makeDefault />
  </Canvas> */}
    <TshirtPlayground/>
    </>
  
)
}



function Dodecahedron(props) {
  const meshRef = useRef()
  const texture = useTexture('/react.png')
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  useCursor(hovered)
  useFrame((state, delta) => (meshRef.current.rotation.x = meshRef.current.rotation.y += delta))
  return (
    <group {...props}>
      <mesh
        ref={meshRef}
        scale={clicked ? 2.25 : 1.75}
        onClick={() => click(!clicked)}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}>
        <dodecahedronGeometry args={[0.75]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : 'goldenrod'} />
        <Decal polygonOffsetFactor={-0} position={[0, -0.2, 0.5]} scale={0.75} map={texture} />
      </mesh>
    </group>
  )
}