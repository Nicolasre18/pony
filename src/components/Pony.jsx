import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

/* ------------------------------------------------------------------ */
/* Geometrías compartidas (se crean una sola vez)                      */
/* ------------------------------------------------------------------ */

const SPHERE = new THREE.SphereGeometry(1, 32, 24)
const PLANE = new THREE.PlaneGeometry(1, 1)
const UPPER_LEG = new THREE.CapsuleGeometry(0.12, 0.34, 6, 16)
const LOWER_LEG = new THREE.CapsuleGeometry(0.095, 0.3, 6, 16)
const NECK = new THREE.CapsuleGeometry(0.32, 0.48, 8, 24)
const HOOF = new THREE.CylinderGeometry(0.12, 0.138, 0.16, 24)
const HOOF_BAND = new THREE.TorusGeometry(0.116, 0.014, 8, 20)
const HORN = new THREE.ConeGeometry(0.1, 0.62, 24, 4)
const HORN_RING = new THREE.TorusGeometry(1, 0.13, 8, 28)
const MOUTH = new THREE.TorusGeometry(0.072, 0.011, 8, 28, Math.PI)
const LASH = new THREE.CapsuleGeometry(0.011, 0.075, 4, 8)
const EYELINER = new THREE.TorusGeometry(1, 0.03, 6, 40, Math.PI * 0.92)
const STAR = createStarGeometry()
const HEART = createHeartGeometry()
const WING = createWingGeometry()

function createStarGeometry() {
  const shape = new THREE.Shape()
  const outer = 1
  const inner = 0.44
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSize: 0.045,
    bevelThickness: 0.04,
    bevelSegments: 2,
    curveSegments: 4,
  })
  geometry.center()
  return geometry
}

function createHeartGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0.32)
  shape.bezierCurveTo(0.02, 0.62, 0.52, 0.72, 0.52, 0.28)
  shape.bezierCurveTo(0.52, -0.06, 0.16, -0.3, 0, -0.56)
  shape.bezierCurveTo(-0.16, -0.3, -0.52, -0.06, -0.52, 0.28)
  shape.bezierCurveTo(-0.52, 0.72, -0.02, 0.62, 0, 0.32)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
    curveSegments: 12,
  })
  geometry.center()
  return geometry
}

function createWingGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0.06)
  shape.bezierCurveTo(0.16, 0.44, 0.56, 0.66, 0.98, 0.5)
  shape.bezierCurveTo(1.16, 0.42, 1.2, 0.2, 1.02, 0.09)
  shape.bezierCurveTo(1.24, -0.02, 1.2, -0.28, 0.96, -0.3)
  shape.bezierCurveTo(1.02, -0.47, 0.82, -0.59, 0.64, -0.48)
  shape.bezierCurveTo(0.67, -0.66, 0.44, -0.71, 0.32, -0.55)
  shape.bezierCurveTo(0.28, -0.35, 0.14, -0.15, 0, 0.06)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.015,
    bevelSegments: 2,
    curveSegments: 22,
  })
  geometry.center()
  return geometry
}

function createRadialTexture(stops) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  for (const [offset, color] of stops) gradient.addColorStop(offset, color)
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/* ------------------------------------------------------------------ */
/* Materiales                                                          */
/* ------------------------------------------------------------------ */

const WHITE = new THREE.Color('#ffffff')

function usePonyMaterials(config) {
  const textures = useMemo(
    () => ({
      aura: createRadialTexture([
        [0, 'rgba(255, 226, 250, 0.85)'],
        [0.35, 'rgba(226, 186, 255, 0.4)'],
        [0.7, 'rgba(190, 224, 255, 0.12)'],
        [1, 'rgba(255, 255, 255, 0)'],
      ]),
      shadow: createRadialTexture([
        [0, 'rgba(90, 58, 130, 0.34)'],
        [0.5, 'rgba(105, 72, 148, 0.17)'],
        [1, 'rgba(120, 90, 160, 0)'],
      ]),
    }),
    [],
  )

  const materials = useMemo(() => {
    const coat = new THREE.MeshPhysicalMaterial({
      color: config.coat,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.32,
      clearcoatRoughness: 0.55,
      sheen: 0.4,
      sheenColor: new THREE.Color('#ffe6f4'),
      sheenRoughness: 0.7,
    })
    const coatLight = new THREE.MeshPhysicalMaterial({
      color: config.coat,
      roughness: 0.62,
      clearcoat: 0.2,
      sheen: 0.3,
      sheenColor: new THREE.Color('#ffffff'),
    })
    const mane = new THREE.MeshPhysicalMaterial({
      color: config.mane,
      roughness: 0.24,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      sheen: 1,
      sheenColor: new THREE.Color('#ffffff'),
      sheenRoughness: 0.22,
      iridescence: 0.46,
      iridescenceIOR: 1.35,
    })
    const maneLight = mane.clone()
    maneLight.color = new THREE.Color(config.mane).lerp(WHITE, 0.26)
    maneLight.roughness = 0.18
    const tail = mane.clone()
    tail.color = new THREE.Color(config.tail)
    const eyeWhite = new THREE.MeshPhysicalMaterial({
      color: '#fffafd',
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    })
    const iris = new THREE.MeshPhysicalMaterial({
      color: config.eye,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      emissive: new THREE.Color(config.eye),
      emissiveIntensity: 0.18,
    })
    const pupil = new THREE.MeshPhysicalMaterial({
      color: '#2a1a3e',
      roughness: 0.15,
      clearcoat: 1,
    })
    const shine = new THREE.MeshBasicMaterial({ color: '#ffffff' })
    const line = new THREE.MeshStandardMaterial({
      color: '#5b3f76',
      roughness: 0.45,
    })
    const hoof = new THREE.MeshPhysicalMaterial({
      color: '#fff2fb',
      roughness: 0.16,
      metalness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      sheen: 0.5,
      sheenColor: new THREE.Color('#ffd9f1'),
    })
    const blush = new THREE.MeshBasicMaterial({
      color: '#ff6db4',
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    })
    const horn = new THREE.MeshPhysicalMaterial({
      color: '#fff2d4',
      roughness: 0.14,
      metalness: 0.45,
      clearcoat: 1,
      emissive: new THREE.Color('#ffcf8f'),
      emissiveIntensity: 0.4,
      iridescence: 1,
      iridescenceIOR: 1.4,
    })
    const gold = new THREE.MeshPhysicalMaterial({
      color: '#ffd88d',
      roughness: 0.22,
      metalness: 0.9,
      emissive: new THREE.Color('#ffb64f'),
      emissiveIntensity: 0.2,
    })
    const gem = new THREE.MeshPhysicalMaterial({
      color: '#ff9ed1',
      roughness: 0.08,
      metalness: 0.2,
      clearcoat: 1,
      emissive: new THREE.Color('#ff6fb6'),
      emissiveIntensity: 0.35,
    })
    const bow = new THREE.MeshPhysicalMaterial({
      color: '#ff8ec5',
      roughness: 0.25,
      clearcoat: 1,
      sheen: 1,
      sheenColor: new THREE.Color('#ffd9eb'),
    })
    const petal = new THREE.MeshPhysicalMaterial({
      color: '#ffb4da',
      roughness: 0.3,
      clearcoat: 0.8,
      sheen: 0.8,
      sheenColor: new THREE.Color('#ffffff'),
    })
    const innerEar = new THREE.MeshStandardMaterial({
      color: '#ffb0ce',
      roughness: 0.65,
    })
    const wing = new THREE.MeshPhysicalMaterial({
      color: '#f7f2ff',
      opacity: 0.94,
      transparent: true,
      roughness: 0.08,
      metalness: 0.05,
      iridescence: 0.85,
      iridescenceIOR: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
      emissive: new THREE.Color('#ffe4fa'),
      emissiveIntensity: 0.55,
    })
    const heart = new THREE.MeshStandardMaterial({
      color: '#ff8ec5',
      emissive: new THREE.Color('#ff4f9e'),
      emissiveIntensity: 0.7,
      roughness: 0.25,
    })
    const aura = new THREE.SpriteMaterial({
      map: textures.aura,
      color: '#ffe0fa',
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    })
    const shadow = new THREE.MeshBasicMaterial({
      map: textures.shadow,
      color: '#7a55a0',
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })

    return {
      coat,
      coatLight,
      mane,
      maneLight,
      tail,
      eyeWhite,
      iris,
      pupil,
      shine,
      line,
      hoof,
      blush,
      horn,
      gold,
      gem,
      bow,
      petal,
      innerEar,
      wing,
      heart,
      aura,
      shadow,
    }
  }, [textures])

  const targets = useRef({
    coat: new THREE.Color(config.coat),
    mane: new THREE.Color(config.mane),
    tail: new THREE.Color(config.tail),
    eye: new THREE.Color(config.eye),
  })

  useEffect(() => {
    targets.current.coat.set(config.coat)
    targets.current.mane.set(config.mane)
    targets.current.tail.set(config.tail)
    targets.current.eye.set(config.eye)
  }, [config.coat, config.mane, config.tail, config.eye])

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 7)
    const { coat, mane, tail, eye } = targets.current
    materials.coat.color.lerp(coat, k)
    materials.coatLight.color.copy(materials.coat.color).lerp(WHITE, 0.28)
    materials.mane.color.lerp(mane, k)
    materials.maneLight.color.copy(materials.mane.color).lerp(WHITE, 0.26)
    materials.tail.color.lerp(tail, k)
    materials.iris.color.lerp(eye, k)
    materials.iris.emissive.lerp(eye, k)
    materials.hoof.color.copy(materials.coat.color).lerp(WHITE, 0.62)
  })

  return materials
}

