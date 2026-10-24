'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'

const MODEL_URL = '/models/welcome.glb'

type Pose = { lift: number; spin: number; bow: number; sway: number; breath: number }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => {
  const x = clamp01(t)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t

function poseAt(t: number, reduced: boolean, animated: boolean): Pose {
  if (reduced) return { lift: 0, spin: 0, bow: 0.03, sway: 0, breath: 0 }

  const enter = smooth(t / 1.6)
  const settled = smooth((t - 1.2) / 1.4)
  const nod = animated ? 0 : Math.sin(clamp01((t - 1.7) / 1.1) * Math.PI) * 0.12
  const idle = animated ? 0 : settled

  return {
    lift: mix(-0.6, 0, enter),
    spin: mix(Math.PI * 0.9, 0, enter),
    bow: (animated ? 0 : 0.03) + nod,
    sway: Math.sin(t * 0.55) * 0.02 * idle,
    breath: Math.sin(t * 1.45) * idle,
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

const DRAG_RADIANS_PER_PX = 0.012
const SPIN_FRICTION = 3.2

function useDragRotation() {
  const gl = useThree((state) => state.gl)
  const drag = useRef({ active: false, lastX: 0, lastT: 0, yaw: 0, velocity: 0, touched: false })

  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = 'pan-y'
    el.style.cursor = 'grab'

    const onDown = (e: PointerEvent) => {
      const d = drag.current
      d.active = true
      d.touched = true
      d.lastX = e.clientX
      d.lastT = performance.now()
      d.velocity = 0
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d.active) return
      const now = performance.now()
      const delta = (e.clientX - d.lastX) * DRAG_RADIANS_PER_PX
      const elapsed = Math.max(now - d.lastT, 1) / 1000
      d.yaw += delta
      d.velocity = mix(d.velocity, delta / elapsed, 0.5)
      d.lastX = e.clientX
      d.lastT = now
    }
    const onUp = (e: PointerEvent) => {
      const d = drag.current
      if (!d.active) return
      d.active = false
      if (performance.now() - d.lastT > 80) d.velocity = 0
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      el.style.cursor = 'grab'
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  return drag
}

function Character({ reduced, onReady }: { reduced: boolean; onReady: () => void }) {
  const { scene, animations } = useGLTF(MODEL_URL)
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const startedAt = useRef<number | null>(null)
  const drag = useDragRotation()
  const animated = animations.length > 0

  const { wrapper, root } = useMemo(() => {
    const root = cloneSkinned(scene)
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const source = child.material as THREE.MeshStandardMaterial
      child.material = new THREE.MeshStandardMaterial({ map: source.map, roughness: 0.72, metalness: 0.05 })
      child.frustumCulled = false
    })
    // The export faces sideways; turn it toward the camera before measuring.
    root.rotation.y = -Math.PI / 2
    root.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(root)
    const center = box.getCenter(new THREE.Vector3())
    root.position.set(-center.x, -box.min.y, -center.z)
    const wrapper = new THREE.Group()
    wrapper.add(root)
    wrapper.scale.setScalar(1.8 / (box.max.y - box.min.y))
    return { wrapper, root }
  }, [scene])

  const { actions, names } = useAnimations(animations, root)

  useEffect(() => {
    if (reduced || names.length === 0) return
    const action = actions[names[0]]
    action?.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.4).play()
    return () => {
      action?.fadeOut(0.3)
    }
  }, [actions, names, reduced])

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
    const pose = poseAt(t, reduced, animated)
    const dt = Math.min(delta, 1 / 30)

    if (!springs.current) {
      springs.current = {
        lift: spring(pose.lift), spin: spring(pose.spin), bow: spring(pose.bow), sway: spring(), breath: spring(),
        yaw: spring(pose.spin), pitch: spring(),
      }
    }
    const s = springs.current
    const g = group.current
    const b = body.current
    if (!g || !b) return

    const d = drag.current
    if (!d.active && d.velocity !== 0) {
      d.yaw += d.velocity * dt
      d.velocity *= Math.exp(-SPIN_FRICTION * dt)
      if (Math.abs(d.velocity) < 0.01) d.velocity = 0
    }

    const settled = clamp01((t - 1.4) / 1.2)
    const follow = d.touched ? 0 : 1
    const yawTarget = pose.spin + d.yaw + pointer.current.x * 0.32 * settled * follow
    g.rotation.y = d.active ? (s.yaw.x = yawTarget) : stepSpring(s.yaw, yawTarget, 28, 0.82, dt)
    if (d.active) s.yaw.v = 0
    const pitch = stepSpring(s.pitch, pointer.current.y * 0.04 * settled * follow, 20, 0.9, dt)
    g.position.y = stepSpring(s.lift, pose.lift, 55, 0.7, dt)
    g.position.x = stepSpring(s.sway, pose.sway, 30, 0.9, dt) * 0.6
    g.rotation.x = stepSpring(s.bow, pose.bow, 45, 0.7, dt) + pitch
    g.rotation.z = -s.sway.x * 0.8

    const breath = stepSpring(s.breath, pose.breath, 40, 0.9, dt)
    b.scale.set(1 + breath * 0.006, 1 + breath * 0.008, 1 + breath * 0.006)
  })

  return (
    <group ref={group}>
      <group ref={body}>
        <primitive object={wrapper} />
      </group>
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
      aria-label="3D model of the host. Drag to rotate."
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
