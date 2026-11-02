import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import {
  Environment,
  Lightformer,
  OrbitControls,
  Sparkles,
} from '@react-three/drei'
import Pony from './Pony.jsx'
import Garden from './Garden.jsx'

function CameraRig({ isMobile, resetSignal, entered, reducedMotion }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const controls = useRef()
  const timer = useRef()
  const home = useRef({
    position: new THREE.Vector3(0.7, 2.25, 7.6),
    target: new THREE.Vector3(0, 1.5, 0),
  })
  const [autoRotate, setAutoRotate] = useState(false)

  useEffect(() => {
    const distance = isMobile ? 8.3 : 7.6
    const next = new THREE.Vector3(isMobile ? 0.25 : 0.7, isMobile ? 2.3 : 2.25, distance)
    if (size.width / size.height < 0.82) next.z += 0.7
    home.current.position.copy(next)
    camera.position.copy(next)
    if (controls.current) {
      controls.current.target.copy(home.current.target)
      controls.current.update()
    }
    // Solo se recoloca al cambiar entre móvil y escritorio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  const scheduleIdle = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    if (reducedMotion) {
      setAutoRotate(false)
      return
    }
    timer.current = window.setTimeout(() => setAutoRotate(true), 15000)
  }, [reducedMotion])

  useEffect(() => {
    if (entered) scheduleIdle()
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [entered, scheduleIdle])

  useEffect(() => {
    if (!resetSignal || !controls.current) return
    camera.position.copy(home.current.position)
    controls.current.target.copy(home.current.target)
    controls.current.update()
    setAutoRotate(false)
    scheduleIdle()
  }, [resetSignal, camera, scheduleIdle])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 1.5, 0]}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.75}
      zoomSpeed={0.75}
      minDistance={4.2}
      maxDistance={13}
      minPolarAngle={0.35}
      maxPolarAngle={Math.PI / 2 - 0.02}
      autoRotate={autoRotate && entered && !reducedMotion}
      autoRotateSpeed={0.4}
      onStart={() => {
        setAutoRotate(false)
        if (timer.current) window.clearTimeout(timer.current)
      }}
      onEnd={scheduleIdle}
    />
  )
}

function Lights({ isMobile }) {
  return (
    <>
      <ambientLight intensity={0.32} color="#fff2fb" />
      <hemisphereLight args={['#ffe8fb', '#c8dcff', 0.55]} />
      <directionalLight
        position={[4.5, 7.5, 4.5]}
        intensity={1.55}
        color="#fff5fc"
        castShadow
        shadow-mapSize-width={isMobile ? 1024 : 2048}
        shadow-mapSize-height={isMobile ? 1024 : 2048}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={5.5}
        shadow-camera-bottom={-5.5}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.8} color="#c9b2ff" />
      <pointLight position={[0, 2.6, -3.2]} intensity={5} distance={8} decay={2} color="#ffb4e4" />
      <pointLight position={[3.2, 1.2, 2.2]} intensity={3} distance={5} decay={2} color="#bfe6ff" />
      <pointLight position={[0.4, 2.2, 5.2]} intensity={2.4} distance={9} decay={2} color="#ffe6f4" />
      <Environment resolution={64} frames={1} environmentIntensity={0.4}>
        <Lightformer
          form="rect"
          intensity={3}
          color="#ffd9f2"
          position={[0, 5, -5]}
          rotation={[0, 0, 0]}
          scale={[9, 5, 1]}
        />
        <Lightformer
          form="circle"
          intensity={2.4}
          color="#fff2c9"
          position={[-5, 3, 4]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[4, 4, 1]}
        />
        <Lightformer
          form="circle"
          intensity={2}
          color="#cfe6ff"
          position={[5, 2.5, 3]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[4, 4, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.6}
          color="#ffffff"
          position={[0, -3, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[6, 6, 1]}
        />
      </Environment>
    </>
  )
}

function MagicParticles({ isMobile, reducedMotion }) {
  if (reducedMotion) {
    return (
      <Sparkles
        count={18}
        scale={[8, 4, 6]}
        position={[0, 2, -0.5]}
        size={2}
        speed={0.12}
        opacity={0.45}
        color="#ffe9ff"
      />
    )
  }
  return (
    <>
      <Sparkles
        count={isMobile ? 45 : 100}
        scale={[9, 5.5, 7]}
        position={[0, 2.2, -0.8]}
        size={isMobile ? 2.4 : 3}
        speed={0.28}
        opacity={0.85}
        color="#fff0ff"
        noise={0.7}
      />
      <Sparkles
        count={isMobile ? 22 : 42}
        scale={[6, 3.5, 4]}
        position={[0, 1.4, 1]}
        size={isMobile ? 1.8 : 2.2}
        speed={0.18}
        opacity={0.7}
        color="#ffc9ea"
        noise={0.6}
      />
    </>
  )
}

export default function Scene({
  config,
  action,
  actionKey,
  petKey,
  entered,
  resetSignal,
  isMobile,
  reducedMotion,
}) {
  return (
    <Canvas
      shadows
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ position: [0.7, 2.25, 7.6], fov: 33, near: 0.1, far: 60 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.0
        gl.shadowMap.type = THREE.PCFShadowMap
      }}
      style={{ touchAction: 'pan-y' }}
      aria-label="Escena 3D interactiva de Luna, la pony alicornio, en un jardín mágico."
    >
      <Suspense fallback={null}>
        <Lights isMobile={isMobile} />
        <CameraRig
          isMobile={isMobile}
          resetSignal={resetSignal}
          entered={entered}
          reducedMotion={reducedMotion}
        />
        <Garden isMobile={isMobile} />
        <Pony
          config={config}
          action={action}
          actionKey={actionKey}
          petKey={petKey}
          entered={entered}
          reducedMotion={reducedMotion}
        />
        <MagicParticles isMobile={isMobile} reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  )
}