/* ------------------------------------------------------------------ */
/* Mechones animados                                                   */
/* ------------------------------------------------------------------ */

function Lock({ spec, material, castShadow = true }) {
  const meshes = useRef([])
  const segments = useMemo(() => {
    const points = spec.points
    return points.map((point, index) => {
      const previous = points[Math.max(0, index - 1)]
      const next = points[Math.min(points.length - 1, index + 1)]
      const dir = new THREE.Vector3(
        next[0] - previous[0],
        next[1] - previous[1],
        next[2] - previous[2],
      )
      if (dir.lengthSq() < 0.00001) dir.set(0, -1, 0)
      dir.normalize()
      const rotX = Math.atan2(dir.z, dir.y)
      const rotZ = -Math.atan2(
        dir.x,
        Math.sqrt(dir.y * dir.y + dir.z * dir.z),
      )
      const radius = spec.radii[index]
      const distance = Math.hypot(
        next[0] - point[0],
        next[1] - point[1],
        next[2] - point[2],
      )
      return {
        base: point,
        scale: [
          radius * 0.78,
          Math.max(radius * 1.95, distance * 0.72),
          radius * 0.7,
        ],
        rotation: [rotX, 0, rotZ],
        sway: spec.wave * Math.pow(index / Math.max(1, points.length - 1), 0.65),
      }
    })
  }, [spec])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < segments.length; i += 1) {
      const mesh = meshes.current[i]
      if (!mesh) continue
      const segment = segments[i]
      const phase = spec.phase + i * 0.62
      mesh.position.x = segment.base[0] + Math.sin(t * spec.speed + phase) * segment.sway
      mesh.position.z =
        segment.base[2] + Math.cos(t * spec.speed * 0.82 + phase) * segment.sway * 0.75
      mesh.rotation.z =
        segment.rotation[2] + Math.sin(t * spec.speed * 0.9 + phase) * segment.sway * 1.4
    }
  })

  return (
    <group position={spec.start}>
      {segments.map((segment, index) => (
        <mesh
          key={index}
          ref={(node) => {
            meshes.current[index] = node
          }}
          geometry={SPHERE}
          material={material}
          position={segment.base}
          scale={segment.scale}
          rotation={segment.rotation}
          castShadow={castShadow}
        />
      ))}
    </group>
  )
}

function Reveal({ show, children }) {
  const group = useRef()
  const amount = useRef(show ? 1 : 0.0001)

  useFrame((_, delta) => {
    const target = show ? 1 : 0.0001
    amount.current = THREE.MathUtils.damp(amount.current, target, 9, Math.min(delta, 0.05))
    if (!group.current) return
    group.current.scale.setScalar(amount.current)
    group.current.visible = amount.current > 0.015
  })

  return <group ref={group}>{children}</group>
}

/* ------------------------------------------------------------------ */
/* Mechones: melena y cola                                             */
/* ------------------------------------------------------------------ */

const FLOW_LOCKS = [
  {
    start: [0, 0, 0],
    points: [
      [0, 0.46, -0.2],
      [0.02, 0.3, -0.34],
      [0, 0.1, -0.44],
      [0.02, -0.12, -0.47],
      [0, -0.34, -0.42],
      [0.03, -0.54, -0.34],
    ],
    radii: [0.16, 0.16, 0.14, 0.11, 0.085, 0.05],
    phase: 0,
    wave: 0.022,
    speed: 1.1,
  },
  {
    start: [0, 0, 0],
    points: [
      [-0.42, 0.36, -0.12],
      [-0.5, 0.2, -0.18],
      [-0.55, 0.02, -0.22],
      [-0.52, -0.18, -0.2],
      [-0.46, -0.36, -0.14],
    ],
    radii: [0.125, 0.12, 0.105, 0.08, 0.05],
    phase: 1.4,
    wave: 0.02,
    speed: 1.22,
  },
  {
    start: [0, 0, 0],
    points: [
      [0.42, 0.36, -0.12],
      [0.5, 0.2, -0.18],
      [0.55, 0.02, -0.22],
      [0.52, -0.18, -0.2],
      [0.46, -0.36, -0.14],
    ],
    radii: [0.125, 0.12, 0.105, 0.08, 0.05],
    phase: 2.7,
    wave: 0.02,
    speed: 1.16,
  },
  {
    start: [0, 0, 0],
    points: [
      [-0.48, 0.2, 0.02],
      [-0.53, 0.04, -0.04],
      [-0.55, -0.14, -0.08],
      [-0.52, -0.3, -0.04],
      [-0.46, -0.42, 0.02],
    ],
    radii: [0.09, 0.085, 0.065, 0.045, 0.024],
    phase: 0.7,
    wave: 0.018,
    speed: 1.35,
  },
  {
    start: [0, 0, 0],
    points: [
      [0.48, 0.2, 0.02],
      [0.53, 0.04, -0.04],
      [0.55, -0.14, -0.08],
      [0.52, -0.3, -0.04],
      [0.46, -0.42, 0.02],
    ],
    radii: [0.09, 0.085, 0.065, 0.045, 0.024],
    phase: 2.1,
    wave: 0.018,
    speed: 1.28,
  },
]

