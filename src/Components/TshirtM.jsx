import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  useGLTF,
  useTexture,
  Decal,
  PivotControls
} from '@react-three/drei'
import * as THREE from 'three'

export function TshirtM(props) {
  const { nodes } = useGLTF('/tshirt_male.glb')

  // ✅ extra props with safe defaults
  const { decalColor = '#ffffff', fillFromAlpha = false, scaleXMul = 1, scaleYMul = 1 } = props

  const [pos, setXYZ] = useState([2.5, 30, 13])
  const [rot, setRot] = useState([0, 0, 0])
  const [baseScl, setBaseScl] = useState([20.3, 20.3, 20.3])
  const [scl, setScl] = useState([20.3, 20.3, 20.3])

  const rafRef = useRef(null) // ⬅ for throttling onDrag with rAF

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
      roughnessMap: fabricRough,
      color: new THREE.Color('#ffffff'),
    })
  }, [fabricAO, fabricNorm, fabricRough])

  // const texture = useTexture('/Kabino_page_fid_lit.png')
  // texture.flipY = false
  // texture.colorSpace = THREE.SRGBColorSpace
  // useEffect(() => {
  //   textures.forEach((tex) => {
  //     if (!tex) return
  //     tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  //     tex.repeat.set(repeatScale, repeatScale)
  //     tex.flipY = false
  //     tex.colorSpace = THREE.SRGBColorSpace
  //     tex.needsUpdate = true
  //   })
  // }, [textures])

  const texture = useTexture('/Kabino_page_fid_litW.png')
  useEffect(() => {
    if (!texture) return
    texture.flipY = true
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  // ⬇️ Recompute final decal scale whenever sliders OR gizmo base scale change
  useEffect(() => {
    setScl([baseScl[0] * scaleXMul, baseScl[1] * scaleYMul, 20.3])
  }, [baseScl, scaleXMul, scaleYMul])

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
              const sclVec = new THREE.Vector3()
              const quaternion = new THREE.Quaternion()
              local.decompose(position, quaternion, sclVec)
              const rotation = new THREE.Euler().setFromQuaternion(quaternion)

              setXYZ([position.x, position.y, position.z+7-scaleYMul])
              setRot([0, 0, rotation.z])

              // ✅ use sclVec from decompose, not "scale"
              setScl([
                20.3 * sclVec.x * scaleXMul,
                20.3 * sclVec.y * scaleYMul,
                20.3 
              ])
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
          <meshStandardMaterial
            transparent
            color={decalColor}
            map={fillFromAlpha ? undefined : texture}
            // alphaMap={texture*10}
            // alphaMapIntensity={105}
            // metalness = {1}
            // roughness={1}
            // envMapIntensity={0}
          />
        </Decal>
      </mesh>

      {/* Other shirt parts */}
      <mesh castShadow receiveShadow geometry={nodes['uploads_files_605564_t+shirts001_2'].geometry} material={fabricMat} />
      <mesh castShadow receiveShadow geometry={nodes['uploads_files_605564_t+shirts001_3'].geometry} material={fabricMat} />
      <mesh castShadow receiveShadow geometry={nodes['uploads_files_605564_t+shirts001_4'].geometry} material={fabricMat} />
      <mesh castShadow receiveShadow geometry={nodes['uploads_files_605564_t+shirts001_5'].geometry} material={fabricMat} />
    </group>
  )
}

useGLTF.preload('/tshirt_male.glb')
