'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/models/welcome.glb'

// Measurements of the source T-pose in its original units (feet at y=0, ~197 tall).
const RIG = { shoulderX: 37, elbowX: 68, armY: 128, armMinY: 104, armMaxY: 152, blend: 6 }

// Relaxed stance from the reference: upper arms angled slightly off the body, forearms hanging loose.
const REST_SHOULDER = -1.2
const REST_ELBOW = -0.12
const WAVE_SHOULDER = 0.5
const WAVE_ELBOW = 1.3
const WAVE_HZ = 1.5
const INTRO_SECONDS = 5.6
const WAVE_EVERY = 13

type Pose = {
  right: number
  rightElbow: number
  left: number
  leftElbow: number
  lift: number
  spin: number
  bow: number
  lean: number
  sway: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => {
  const x = clamp01(t)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const window01 = (t: number, start: number, end: number) => smooth((t - start) / (end - start))

function waveSegment(t: number, start: number, cycles: number) {
  const raise = window01(t, start, start + 0.7)
  const waveEnd = start + 0.6 + cycles / WAVE_HZ
  const lower = window01(t, waveEnd, waveEnd + 0.9)
  const amount = raise * (1 - lower)
  const swingEnvelope = window01(t, start + 0.35, start + 0.9) * (1 - window01(t, waveEnd - 0.3, waveEnd + 0.2))
  const phase = (t - start - 0.35) * Math.PI * 2 * WAVE_HZ
  return { amount, swing: Math.sin(phase) * 0.36 * swingEnvelope, bounce: Math.abs(Math.sin(phase)) * swingEnvelope }
}

function poseAt(t: number, reduced: boolean): Pose {
  if (reduced) {
    return { right: REST_SHOULDER, rightElbow: REST_ELBOW, left: REST_SHOULDER, leftElbow: REST_ELBOW, lift: 0, spin: 0, bow: 0.03, lean: 0, sway: 0 }
  }

  const enter = window01(t, 0, 1.6)
  const armsDrop = window01(t, 0.3, 1.7)

  let wave = waveSegment(t, 1.6, 4)
  let nodAt = 1.6 + 0.6 + 4 / WAVE_HZ - 0.2
  if (t > INTRO_SECONDS + 2) {
    const local = (t - INTRO_SECONDS) % WAVE_EVERY
    wave = waveSegment(local, WAVE_EVERY - 3.5, 3)
    nodAt = t - local + WAVE_EVERY - 3.5 + 0.6 + 3 / WAVE_HZ - 0.2
  }
  const nod = Math.sin(clamp01((t - nodAt) / 1.1) * Math.PI) * 0.16

  const idle = armsDrop * (1 - wave.amount * 0.7)
  const breath = Math.sin(t * 1.45)
  const restRight = REST_SHOULDER + (breath * 0.02 + Math.sin(t * 0.8) * 0.03) * idle
  const restLeft = REST_SHOULDER + (breath * 0.02 + Math.sin(t * 0.8 + 1.9) * 0.03) * armsDrop
  const restElbowR = REST_ELBOW + Math.sin(t * 0.8 - 0.6) * 0.05 * idle
  const restElbowL = REST_ELBOW + Math.sin(t * 0.8 + 1.3) * 0.05 * armsDrop

  return {
    right: mix(mix(0, restRight, armsDrop), WAVE_SHOULDER, wave.amount),
    rightElbow: mix(mix(0, restElbowR, armsDrop), WAVE_ELBOW + wave.swing, wave.amount),
    left: mix(0, restLeft, armsDrop) + wave.amount * 0.06,
    leftElbow: mix(0, restElbowL, armsDrop),
    lift: mix(-0.6, 0, enter) + wave.bounce * 0.01 + breath * 0.008,
    spin: mix(Math.PI * 0.9, 0, enter),
    bow: 0.03 + nod,
    lean: -0.04 * wave.amount,
    sway: Math.sin(t * 0.55) * 0.02 * armsDrop,
  }
}

type Spring = { x: number; v: number }
const spring = (x = 0): Spring => ({ x, v: 0 })
function stepSpring(s: Spring, target: number, stiffness: number, dampingRatio: number, dt: number) {
  const damping = 2 * dampingRatio * Math.sqrt(stiffness)
  s.v += (stiffness * (target - s.x) - damping * s.v) * dt
  s.x += s.v * dt
  return s.x
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

  const springs = useRef<Record<keyof Pose | 'yaw' | 'pitch', Spring> | null>(null)

  useFrame((state, delta) => {
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime
    const t = state.clock.elapsedTime - startedAt.current
    const pose = poseAt(t, reduced)
    const dt = Math.min(delta, 1 / 30)

    if (!springs.current) {
      springs.current = {
        right: spring(pose.right), rightElbow: spring(pose.rightElbow), left: spring(pose.left), leftElbow: spring(pose.leftElbow),
        lift: spring(pose.lift), spin: spring(pose.spin), bow: spring(pose.bow), lean: spring(), sway: spring(),
        yaw: spring(pose.spin), pitch: spring(),
      }
    }
    const s = springs.current

    // Shoulders lead, elbows trail slightly behind for follow-through.
    const right = stepSpring(s.right, pose.right, 70, 0.72, dt)
    const rightElbow = stepSpring(s.rightElbow, pose.rightElbow, 150, 0.6, dt)
    const left = stepSpring(s.left, pose.left, 60, 0.75, dt)
    const leftElbow = stepSpring(s.leftElbow, pose.leftElbow, 90, 0.65, dt)
    angles.set(right, rightElbow, left, leftElbow)

    const g = group.current
    if (!g) return
    const settled = clamp01((t - 1.4) / 1.2)
    const yaw = stepSpring(s.yaw, pose.spin + pointer.current.x * 0.32 * settled, 28, 0.82, dt)
    const pitch = stepSpring(s.pitch, pointer.current.y * 0.04 * settled, 20, 0.9, dt)
    g.position.y = stepSpring(s.lift, pose.lift, 55, 0.7, dt)
    g.position.x = stepSpring(s.sway, pose.sway, 30, 0.9, dt) * 0.6
    g.rotation.y = yaw
    g.rotation.x = stepSpring(s.bow, pose.bow, 45, 0.7, dt) + pitch
    g.rotation.z = stepSpring(s.lean, pose.lean, 35, 0.75, dt) - s.sway.x * 0.8
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