const FORELOCK_LOCKS = [
  {
    start: [0, 0, 0],
    points: [
      [0.24, 0.5, 0.16],
      [0.14, 0.44, 0.3],
      [0.02, 0.37, 0.4],
      [-0.08, 0.31, 0.45],
    ],
    radii: [0.11, 0.105, 0.075, 0.04],
    phase: 0.4,
    wave: 0.012,
    speed: 1.4,
  },
  {
    start: [0, 0, 0],
    points: [
      [0.05, 0.54, 0.17],
      [-0.02, 0.47, 0.3],
      [-0.12, 0.39, 0.39],
      [-0.2, 0.33, 0.43],
    ],
    radii: [0.095, 0.09, 0.065, 0.035],
    phase: 1.9,
    wave: 0.011,
    speed: 1.5,
  },
  {
    start: [0, 0, 0],
    points: [
      [0.36, 0.44, 0.08],
      [0.34, 0.37, 0.2],
      [0.3, 0.3, 0.3],
    ],
    radii: [0.06, 0.05, 0.028],
    phase: 3.1,
    wave: 0.01,
    speed: 1.32,
  },
]

const BANGS_LOCKS = [
  {
    start: [0, 0, 0],
    points: [
      [-0.16, 0.54, 0.16],
      [-0.1, 0.46, 0.3],
      [-0.03, 0.38, 0.4],
      [-0.05, 0.32, 0.45],
    ],
    radii: [0.13, 0.125, 0.085, 0.04],
    phase: 0.3,
    wave: 0.014,
    speed: 1.2,
  },
  {
    start: [0, 0, 0],
    points: [
      [0.16, 0.52, 0.14],
      [0.08, 0.44, 0.28],
      [0, 0.37, 0.38],
      [0.02, 0.32, 0.42],
    ],
    radii: [0.12, 0.115, 0.08, 0.038],
    phase: 1.6,
    wave: 0.014,
    speed: 1.3,
  },
  {
    start: [0, 0, 0],
    points: [
      [0, 0.56, 0.14],
      [-0.02, 0.48, 0.28],
      [0, 0.4, 0.38],
      [0.02, 0.33, 0.42],
    ],
    radii: [0.13, 0.12, 0.085, 0.04],
    phase: 2.8,
    wave: 0.013,
    speed: 1.25,
  },
  {
    start: [0, 0, 0],
    points: [
      [-0.36, 0.3, 0.06],
      [-0.38, 0.14, 0.08],
      [-0.36, -0.04, 0.06],
      [-0.32, -0.18, 0.02],
    ],
    radii: [0.11, 0.1, 0.075, 0.038],
    phase: 0.9,
    wave: 0.016,
    speed: 1.4,
  },
  {
    start: [0, 0, 0],
    points: [
      [0.36, 0.3, 0.06],
      [0.38, 0.14, 0.08],
      [0.36, -0.04, 0.06],
      [0.32, -0.18, 0.02],
    ],
    radii: [0.11, 0.1, 0.075, 0.038],
    phase: 2.2,
    wave: 0.016,
    speed: 1.34,
  },
  // Melena corta en la nuca.
  {
    start: [0, 0, 0],
    points: [
      [0, 0.36, -0.24],
      [0, 0.2, -0.36],
      [0.02, 0.02, -0.4],
      [0, -0.16, -0.36],
    ],
    radii: [0.16, 0.14, 0.09, 0.04],
    phase: 1.2,
    wave: 0.018,
    speed: 1.15,
  },
  {
    start: [0, 0, 0],
    points: [
      [-0.24, 0.3, -0.2],
      [-0.28, 0.14, -0.3],
      [-0.26, -0.04, -0.3],
      [-0.2, -0.16, -0.26],
    ],
    radii: [0.13, 0.115, 0.08, 0.04],
    phase: 2.5,
    wave: 0.018,
    speed: 1.25,
  },
]

const PONY_LOCKS = [
  {
    start: [0, 0, 0],
    points: [
      [0, 0.48, -0.3],
      [0.04, 0.32, -0.46],
      [-0.02, 0.1, -0.54],
      [0.03, -0.12, -0.52],
      [0, -0.32, -0.44],
      [0.02, -0.48, -0.34],
    ],
    radii: [0.15, 0.15, 0.13, 0.09, 0.05, 0.025],
    phase: 0.5,
    wave: 0.03,
    speed: 1.2,
  },
  {
    start: [0, 0, 0],
    points: [
      [-0.16, 0.46, -0.28],
      [-0.22, 0.28, -0.42],
      [-0.25, 0.06, -0.48],
      [-0.21, -0.14, -0.44],
      [-0.16, -0.3, -0.36],
    ],
    radii: [0.13, 0.12, 0.09, 0.05, 0.025],
    phase: 1.8,
    wave: 0.03,
    speed: 1.3,
  },
  {
    start: [0, 0, 0],
    points: [
      [0.16, 0.46, -0.28],
      [0.22, 0.28, -0.42],
      [0.25, 0.06, -0.48],
      [0.21, -0.14, -0.44],
      [0.16, -0.3, -0.36],
    ],
    radii: [0.13, 0.12, 0.09, 0.05, 0.025],
    phase: 2.9,
    wave: 0.03,
    speed: 1.24,
  },
  {
    start: [0, 0, 0],
    points: [
      [-0.26, 0.46, 0.12],
      [-0.18, 0.4, 0.26],
      [-0.08, 0.36, 0.36],
      [-0.02, 0.33, 0.42],
    ],
    radii: [0.11, 0.095, 0.06, 0.03],
    phase: 0.8,
    wave: 0.012,
    speed: 1.4,
  },
]

