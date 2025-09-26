import React, { useMemo, useRef, useEffect } from "react";
import { Decal, PivotControls, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * TshirtM — renders the shirt and a list of decals.
 * Props:
 *  - decals: Array<{ id, name, color, opacity, fillFromAlpha, map, pos, rot, scl }>
 *  - selectedId: string | null
 *  - onTransform: (id, patch) => void  // called during PivotControls drag for the selected decal
 */
export function TshirtM({ decals = [], selectedId = null, onTransform = () => {}, showGizmo = true }) {
  const { nodes } = useGLTF("/tshirt_male.glb");

  // Fabric material (shared)
  const repeatScale = 4;
  const textures = useTexture([
    "/fabric/Fabric_025_AO.jpg",
    "/fabric/Fabric_025_Height.png",
    "/fabric/Fabric_025_Normal.jpg",
    "/fabric/Fabric_025_Roughness.jpg"
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
      color: new THREE.Color("#ffffff"),
      side: THREE.DoubleSide
    });
  }, [fabricAO, fabricNorm, fabricRough]);

  // 🔧 Sanitize decal textures (uploads/patterns) to avoid PNG edge fringes
  useEffect(() => {
    decals.forEach((d) => {
      const tex = d?.map;
      if (tex && tex.isTexture) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;       // stop mipmap bleed on alpha edges
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.premultiplyAlpha = true;       // better antialiased PNG edges
        // (FlipY depends on your pipeline; leave as-is to avoid surprises)
        tex.needsUpdate = true;
      }
    });
  }, [decals]);

  const throttled = useRef(0);
  const shirtRef = useRef();

  return (
    <group dispose={null}>
      <mesh
        ref={shirtRef}
        castShadow
        receiveShadow
        geometry={nodes["uploads_files_605564_t+shirts001_1"].geometry}
        material={fabricMat}
      >
        {/* For each decal: render pivot (active only for selected), then Decal */}
        {decals.map((d, idx) => (
          <group key={d.id}>
            {selectedId === d.id && showGizmo &&(
              <group position={[0, 0, 15]}>
                <PivotControls
                  scale={10.5}
                  activeAxes={[true, true, false]}
                  onDrag={(local) => {
                    const now = performance.now();
                    if (now - throttled.current < 16) return; // ~60fps throttle
                    throttled.current = now;

                    const position = new THREE.Vector3();
                    const sclVec = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    local.decompose(position, quaternion, sclVec);
                    const rotation = new THREE.Euler().setFromQuaternion(quaternion);

                    onTransform(d.id, {
                      // tiny +Z bias helps separate it from the shirt to reduce acne
                      pos: [position.x, position.y, position.z + 7 + 0.05],
                      rot: [0, 0, rotation.z],
                      scl: [20.3 * sclVec.x, 20.3 * sclVec.y, 20.3]
                    });
                  }}
                />
              </group>
            )}

            <Decal
              mesh={shirtRef}
              position={d.pos}
              rotation={d.rot}
              scale={d.scl}
              renderOrder={10 + idx}   // draw after the shirt; stable stacking
            >
              <meshStandardMaterial
                transparent
                depthWrite={false}       // don't dirty depth; avoids z-fighting at edges
                alphaTest={0.05}         // drop near-zero alpha fringe (tune 0.03–0.12)
                polygonOffset             // bias toward camera to reduce coplanar acne
                polygonOffsetFactor={-10}
                polygonOffsetUnits={-10}
                color={d.color}
                opacity={d.opacity}
                map={d.fillFromAlpha ? undefined : d.map}
              />
            </Decal>
          </group>
        ))}
      </mesh>

      {/* Other shirt parts */}
      <mesh castShadow receiveShadow geometry={nodes["uploads_files_605564_t+shirts001_2"].geometry} material={fabricMat} />
      <mesh castShadow receiveShadow geometry={nodes["uploads_files_605564_t+shirts001_3"].geometry} material={fabricMat} />
      <mesh castShadow receiveShadow geometry={nodes["uploads_files_605564_t+shirts001_4"].geometry} material={fabricMat} />
      <mesh castShadow receiveShadow geometry={nodes["uploads_files_605564_t+shirts001_5"].geometry} material={fabricMat} />
    </group>
  );
}

useGLTF.preload("/tshirt_male.glb");
