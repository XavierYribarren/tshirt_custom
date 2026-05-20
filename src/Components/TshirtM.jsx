import React, { useMemo, useRef, useEffect } from 'react';
import { Decal, PivotControls, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function TshirtM({
  decals = [],
  selectedId = null,
  onTransform = () => {},
  showGizmo = true,
  activeSide = 'front',
  color
}) {
  const { nodes } = useGLTF('/tshirt_male.glb');

  const repeatScale = 4;
  const textures = useTexture([
    '/fabric/Fabric_025_AO.jpg',
    '/fabric/Fabric_025_Height.png',
    '/fabric/Fabric_025_Normal.jpg',
    '/fabric/Fabric_025_Roughness.jpg',
  ]);

  const [fabricAO, fabricHeight, fabricNorm, fabricRough] = textures;
  textures.forEach((tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatScale, repeatScale);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  const fabricMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      aoMap: fabricAO,
      aoMapIntensity: 0.52,
      normalMap: fabricNorm,
      roughnessMap: fabricRough,
      color: color,
      side: THREE.DoubleSide,
    });
  }, [fabricAO, fabricNorm, fabricRough]);

  useEffect(() => {
    decals.forEach((d) => {
      const tex = d?.map;
      if (tex && tex.isTexture) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.premultiplyAlpha = true;
        tex.needsUpdate = true;
      }
    });
  }, [decals]);

  const throttled = useRef(0);
  const shirtRef = useRef();
  const backRef = useRef();

  useEffect(() => {
    if (shirtRef.current) shirtRef.current.material.color.set(color);
    if (backRef.current) backRef.current.material.color.set(color);
  }, [color]);

  const frontDecals = decals.filter(d => (d.side ?? 'front') === 'front');
  const backDecals  = decals.filter(d => d.side === 'back');

  const renderDecal = (d, idx, meshRef, side) => {
    const isFront = side === 'front';
    const gizmoZ  = isFront ? 15 : -15;
    const zOffset = isFront ? (7 + 0.05) : -(7 + 0.05);

    return (
      <group key={d.id}>
        {selectedId === d.id && showGizmo && activeSide === side && (
          <group position={[0, 0, gizmoZ]}>
            <PivotControls
              scale={10.5}
              activeAxes={[true, true, false]}
              onDrag={(local) => {
                const now = performance.now();
                if (now - throttled.current < 16) return;
                throttled.current = now;

                const position   = new THREE.Vector3();
                const sclVec     = new THREE.Vector3();
                const quaternion = new THREE.Quaternion();
                local.decompose(position, quaternion, sclVec);
                const rotation = new THREE.Euler().setFromQuaternion(quaternion);

                onTransform(d.id, {
                  pos: [position.x, position.y, position.z + zOffset],
                  rot: [0, 0, rotation.z],
                  scl: [20.3 * sclVec.x, 20.3 * sclVec.y, 20.3],
                });
              }}
            />
          </group>
        )}

        <Decal
          mesh={meshRef}
          position={d.pos}
          rotation={d.rot}
          scale={d.scl}
          renderOrder={10 + idx}
        >
          <meshStandardMaterial
            transparent
            depthWrite={false}
            alphaTest={0.05}
            polygonOffset
            polygonOffsetFactor={-10}
            polygonOffsetUnits={-10}
            color={d.color}
            opacity={d.opacity}
            map={d.fillFromAlpha ? undefined : d.map}
          />
        </Decal>
      </group>
    );
  };

  return (
    <group dispose={null}>
      <mesh
        ref={shirtRef}
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_1'].geometry}
        material={fabricMat}
      >
        {frontDecals.map((d, idx) => renderDecal(d, idx, shirtRef, 'front'))}
      </mesh>

      <mesh
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_2'].geometry}
        material={fabricMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_3'].geometry}
        material={fabricMat}
      />
      <mesh
        ref={backRef}
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_4'].geometry}
        material={fabricMat}
      >
        {backDecals.map((d, idx) => renderDecal(d, idx, backRef, 'back'))}
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['uploads_files_605564_t+shirts001_5'].geometry}
        material={fabricMat}
      />
    </group>
  );
}

useGLTF.preload('/tshirt_male.glb');
