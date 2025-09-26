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

    <TshirtPlayground/>
    </>
  
)
}