const TAIL_LOCKS = [
  {
    start: [0, 0, 0],
    points: [
      [0, 0.02, -0.16],
      [0.02, -0.08, -0.34],
      [-0.03, -0.24, -0.48],
      [0.02, -0.42, -0.56],
      [-0.01, -0.6, -0.55],
      [0.02, -0.74, -0.47],
    ],
    radii: [0.13, 0.14, 0.13, 0.11, 0.08, 0.04],
    phase: 0,
    wave: 0.04,
    speed: 1.25,
  },
  {
    start: [-0.1, 0.04, -0.02],
    points: [
      [-0.14, -0.06, -0.18],
      [-0.18, -0.2, -0.33],
      [-0.16, -0.38, -0.42],
      [-0.12, -0.54, -0.4],
      [-0.08, -0.66, -0.34],
    ],
    radii: [0.1, 0.11, 0.09, 0.06, 0.035],
    phase: 1.5,
    wave: 0.045,
    speed: 1.4,
  },
  {
    start: [0.1, 0.04, -0.02],
    points: [
      [0.14, -0.06, -0.18],
      [0.18, -0.2, -0.33],
      [0.16, -0.38, -0.42],
      [0.12, -0.54, -0.4],
      [0.08, -0.66, -0.34],
    ],
    radii: [0.1, 0.11, 0.09, 0.06, 0.035],
    phase: 2.8,
    wave: 0.045,
    speed: 1.32,
  },
]

function Mane({ config, materials }) {
  return (
    <>
      {/* Volumen que une los mechones con la cabeza */}
      <group position={[0, 0.22, -0.24]}>
        <mesh
          geometry={SPHERE}
          material={materials.mane}
          scale={[0.58, 0.44, 0.4]}
          castShadow
        />
        <mesh
          geometry={SPHERE}
          material={materials.mane}
          position={[-0.46, -0.05, 0.02]}
          scale={[0.24, 0.42, 0.28]}
          castShadow
        />
        <mesh
          geometry={SPHERE}
          material={materials.mane}
          position={[0.46, -0.05, 0.02]}
          scale={[0.24, 0.42, 0.28]}
          castShadow
        />
        <mesh
          geometry={SPHERE}
          material={materials.mane}
          position={[0, -0.36, -0.06]}
          scale={[0.42, 0.3, 0.26]}
          castShadow
        />
      </group>
      <Reveal show={config.maneStyle === 'flow'}>
        {FLOW_LOCKS.map((spec, index) => (
          <Lock key={`flow-${index}`} spec={spec} material={materials.mane} />
        ))}
        {FORELOCK_LOCKS.map((spec, index) => (
          <Lock key={`fore-${index}`} spec={spec} material={materials.mane} />
        ))}
      </Reveal>
      <Reveal show={config.maneStyle === 'bangs'}>
        {BANGS_LOCKS.map((spec, index) => (
          <Lock key={`bang-${index}`} spec={spec} material={materials.mane} />
        ))}
      </Reveal>
      <Reveal show={config.maneStyle === 'pony'}>
        {PONY_LOCKS.map((spec, index) => (
          <Lock key={`pony-${index}`} spec={spec} material={materials.mane} />
        ))}
        <mesh
          geometry={SPHERE}
          material={materials.bow}
          position={[0, 0.48, -0.3]}
          scale={[0.11, 0.08, 0.08]}
          castShadow
        />
        <mesh
          geometry={SPHERE}
          material={materials.bow}
          position={[-0.13, 0.52, -0.28]}
          scale={[0.12, 0.07, 0.05]}
          rotation={[0, 0, 0.5]}
        />
        <mesh
          geometry={SPHERE}
          material={materials.bow}
          position={[0.13, 0.52, -0.28]}
          scale={[0.12, 0.07, 0.05]}
          rotation={[0, 0, -0.5]}
        />
        <mesh
          geometry={SPHERE}
          material={materials.gold}
          position={[0, 0.48, -0.3]}
          scale={[0.04, 0.04, 0.04]}
        />
      </Reveal>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Accesorios                                                          */
/* ------------------------------------------------------------------ */

function Tiara({ material, gem }) {
  const beads = [-0.19, -0.1, 0, 0.1, 0.19]
  return (
    <group position={[0, 0.32, 0.35]} rotation={[-0.38, 0, 0]}>
      {beads.map((x, index) => (
        <mesh
          key={index}
          geometry={SPHERE}
          material={material}
          position={[x, index === 2 ? 0.06 : Math.abs(x) * 0.1, 0]}
          scale={0.032}
        />
      ))}
      <mesh
        geometry={STAR}
        material={material}
        position={[0, 0.15, 0.01]}
        scale={[0.075, 0.075, 0.075]}
        rotation={[0, 0, 0]}
      />
      <mesh
        geometry={SPHERE}
        material={gem}
        position={[0, 0.05, 0.035]}
        scale={0.035}
      />
    </group>
  )
}

function Bow({ material, gold }) {
  return (
    <group position={[0.36, 0.32, 0.26]} rotation={[0.1, 0.35, 0.2]}>
      <mesh
        geometry={SPHERE}
        material={material}
        position={[-0.11, 0, 0]}
        scale={[0.13, 0.09, 0.05]}
        rotation={[0, 0, 0.55]}
      />
      <mesh
        geometry={SPHERE}
        material={material}
        position={[0.11, 0, 0]}
        scale={[0.13, 0.09, 0.05]}
        rotation={[0, 0, -0.55]}
      />
      <mesh
        geometry={SPHERE}
        material={gold}
        position={[0, 0, 0.02]}
        scale={[0.045, 0.045, 0.04]}
      />
    </group>
  )
}

function Flower({ petal, gold }) {
  const petals = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const angle = (i / 5) * Math.PI * 2
      return {
        position: [Math.cos(angle) * 0.072, Math.sin(angle) * 0.072, 0],
        rotation: [0, 0, angle],
      }
    })
  }, [])

  return (
    <group position={[-0.38, 0.34, 0.26]} rotation={[0.1, -0.35, -0.25]}>
      {petals.map((petalData, index) => (
        <mesh
          key={index}
          geometry={SPHERE}
          material={petal}
          position={petalData.position}
          rotation={petalData.rotation}
          scale={[0.06, 0.04, 0.018]}
        />
      ))}
      <mesh geometry={SPHERE} material={gold} position={[0, 0, 0.02]} scale={0.035} />
    </group>
  )
}

function Necklace({ material }) {
  const charms = useMemo(
    () =>
      [-0.7, -0.35, 0, 0.35, 0.7].map((angle) => ({
        position: [Math.sin(angle) * 0.33, -Math.cos(angle) * 0.03 - 0.03, Math.cos(angle) * 0.33],
        rotation: [0, angle, 0],
        scale: angle === 0 ? 0.045 : 0.032,
      })),
    [],
  )

  return (
    <group position={[0, 1.6, 0.4]} rotation={[-0.18, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.35, 0.013, 8, 48]} />
        <primitive object={material} attach="material" />
      </mesh>
      {charms.map((charm, index) => (
        <mesh
          key={index}
          geometry={STAR}
          material={material}
          position={charm.position}
          rotation={charm.rotation}
          scale={charm.scale}
        />
      ))}
    </group>
  )
}

