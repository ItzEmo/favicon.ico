'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/models/welcome.glb'

// Measurements of the source T-pose in its original units (feet at y=0, ~197 tall).
const RIG = { shoulderX: 37, elbowX: 68, armY: 128, armMinY: 104, armMaxY: 152, blend: 6 }

const ARMS_DOWN = -1.32
const INTRO_SECONDS = 5.2
const WAVE_EVERY = 13

type Pose = { right: number; rightElbow: number; left: number; lift: number; spin: number; bow: number }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const window01 = (t: number, start: number, end: number) => ease((t - start) / (end - start))

function waveSegment(t: number, start: number, cycles: number) {
  const raise = window01(t, start, start + 0.55)
  const waveEnd = start + 0.55 + cycles * 0.5
  const lower = window01(t, waveEnd, waveEnd + 0.6)
  const amount = raise * (1 - lower)
  const swing = t > start + 0.4 && t < waveEnd + 0.2 ? Math.sin((t - start) * Math.PI * 4) * 0.38 : 0
  return { amount, swing }
}

function poseAt(t: number, reduced: boolean): Pose {
  if (reduced) return { right: 0.55, rightElbow: 1.35, left: ARMS_DOWN, lift: 0, spin: 0, bow: 0 }

  const enter = window01(t, 0, 1.3)
  const armsDrop = window01(t, 0.5, 1.4)
  const intro = waveSegment(t, 1.4, 4)
  const bow = Math.sin(clamp01((t - 4.1) / 0.9) * Math.PI) * 0.22

  let wave = intro
  if (t > INTRO_SECONDS + 2) {
    const local = (t - INTRO_SECONDS) % WAVE_EVERY
    wave = waveSegment(local, WAVE_EVERY - 3, 3)
  }

  const resting = mix(0, ARMS_DOWN, armsDrop)
  return {
    right: mix(resting, 0.55, wave.amount),
    rightElbow: mix(0, 1.35 + wave.swing, wave.amount),
    left: resting,
    lift: mix(-0.6, 0, enter),
    spin: mix(Math.PI * 0.9, 0, enter),
    bow,
  }
}

const VERTEX_HEADER = /* glsl */ `
uniform vec4 uArm;      // shoulderX, elbowX, armY, blend (geometry space)
uniform vec2 uArmY;     // min / max y of the arm band
uniform vec4 uAngles;   // right shoulder, right elbow, left shoulder, left elbow
vec2 rotateAround(vec2 p, vec2 c, float a) {
  p -= c;
  float s = sin(a); float co = cos(a);
  return c + vec2(co * p.x - s * p.y, s * p.x + co * p.y);
}
vec2 armWeights(vec3 p, out float side) {
  side = p.x >= 0.0 ? 1.0 : -1.0;
  float ax = abs(p.x);
  float band = smoothstep(uArmY.x - uArm.w, uArmY.x + uArm.w, p.y) * (1.0 - smoothstep(uArmY.y - uArm.w, uArmY.y + uArm.w, p.y));
  float shoulderW = smoothstep(uArm.x - uArm.w, uArm.x + uArm.w, ax) * band;
  float elbowW = smoothstep(uArm.y - uArm.w, uArm.y + uArm.w, ax) * band;
  float shoulderA = side > 0.0 ? uAngles.x : -uAngles.z;
  float elbowA = side > 0.0 ? uAngles.y : -uAngles.w;
  return vec2(shoulderA * shoulderW, elbowA * elbowW);
}
`

function makeArmMaterial(map: THREE.Texture | null, toGeometry: THREE.Matrix4, scale: number) {
  const material = new THREE.MeshStandardMaterial({ map, roughness: 0.72, metalness: 0.05 })
  const shoulder = new THREE.Vector3(RIG.shoulderX, RIG.armY, 0).applyMatrix4(toGeometry)
  const elbow = new THREE.Vector3(RIG.elbowX, RIG.armY, 0).applyMatrix4(toGeometry)
  const armMin = new THREE.Vector3(0, RIG.armMinY, 0).applyMatrix4(toGeometry)
  const armMax = new THREE.Vector3(0, RIG.armMaxY, 0).applyMatrix4(toGeometry)

  const uniforms = {
    uArm: { value: new THREE.Vector4(Math.abs(shoulder.x), Math.abs(elbow.x), shoulder.y, RIG.blend / scale) },
    uArmY: { value: new THREE.Vector2(armMin.y, armMax.y) },
    uAngles: { value: new THREE.Vector4() },
  }

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_HEADER}`)
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        float armSide;
        vec2 armA = armWeights(position, armSide);
        objectNormal.xy = rotateAround(objectNormal.xy, vec2(0.0), armA.x + armA.y);`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.xy = rotateAround(transformed.xy, vec2(armSide * uArm.y, uArm.z), armA.y);
        transformed.xy = rotateAround(transformed.xy, vec2(armSide * uArm.x, uArm.z), armA.x);`,
      )
  }

  return { material, angles: uniforms.uAngles.value }
}

function Character({ reduced, onReady }: { reduced: boolean; onReady: () => void }) {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const startedAt = useRef<number | null>(null)

  const { model, angles } = useMemo(() => {
    const root = scene.clone(true)
    root.updateMatrixWorld(true)
    let result: THREE.Vector4 = new THREE.Vector4()
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const toGeometry = child.matrixWorld.clone().invert()
      const scale = child.matrixWorld.getMaxScaleOnAxis()
      const source = child.material as THREE.MeshStandardMaterial
      const { material, angles } = makeArmMaterial(source.map, toGeometry, scale)
      child.material = material
      child.frustumCulled = false
      result = angles
    })
    return { model: root, angles: result }
  }, [scene])

  useEffect(() => {
    onReady()
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [onReady])

  useFrame((state, delta) => {
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime
    const t = state.clock.elapsedTime - startedAt.current
    const pose = poseAt(t, reduced)
    angles.set(pose.right, pose.rightElbow, pose.left, 0)

    const g = group.current
    if (!g) return
    const settled = clamp01((t - 1.3) / 1)
    const breathe = reduced ? 0 : Math.sin(t * 1.6) * 0.012
    const lookYaw = pointer.current.x * 0.35 * settled
    g.position.y = pose.lift + breathe
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pose.spin + lookYaw, pose.spin > 0.01 ? 60 : 4, delta)
    g.rotation.x = pose.bow + pointer.current.y * 0.04 * settled
  })

  return (
    <group ref={group}>
      <primitive object={model} scale={0.01} />
    </group>
  )
}

export default function WelcomeCharacter({ onReady }: { onReady: () => void }) {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.05, 5.1], fov: 30 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ camera }) => camera.lookAt(0, 0.95, 0)}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[1.5, 3, 4]} intensity={1.6} />
      <pointLight position={[-2.4, 1.8, -1.2]} intensity={14} color="#ff3fd8" />
      <pointLight position={[2.4, 1.4, -1]} intensity={12} color="#4f7bff" />
      <Suspense fallback={null}>
        <Character reduced={reduced} onReady={onReady} />
        <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={3} blur={2.4} far={1.2} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
