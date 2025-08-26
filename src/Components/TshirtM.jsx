
import React, { useMemo, useRef, useState } from 'react'
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
  AccumulativeShadows, 
  PivotControls
} from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function TshirtM(props) {
  const { nodes, materials } = useGLTF('/tshirt_male.glb')

  const [pos, setXYZ] = useState([2.5, 30, 13])
  const [rot, setRot] = useState([0, 0, 0])
  const [scl, setScl] = useState([20.3, 20.3, 20.3])
  const decalTargetRef = useRef()
const repeatScale = 4
const textures = useTexture([
  '/fabric/Fabric_025_AO.jpg',
  '/fabric/Fabric_025_Height.png',
  '/fabric/Fabric_025_Normal.jpg',
  '/fabric/Fabric_025_Roughness.jpg',
])


const [fabricAO, fabricHeight, fabricNorm, fabricRough] = textures

textures.forEach((tex) => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatScale, repeatScale)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
})
const fabricMat = useMemo(() => {
  return new THREE.MeshStandardMaterial({
    aoMap: fabricAO,
    aoMapIntensity: .52,
    normalMap: fabricNorm,
  
    // displacementMap: fabricHeight, // height map must go to displacementMap
    roughnessMap: fabricRough,
    color: new THREE.Color('#ffffff'),
  })
}, [fabricAO, fabricNorm, fabricHeight, fabricRough])
    const texture = useTexture('/Kabino_page_fid_lit.png')
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_1'].geometry}
        material={fabricMat}
      >
        {/* PivotControls (draggable decal handle) */}
        <group position={[0,0,23]}>
          <PivotControls
  
            scale={10.5}
            activeAxes={[true, true, false]}
            onDrag={(local) => {
              const position = new THREE.Vector3()
              const scale = new THREE.Vector3()
              const quaternion = new THREE.Quaternion()
              local.decompose(position, quaternion, scale)
              const rotation = new THREE.Euler().setFromQuaternion(quaternion)

              setXYZ([position.x, position.y, position.z+7])
              setRot([0, 0, rotation.z])
              setScl([20.3 * scale.x, 20.3 * scale.y, 20.3 * scale.z])
            }}
          />
        </group>

        {/* Decal that tracks state */}
        <Decal
          position={pos}
          rotation={rot}
          scale={scl}
          map={texture}
          polygonOffset
          polygonOffsetFactor={-1}
          depthTest
        >
          <meshStandardMaterial transparent map={texture} alphaMap={texture}  />
        </Decal>
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_2'].geometry}
        // material={nodes['uploads_files_605564_t+shirts001_2'].material}
        material={fabricMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_3'].geometry}
        // material={nodes['uploads_files_605564_t+shirts001_3'].material}
        material={fabricMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_4'].geometry}
        // material={nodes['uploads_files_605564_t+shirts001_4'].material}
        material={fabricMat}
     />
      <mesh
 
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_5'].geometry}
        // material={nodes['uploads_files_605564_t+shirts001_5'].material}
        material={fabricMat}
     >
      
        </mesh> 

    </group>
  )
}

useGLTF.preload('/tshirt_male.glb')