function Wing({ materials }) {
  return (
    <group>
      <mesh geometry={WING} material={materials.wing} />
      <mesh
        geometry={WING}
        material={materials.wing}
        scale={[0.65, 0.62, 1]}
        position={[0.22, 0.02, 0.03]}
      />
      <mesh
        geometry={WING}
        material={materials.maneLight}
        scale={[0.38, 0.42, 1.02]}
        position={[0.42, 0.02, 0.055]}
        rotation={[0, 0, -0.08]}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Corazones                                                           */
/* ------------------------------------------------------------------ */

function HeartBurst({ trigger, material }) {
  const items = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        delay: index * 0.055 + Math.random() * 0.12,
        life: 1.3 + Math.random() * 0.6,
        x: (Math.random() - 0.5) * 0.9,
        y: 2.15 + Math.random() * 0.55,
        z: 0.5 + Math.random() * 0.4,
        drift: (Math.random() - 0.5) * 0.6,
        rise: 0.7 + Math.random() * 0.8,
        spin: (Math.random() - 0.5) * 2.4,
        scale: 0.07 + Math.random() * 0.055,
      })),
    [],
  )
  const meshes = useRef([])
  const start = useRef(-100)

  useEffect(() => {
    if (trigger > 0) start.current = -1
  }, [trigger])

  useFrame(({ clock }) => {
    if (start.current === -1) start.current = clock.elapsedTime
    const elapsed = clock.elapsedTime - start.current
    items.forEach((item, index) => {
      const mesh = meshes.current[index]
      if (!mesh) return
      const age = elapsed - item.delay
      if (age < 0 || age > item.life) {
        mesh.visible = false
        return
      }
      const progress = age / item.life
      mesh.visible = true
      mesh.position.set(
        item.x + item.drift * progress,
        item.y + item.rise * progress + Math.sin(progress * Math.PI) * 0.12,
        item.z + progress * 0.15,
      )
      const pop = Math.sin(Math.min(progress * 3, 1) * Math.PI * 0.5)
      const fade = 1 - Math.pow(progress, 3)
      mesh.scale.setScalar(item.scale * pop * fade)
      mesh.rotation.set(0, 0, Math.sin(progress * 5 + index) * 0.3 + item.spin * progress)
    })
  })

  return (
    <group>
      {items.map((item, index) => (
        <mesh
          key={index}
          ref={(node) => {
            meshes.current[index] = node
          }}
          geometry={HEART}
          material={material}
          visible={false}
        />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Pata                                                                */
/* ------------------------------------------------------------------ */

function Leg({ hipRef, kneeRef, position, materials, back = false }) {
  return (
    <group position={position} ref={hipRef}>
      <mesh geometry={UPPER_LEG} material={materials.coat} castShadow />
      <mesh
        geometry={SPHERE}
        material={materials.coat}
        position={[0, 0.02, 0]}
        scale={[0.13, 0.12, 0.13]}
      />
      <group position={[0, -0.48, 0]} ref={kneeRef}>
        <mesh
          geometry={SPHERE}
          material={materials.coat}
          scale={[0.105, 0.1, 0.105]}
        />
        <mesh geometry={LOWER_LEG} material={materials.coat} castShadow />
        <mesh
          geometry={SPHERE}
          material={materials.coatLight}
          position={[0, -0.3, 0.01]}
          scale={[0.1, 0.075, 0.1]}
        />
        <mesh
          geometry={HOOF}
          material={materials.hoof}
          position={[0, -0.36, 0.012]}
          castShadow
        />
        <mesh
          geometry={HOOF_BAND}
          material={materials.gold}
          position={[0, -0.29, 0.012]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {back ? (
          <mesh
            geometry={SPHERE}
            material={materials.coat}
            position={[0, -0.14, -0.02]}
            scale={[0.1, 0.11, 0.11]}
          />
        ) : null}
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Pony                                                                */
/* ------------------------------------------------------------------ */

export default function Pony({ config, action = 'idle', actionKey = 0, petKey = 0, entered = true }) {
  const materials = usePonyMaterials(config)
  const pointer = useThree((state) => state.pointer)

  const root = useRef()
  const body = useRef()
  const head = useRef()
  const eyeLeft = useRef()
  const eyeRight = useRef()
  const irisLeft = useRef()
  const irisRight = useRef()
  const earLeft = useRef()
  const earRight = useRef()
  const legFL = useRef()
  const legFR = useRef()
  const legBL = useRef()
  const legBR = useRef()
  const kneeFL = useRef()
  const kneeFR = useRef()
  const kneeBL = useRef()
  const kneeBR = useRef()
  const tail = useRef()
  const wingLeft = useRef()
  const wingRight = useRef()
  const hornLight = useRef()
  const aura = useRef()

  const state = useRef({
    enteredAt: 0,
    actionStart: -1,
    blinkNext: 2.2,
    blinkLeft: 0,
    earNext: 3.4,
    earTwitch: 0,
    walkPhase: 0,
    walkWeight: 0,
    weightShift: 0,
  })

  useEffect(() => {
    state.current.actionStart = -1
  }, [action, actionKey])

  useEffect(() => {
    if (entered) state.current.enteredAt = 0
  }, [entered])

  useFrame(({ clock }, rawDelta) => {
    const t = clock.elapsedTime
    const delta = Math.min(rawDelta, 0.05)
    const s = state.current

    if (!root.current) return

    // Entrada mágica.
    if (entered && s.enteredAt === 0) s.enteredAt = t
    const entrance = entered
      ? easeOutBack(Math.min((t - s.enteredAt) / 1.1, 1))
      : 0.0001

    if (s.actionStart < 0) s.actionStart = t
    const actionTime = t - s.actionStart
    const isPet = action === 'pet' && actionTime < 2.8
    const isWalk = action === 'walk' && actionTime < 9.6
    const petProgress = isPet ? Math.min(actionTime / 2.8, 1) : 1

    // La orientación del cuerpo se suaviza siempre: así ninguna interrupción
    // provoca saltos bruscos.
    s.walkWeight = THREE.MathUtils.damp(s.walkWeight, isWalk ? 1 : 0, 4, delta)
    if (isWalk) s.walkPhase += delta * 10.5

    const walkEase = isWalk
      ? smoothstep(0, 0.12, actionTime / 9.6) *
        smoothstep(0, 0.12, 1 - actionTime / 9.6)
      : 0
    const angle = (actionTime / 9.6) * Math.PI * 2
    const pathX = Math.sin(angle) * 1.22 * walkEase
    const pathZ = Math.cos(angle) * 0.52 * walkEase - 0.12 * walkEase
    const pathRotation =
      Math.atan2(Math.cos(angle) * 1.22, -Math.sin(angle) * 0.52) * walkEase

    const petBounce = isPet ? Math.abs(Math.sin(actionTime * 7.2)) * 0.09 * (1 - petProgress) : 0
    const walkBounce =
      Math.abs(Math.sin(s.walkPhase)) * 0.045 * s.walkWeight * (isWalk ? 1 : 0)
    const idleBreath = Math.sin(t * 1.7) * 0.012

    root.current.position.x = THREE.MathUtils.damp(
      root.current.position.x,
      pathX,
      5,
      delta,
    )
    root.current.position.z = THREE.MathUtils.damp(
      root.current.position.z,
      pathZ,
      5,
      delta,
    )
    root.current.position.y = THREE.MathUtils.damp(
      root.current.position.y,
      walkBounce + petBounce,
      9,
      delta,
    )
    root.current.rotation.y = THREE.MathUtils.damp(
      root.current.rotation.y,
      pathRotation,
      5,
      delta,
    )
    root.current.scale.setScalar(Math.max(0.0001, entrance))

    // Cuerpo: respiración, paso y reacción a las caricias.
    if (body.current) {
      body.current.position.y = 1.13 + idleBreath + walkBounce * 0.5
      const squash = isPet ? Math.sin(actionTime * 10) * 0.025 * (1 - petProgress) : 0
      body.current.scale.set(1 + squash * 0.5, 1 - squash + idleBreath * 0.4, 1 + squash * 0.5)
    }

    // Mirada y cabeza.
    if (head.current) {
      const lookWeight = 1 - s.walkWeight * 0.7
      const lookYaw = THREE.MathUtils.clamp(pointer.x * 0.4, -0.42, 0.42) * lookWeight
      const lookPitch = THREE.MathUtils.clamp(-pointer.y * 0.22, -0.2, 0.22) * lookWeight
      const idleYaw = Math.sin(t * 0.52) * 0.06
      const petTilt = isPet ? 0.15 + Math.sin(actionTime * 6) * 0.05 : 0
      head.current.position.y =
        2.06 + Math.sin(t * 1.3) * 0.012 + walkBounce * 0.9 -
        (isPet ? Math.abs(Math.sin(actionTime * 7.2)) * 0.02 : 0)
      head.current.rotation.y = THREE.MathUtils.damp(
        head.current.rotation.y,
        lookYaw + idleYaw + (isWalk ? 0 : Math.sin(t * 0.31) * 0.05),
        5,
        delta,
      )
      head.current.rotation.x = THREE.MathUtils.damp(
        head.current.rotation.x,
        lookPitch + Math.sin(t * 0.7) * 0.02 - (isPet ? 0.12 : 0),
        5,
        delta,
      )
      head.current.rotation.z = THREE.MathUtils.damp(
        head.current.rotation.z,
        Math.sin(t * 0.45) * 0.02 + petTilt,
        5,
        delta,
      )
    }

    // Parpadeo natural.
    s.blinkNext -= delta
    if (s.blinkNext <= 0 && !isPet) {
      s.blinkLeft = 0.17
      s.blinkNext = 2.4 + Math.random() * 3.8
    }
    let blink = 0
    if (s.blinkLeft > 0) {
      s.blinkLeft = Math.max(0, s.blinkLeft - delta)
      blink = Math.sin((1 - s.blinkLeft / 0.17) * Math.PI)
    }
    const happyClose = isPet ? 0.86 * Math.sin(Math.min(petProgress * 1.15, 1) * Math.PI) : 0
    const eyeScale = Math.max(0.14, 1 - blink * 0.96 - happyClose)
    if (eyeLeft.current) eyeLeft.current.scale.y = eyeScale
    if (eyeRight.current) eyeRight.current.scale.y = eyeScale

    // Las pupilas acompañan al cursor.
    const irisX = THREE.MathUtils.clamp(pointer.x * 0.028, -0.03, 0.03)
    const irisY = THREE.MathUtils.clamp(-pointer.y * 0.018, -0.02, 0.02)
    if (irisLeft.current) {
      irisLeft.current.position.x = THREE.MathUtils.damp(irisLeft.current.position.x, irisX, 7, delta)
      irisLeft.current.position.y = THREE.MathUtils.damp(irisLeft.current.position.y, irisY, 7, delta)
    }
    if (irisRight.current) {
      irisRight.current.position.x = THREE.MathUtils.damp(irisRight.current.position.x, irisX, 7, delta)
      irisRight.current.position.y = THREE.MathUtils.damp(irisRight.current.position.y, irisY, 7, delta)
    }

    // Orejas: pequeños espasmos adorables.
    s.earNext -= delta
    if (s.earNext <= 0) {
      s.earTwitch = 0.35
      s.earNext = 3 + Math.random() * 4
    }
    if (s.earTwitch > 0) s.earTwitch = Math.max(0, s.earTwitch - delta * 0.9)
    const twitch = Math.sin(s.earTwitch * 18) * s.earTwitch * 0.5
    if (earLeft.current) earLeft.current.rotation.z = 0.2 + twitch + (isPet ? 0.08 : 0)
    if (earRight.current) earRight.current.rotation.z = -0.2 - twitch - (isPet ? 0.08 : 0)

    // Patas.
    const swing = 0.55 * s.walkWeight
    const step = s.walkPhase
    const phaseFL = 0
    const phaseFR = Math.PI
    const phaseBL = Math.PI
    const phaseBR = 0
    const legTargets = [
      [legFL, Math.sin(step + phaseFL) * swing],
      [legFR, Math.sin(step + phaseFR) * swing],
      [legBL, Math.sin(step + phaseBL) * swing],
      [legBR, Math.sin(step + phaseBR) * swing],
    ]
    for (const [ref, target] of legTargets) {
      if (ref.current) ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, target, 12, delta)
    }
    const knees = [
      [kneeFL, Math.max(0, Math.sin(step + phaseFL + 1.4)) * 0.55 * s.walkWeight],
      [kneeFR, Math.max(0, Math.sin(step + phaseFR + 1.4)) * 0.55 * s.walkWeight],
      [kneeBL, Math.max(0, Math.sin(step + phaseBL + 1.4)) * 0.5 * s.walkWeight],
      [kneeBR, Math.max(0, Math.sin(step + phaseBR + 1.4)) * 0.5 * s.walkWeight],
    ]
    for (const [ref, target] of knees) {
      if (ref.current) ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, target, 12, delta)
    }

    // Cola.
    if (tail.current) {
      const petWag = isPet ? Math.sin(actionTime * 12) * 0.25 : 0
      tail.current.rotation.y = THREE.MathUtils.damp(
        tail.current.rotation.y,
        Math.sin(t * 1.5) * 0.16 + petWag + s.walkWeight * Math.sin(s.walkPhase * 0.5) * 0.08,
        4,
        delta,
      )
      tail.current.rotation.x = THREE.MathUtils.damp(
        tail.current.rotation.x,
        -0.12 + Math.sin(t * 1.15) * 0.06 + (isPet ? Math.sin(actionTime * 8) * 0.12 : 0),
        4,
        delta,
      )
    }

    // Alas.
    if (wingLeft.current && wingRight.current) {
      const flap = 0.18 + Math.sin(t * 2) * 0.09 + (isPet ? 0.1 : 0) + (isWalk ? 0.06 : 0)
      wingLeft.current.rotation.z = flap
      wingRight.current.rotation.z = flap
    }

    // Brillo y rubor.
    if (hornLight.current) {
      hornLight.current.intensity = 1.2 + Math.sin(t * 2.6) * 0.45 + (isPet ? 1 : 0)
    }
    const blushTarget = isPet ? 0.6 : 0.3
    materials.blush.opacity = THREE.MathUtils.damp(materials.blush.opacity, blushTarget, 5, delta)
    materials.aura.opacity = 0.4 + Math.sin(t * 1.6) * 0.06
    materials.wing.opacity = 0.9 + Math.sin(t * 2.2) * 0.04
    if (aura.current) {
      const pulse = 1 + Math.sin(t * 1.4) * 0.03
      aura.current.scale.set(4.4 * pulse, 4.4 * pulse, 1)
    }
  })

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* Sombra suave y aura */}
      <mesh
        geometry={PLANE}
        material={materials.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
        scale={[2.3, 1.5, 1]}
        renderOrder={1}
      />
      <sprite ref={aura} position={[0, 1.4, -0.55]} scale={[4.4, 4.4, 1]}>
        <primitive object={materials.aura} attach="material" />
      </sprite>

      {/* Cuerpo */}
      <group ref={body} position={[0, 1.13, 0]}>
        <mesh geometry={SPHERE} material={materials.coat} scale={[0.54, 0.44, 0.82]} castShadow />
        <mesh
          geometry={SPHERE}
          material={materials.coat}
          position={[0, 0.08, 0.46]}
          scale={[0.45, 0.4, 0.4]}
          castShadow
        />
        <mesh
          geometry={SPHERE}
          material={materials.coat}
          position={[0, -0.03, -0.48]}
          scale={[0.53, 0.45, 0.48]}
          castShadow
        />
        {/* Volumen suave del pecho: ayuda a leer mejor la silueta frontal */}
        <mesh
          geometry={SPHERE}
          material={materials.coatLight}
          position={[0, 0.12, 0.73]}
          scale={[0.26, 0.17, 0.045]}
        />
        <mesh
          geometry={SPHERE}
          material={materials.shine}
          position={[-0.075, 0.17, 0.772]}
          scale={[0.032, 0.018, 0.008]}
        />
        {/* Cutie mark: constelación de estrellas */}
        <group position={[0.532, 0.06, -0.08]} rotation={[0, Math.PI / 2, 0]}>
          <mesh geometry={STAR} material={materials.gold} scale={[0.16, 0.16, 0.16]} rotation={[0, 0, 0.15]} />
          <mesh
            geometry={STAR}
            material={materials.gold}
            position={[0.12, -0.13, 0]}
            scale={[0.07, 0.07, 0.07]}
            rotation={[0, 0, -0.2]}
          />
          <mesh geometry={SPHERE} material={materials.shine} position={[-0.12, 0.13, 0]} scale={0.025} />
        </group>
        <group position={[-0.532, 0.06, -0.08]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh geometry={STAR} material={materials.gold} scale={[0.16, 0.16, 0.16]} rotation={[0, 0, 0.15]} />
          <mesh
            geometry={STAR}
            material={materials.gold}
            position={[-0.12, -0.13, 0]}
            scale={[0.07, 0.07, 0.07]}
            rotation={[0, 0, 0.2]}
          />
          <mesh geometry={SPHERE} material={materials.shine} position={[0.12, 0.13, 0]} scale={0.025} />
        </group>

        {/* Alas */}
        <Reveal show={config.accessories.wings}>
          <group
            ref={wingRight}
            position={[0.36, 0.46, -0.46]}
            rotation={[0.06, 0.52, -0.14]}
            scale={0.88}
          >
            <Wing materials={materials} />
          </group>
          <group
            ref={wingLeft}
            position={[-0.36, 0.46, -0.46]}
            rotation={[0.06, Math.PI - 0.52, -0.14]}
            scale={0.88}
          >
            <Wing materials={materials} />
          </group>
        </Reveal>

        {/* Cola */}
        <group ref={tail} position={[0, 0.2, -0.74]}>
          <mesh
            geometry={SPHERE}
            material={materials.tail}
            position={[0, 0.02, -0.04]}
            scale={[0.16, 0.16, 0.14]}
            castShadow
          />
          {TAIL_LOCKS.map((spec, index) => (
            <Lock key={`tail-${index}`} spec={spec} material={materials.tail} />
          ))}
        </group>
      </group>

      {/* Cuello */}
      <mesh
        geometry={NECK}
        material={materials.coat}
        position={[0, 1.68, 0.36]}
        rotation={[0.28, 0, 0]}
        scale={[1, 1, 0.92]}
        castShadow
      />
      <mesh
        geometry={SPHERE}
        material={materials.coatLight}
        position={[0, 1.56, 0.63]}
        scale={[0.16, 0.18, 0.12]}
      />

      {/* Cabeza */}
      <group ref={head} position={[0, 2.06, 0.55]} scale={0.95}>
        <mesh geometry={SPHERE} material={materials.coat} scale={[0.57, 0.55, 0.53]} castShadow />
        <mesh
          geometry={SPHERE}
          material={materials.coat}
          position={[-0.29, -0.07, 0.2]}
          scale={[0.25, 0.23, 0.24]}
        />
        <mesh
          geometry={SPHERE}
          material={materials.coat}
          position={[0.29, -0.07, 0.2]}
          scale={[0.25, 0.23, 0.24]}
        />
        <mesh
          geometry={SPHERE}
          material={materials.coatLight}
          position={[0, -0.16, 0.45]}
          scale={[0.275, 0.215, 0.24]}
          castShadow
        />
        <mesh
          geometry={SPHERE}
          material={materials.coatLight}
          position={[0, -0.285, 0.435]}
          scale={[0.15, 0.09, 0.13]}
        />

        {/* Nariz y sonrisa */}
        <mesh
          geometry={SPHERE}
          material={materials.line}
          position={[-0.082, -0.1, 0.662]}
          scale={[0.02, 0.014, 0.01]}
        />
        <mesh
          geometry={SPHERE}
          material={materials.line}
          position={[0.082, -0.1, 0.662]}
          scale={[0.02, 0.014, 0.01]}
        />
        <mesh
          geometry={SPHERE}
          material={materials.shine}
          position={[0, -0.087, 0.674]}
          scale={[0.012, 0.006, 0.004]}
        />
        <mesh
          geometry={MOUTH}
          material={materials.line}
          position={[0, -0.205, 0.668]}
          rotation={[0, 0, Math.PI]}
          scale={[0.95, 0.68, 1]}
        />

        {/* Mejillas */}
        <mesh
          geometry={SPHERE}
          material={materials.blush}
          position={[-0.345, -0.07, 0.44]}
          rotation={[0, -0.55, 0.1]}
          scale={[0.115, 0.062, 0.014]}
        />
        <mesh
          geometry={SPHERE}
          material={materials.blush}
          position={[0.345, -0.07, 0.44]}
          rotation={[0, 0.55, -0.1]}
          scale={[0.115, 0.062, 0.014]}
        />

        {/* Ojos */}
        <group ref={eyeLeft} position={[-0.225, 0.055, 0.448]} rotation={[0, -0.2, 0]}>
          <mesh geometry={SPHERE} material={materials.eyeWhite} scale={[0.165, 0.205, 0.062]} />
          <group ref={irisLeft} position={[0, 0, 0.04]}>
            <mesh geometry={SPHERE} material={materials.iris} scale={[0.148, 0.188, 0.03]} />
            <mesh
              geometry={SPHERE}
              material={materials.pupil}
              position={[0, -0.008, 0.032]}
              scale={[0.072, 0.1, 0.016]}
            />
            <mesh
              geometry={SPHERE}
              material={materials.shine}
              position={[-0.04, 0.058, 0.05]}
              scale={[0.048, 0.054, 0.014]}
            />
            <mesh
              geometry={SPHERE}
              material={materials.shine}
              position={[0.038, -0.048, 0.052]}
              scale={[0.021, 0.026, 0.01]}
            />
          </group>
        </group>
        <group ref={eyeRight} position={[0.225, 0.055, 0.448]} rotation={[0, 0.2, 0]}>
          <mesh geometry={SPHERE} material={materials.eyeWhite} scale={[0.165, 0.205, 0.062]} />
          <group ref={irisRight} position={[0, 0, 0.04]}>
            <mesh geometry={SPHERE} material={materials.iris} scale={[0.148, 0.188, 0.03]} />
            <mesh
              geometry={SPHERE}
              material={materials.pupil}
              position={[0, -0.008, 0.032]}
              scale={[0.072, 0.1, 0.016]}
            />
            <mesh
              geometry={SPHERE}
              material={materials.shine}
              position={[-0.04, 0.058, 0.05]}
              scale={[0.048, 0.054, 0.014]}
            />
            <mesh
              geometry={SPHERE}
              material={materials.shine}
              position={[0.038, -0.048, 0.052]}
              scale={[0.021, 0.026, 0.01]}
            />
          </group>
        </group>

        {/* Delineado y pestañas */}
        {[-1, 1].map((side) => (
          <group key={`lid-${side}`} position={[side * 0.225, 0.055, 0.49]} rotation={[0, side * 0.2, 0]}>
            <mesh
              geometry={EYELINER}
              material={materials.line}
              position={[0, -0.008, 0.026]}
              rotation={[0, 0, Math.PI * 0.03]}
              scale={[0.16, 0.2, 0.5]}
            />
            {[
              { x: 0.1226, y: 0.1286, rot: 0.98, scale: 1.05 },
              { x: 0.0676, y: 0.1813, rot: 0.53, scale: 0.75 },
            ].map((lash) => (
              <mesh
                key={lash.x}
                geometry={LASH}
                material={materials.line}
                position={[side * lash.x, lash.y, 0.02]}
                rotation={[0, 0, -side * lash.rot]}
                scale={[0.9, lash.scale, 0.9]}
              />
            ))}
          </group>
        ))}

        {/* Orejas */}
        <group ref={earLeft} position={[-0.33, 0.45, -0.01]} rotation={[-0.12, 0, 0.34]}>
          <mesh geometry={SPHERE} material={materials.coat} scale={[0.135, 0.26, 0.09]} castShadow />
          <mesh
            geometry={SPHERE}
            material={materials.innerEar}
            position={[0, -0.01, 0.052]}
            scale={[0.074, 0.152, 0.028]}
          />
        </group>
        <group ref={earRight} position={[0.33, 0.45, -0.01]} rotation={[-0.12, 0, -0.34]}>
          <mesh geometry={SPHERE} material={materials.coat} scale={[0.135, 0.26, 0.09]} castShadow />
          <mesh
            geometry={SPHERE}
            material={materials.innerEar}
            position={[0, -0.01, 0.052]}
            scale={[0.074, 0.152, 0.028]}
          />
        </group>

        {/* Cuerno de alicornio */}
        <group position={[0, 0.76, 0.2]} rotation={[0.12, 0, 0]}>
          <mesh geometry={HORN} material={materials.horn} castShadow />
          {[
            [-0.2, 0.082],
            [-0.04, 0.055],
            [0.12, 0.03],
          ].map(([y, radius]) => (
            <mesh
              key={y}
              geometry={HORN_RING}
              material={materials.gold}
              position={[0, y, 0]}
              scale={radius}
              rotation={[Math.PI / 2, 0, 0]}
            />
          ))}
          <mesh
            geometry={STAR}
            material={materials.gold}
            position={[0, 0.36, 0]}
            scale={[0.045, 0.045, 0.045]}
          />
          <pointLight
            ref={hornLight}
            position={[0, 0.36, 0]}
            color="#ffd8a0"
            intensity={1.2}
            distance={3}
            decay={2}
          />
        </group>

        {/* Pequeño sello estelar en la frente */}
        <mesh
          geometry={STAR}
          material={materials.gold}
          position={[0, 0.42, 0.515]}
          scale={[0.045, 0.045, 0.045]}
          rotation={[0, 0, 0.18]}
        />

        {/* Melena */}
        <Mane config={config} materials={materials} />

        {/* Accesorios de la cabeza */}
        <Reveal show={config.accessories.tiara}>
          <Tiara material={materials.gold} gem={materials.gem} />
        </Reveal>
        <Reveal show={config.accessories.bow}>
          <Bow material={materials.bow} gold={materials.gold} />
        </Reveal>
        <Reveal show={config.accessories.flower}>
          <Flower petal={materials.petal} gold={materials.gold} />
        </Reveal>
      </group>

      <Reveal show={config.accessories.necklace}>
        <Necklace material={materials.gold} />
      </Reveal>

      {/* Patas */}
      <Leg hipRef={legFL} kneeRef={kneeFL} position={[-0.3, 0.92, 0.3]} materials={materials} />
      <Leg hipRef={legFR} kneeRef={kneeFR} position={[0.3, 0.92, 0.3]} materials={materials} />
      <Leg
        hipRef={legBL}
        kneeRef={kneeBL}
        position={[-0.34, 0.92, -0.32]}
        materials={materials}
        back
      />
      <Leg
        hipRef={legBR}
        kneeRef={kneeBR}
        position={[0.34, 0.92, -0.32]}
        materials={materials}
        back
      />

      <HeartBurst trigger={petKey} material={materials.heart} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

function smoothstep(min, max, value) {
  const x = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1)
  return x * x * (3 - 2 * x)
}

function easeOutBack(x) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
