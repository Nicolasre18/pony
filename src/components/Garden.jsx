import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'

const SPHERE = new THREE.SphereGeometry(1, 20, 16)
const OCTA = new THREE.OctahedronGeometry(1, 0)
const STEM = new THREE.CylinderGeometry(0.012, 0.02, 1, 6)
const PETAL = new THREE.SphereGeometry(1, 10, 8)
const LEAF = new THREE.SphereGeometry(1, 8, 6)
const GRASS = new THREE.ConeGeometry(0.032, 0.3, 5)
const STONE = new THREE.CylinderGeometry(1, 0.9, 1, 18)

const FLOWER_COLORS = ['#ff9ecb', '#ffbedd', '#c3a4ff', '#a6d9ff', '#ffd36b', '#ffb08f']
const GRASS_COLORS = ['#7fcea6', '#96dcb8', '#6fc49a']

function mulberry32(seed) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createRadialTexture() {
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
  gradient.addColorStop(0, 'rgba(255, 244, 255, 0.9)')
  gradient.addColorStop(0.35, 'rgba(255, 207, 244, 0.4)')
  gradient.addColorStop(0.7, 'rgba(203, 232, 255, 0.14)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/* ------------------------------------------------------------------ */
/* Jardín                                                              */
/* ------------------------------------------------------------------ */

function Island() {
  return (
    <group>
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <cylinderGeometry args={[3.35, 3.18, 0.42, 72]} />
        <meshStandardMaterial color="#b9e9d0" roughness={0.88} />
      </mesh>
      <mesh position={[0, -0.52, 0]} receiveShadow>
        <cylinderGeometry args={[3.18, 2.8, 0.5, 64]} />
        <meshStandardMaterial color="#c3a9e3" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.81, 0]}>
        <cylinderGeometry args={[2.8, 2.25, 0.34, 56]} />
        <meshStandardMaterial color="#9f82cc" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.34, 72]} />
        <meshStandardMaterial color="#c9f2dc" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.24, 3.38, 72]} />
        <meshStandardMaterial color="#f2fff9" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Flowers({ count }) {
  const stems = useRef()
  const petals = useRef()
  const centers = useRef()
  const leaves = useRef()

  const flowers = useMemo(() => {
    const random = mulberry32(20260214)
    return Array.from({ length: count }, () => {
      const angle = random() * Math.PI * 2
      const radius = 1.85 + random() * 1.35
      const scale = 0.75 + random() * 0.55
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        height: (0.28 + random() * 0.22) * scale,
        scale,
        rotation: random() * Math.PI * 2,
        color: FLOWER_COLORS[Math.floor(random() * FLOWER_COLORS.length)],
        leafSide: random() > 0.5 ? 1 : -1,
      }
    })
  }, [count])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    flowers.forEach((flower, index) => {
      // Tallo
      dummy.position.set(flower.x, flower.height / 2, flower.z)
      dummy.rotation.set(0, flower.rotation, 0)
      dummy.scale.set(flower.scale, flower.height, flower.scale)
      dummy.updateMatrix()
      stems.current.setMatrixAt(index, dummy.matrix)

      // Hoja
      dummy.position.set(
        flower.x + flower.leafSide * 0.065 * flower.scale,
        flower.height * 0.4,
        flower.z,
      )
      dummy.rotation.set(0.2, flower.rotation, flower.leafSide * 0.9)
      dummy.scale.set(0.1 * flower.scale, 0.025 * flower.scale, 0.05 * flower.scale)
      dummy.updateMatrix()
      leaves.current.setMatrixAt(index, dummy.matrix)

      // Pétalos
      for (let petal = 0; petal < 5; petal += 1) {
        const petalAngle = flower.rotation + (petal / 5) * Math.PI * 2
        dummy.position.set(
          flower.x + Math.cos(petalAngle) * 0.075 * flower.scale,
          flower.height,
          flower.z + Math.sin(petalAngle) * 0.075 * flower.scale,
        )
        dummy.rotation.set(0, -petalAngle, 0)
        dummy.scale.set(0.075 * flower.scale, 0.026 * flower.scale, 0.05 * flower.scale)
        dummy.updateMatrix()
        petals.current.setMatrixAt(index * 5 + petal, dummy.matrix)
        petals.current.setColorAt(
          index * 5 + petal,
          color.set(flower.color),
        )
      }

      // Centro
      dummy.position.set(flower.x, flower.height + 0.035, flower.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(0.043 * flower.scale)
      dummy.updateMatrix()
      centers.current.setMatrixAt(index, dummy.matrix)
    })

    stems.current.instanceMatrix.needsUpdate = true
    petals.current.instanceMatrix.needsUpdate = true
    centers.current.instanceMatrix.needsUpdate = true
    leaves.current.instanceMatrix.needsUpdate = true
    if (petals.current.instanceColor) petals.current.instanceColor.needsUpdate = true
  }, [flowers])

  return (
    <group>
      <instancedMesh ref={stems} args={[STEM, undefined, count]}>
        <meshStandardMaterial color="#6cc394" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[LEAF, undefined, count]}>
        <meshStandardMaterial color="#82d4a6" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={petals} args={[PETAL, undefined, count * 5]}>
        <meshStandardMaterial color="#ffffff" roughness={0.42} />
      </instancedMesh>
      <instancedMesh ref={centers} args={[SPHERE, undefined, count]}>
        <meshStandardMaterial
          color="#ffd873"
          emissive="#ffb84d"
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </instancedMesh>
    </group>
  )
}

function Grass({ count }) {
  const mesh = useRef()

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    const random = mulberry32(771)
    const color = new THREE.Color()
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2
      const radius = 1.45 + random() * 1.9
      const height = 0.55 + random() * 0.8
      dummy.position.set(Math.cos(angle) * radius, 0.13 * height, Math.sin(angle) * radius)
      dummy.rotation.set((random() - 0.5) * 0.35, random() * Math.PI, (random() - 0.5) * 0.35)
      dummy.scale.set(1, height, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
      mesh.current.setColorAt(i, color.set(GRASS_COLORS[i % GRASS_COLORS.length]))
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [count])

  return (
    <instancedMesh ref={mesh} args={[GRASS, undefined, count]} receiveShadow>
      <meshStandardMaterial color="#ffffff" roughness={0.9} />
    </instancedMesh>
  )
}

const BUSHES = [
  { position: [-2.6, 0, -0.55], scale: 1.05, rotation: 0.4 },
  { position: [2.62, 0, 1.5], scale: 0.85, rotation: 1.6 },
  { position: [-1.2, 0, -2.55], scale: 0.9, rotation: 2.4 },
  { position: [2.05, 0, -2.25], scale: 0.75, rotation: 0.9 },
]

function Bush({ data }) {
  return (
    <group position={data.position} scale={data.scale} rotation={[0, data.rotation, 0]}>
      {[
        [0, 0.18, 0, 0.34, 0.26, 0.3],
        [-0.24, 0.12, 0.04, 0.24, 0.19, 0.22],
        [0.22, 0.13, -0.02, 0.26, 0.21, 0.24],
        [0.02, 0.3, -0.1, 0.23, 0.19, 0.22],
      ].map((blob, index) => (
        <mesh
          key={index}
          geometry={SPHERE}
          position={[blob[0], blob[1], blob[2]]}
          scale={[blob[3], blob[4], blob[5]]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={index % 2 ? '#71c69b' : '#67bd92'}
            roughness={0.85}
          />
        </mesh>
      ))}
      <mesh geometry={SPHERE} position={[0.16, 0.41, 0.08]} scale={0.035}>
        <meshStandardMaterial color="#ffd9ee" roughness={0.5} />
      </mesh>
      <mesh geometry={SPHERE} position={[-0.18, 0.34, 0.18]} scale={0.028}>
        <meshStandardMaterial color="#fff0b8" roughness={0.5} />
      </mesh>
    </group>
  )
}

function Bushes() {
  return (
    <group>
      {BUSHES.map((data, index) => (
        <Bush key={index} data={data} />
      ))}
    </group>
  )
}

const MUSHROOMS = [
  { position: [-2.35, 0, 1.05], scale: 1, color: '#ffb6d5' },
  { position: [2.45, 0, 0.9], scale: 0.8, color: '#d9b8ff' },
  { position: [1.95, 0, -2.1], scale: 1.15, color: '#ffc7de' },
  { position: [-1.5, 0, -2.35], scale: 0.9, color: '#c9dcff' },
  { position: [2.85, 0, -0.4], scale: 0.65, color: '#ffd2e8' },
]

function Mushroom({ data }) {
  const { position, scale, color } = data
  return (
    <group position={position} scale={scale} rotation={[0, data.position[0] * 0.7, 0]}>
      <mesh position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.065, 0.22, 12]} />
        <meshStandardMaterial color="#fff4e9" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 0]} scale={[0.16, 0.1, 0.16]} castShadow>
        <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      {[
        [0.05, 0.31, 0.08],
        [-0.06, 0.3, 0.06],
        [0.01, 0.32, -0.09],
      ].map((dot, index) => (
        <mesh key={index} position={dot} scale={0.018}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#fff8fd" roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Mushrooms() {
  return (
    <group>
      {MUSHROOMS.map((mushroom, index) => (
        <Mushroom key={index} data={mushroom} />
      ))}
    </group>
  )
}

const CRYSTALS = [
  { position: [-2.55, 0, -1.55], colors: ['#b9e5ff', '#d8c2ff', '#a9f0e1'] },
  { position: [2.5, 0, -1.35], colors: ['#ffc6e5', '#d9b8ff', '#ffe6a8'] },
  { position: [0.9, 0, -2.85], colors: ['#c4f4ff', '#ffd6f4', '#cbb9ff'] },
]

function CrystalCluster({ data, index }) {
  const group = useRef()
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.rotation.y = Math.sin(t * 0.3 + index) * 0.08
    group.current.position.y = Math.sin(t * 0.8 + index) * 0.015
  })

  return (
    <group ref={group} position={data.position}>
      {data.colors.map((color, crystalIndex) => {
        const height = 0.38 + crystalIndex * 0.14
        return (
          <mesh
            key={crystalIndex}
            geometry={OCTA}
            position={[
              (crystalIndex - 1) * 0.12,
              height / 2 + 0.05,
              (crystalIndex % 2 === 0 ? 1 : -1) * 0.05,
            ]}
            rotation={[0.08, crystalIndex * 0.6, (crystalIndex - 1) * 0.15]}
            scale={[0.085, height, 0.085]}
            castShadow
          >
            <meshPhysicalMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.9}
              roughness={0.12}
              metalness={0.15}
              clearcoat={1}
              iridescence={0.6}
            />
          </mesh>
        )
      })}
      <mesh position={[0, 0.02, 0]} scale={[0.34, 0.07, 0.26]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#f6efff" roughness={0.8} />
      </mesh>
      {index < 2 ? (
        <pointLight
          position={[0, 0.6, 0]}
          color={data.colors[0]}
          intensity={4}
          distance={3.2}
          decay={2}
        />
      ) : null}
    </group>
  )
}

function Crystals() {
  return (
    <group>
      {CRYSTALS.map((data, index) => (
        <CrystalCluster key={index} data={data} index={index} />
      ))}
    </group>
  )
}

function Rainbow() {
  const arcs = ['#ffc4e1', '#ffd8c4', '#fff1b8', '#c9f5df', '#c4e6ff', '#d8c7ff']
  return (
    <group position={[0, 0.2, -5.9]}>
      {arcs.map((color, index) => (
        <mesh key={color} scale={4.4 - index * 0.13}>
          <torusGeometry args={[1, 0.032, 8, 96, Math.PI]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.34}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

const CLOUD_DATA = [
  { position: [-3.8, 3.6, -4.4], scale: 1.15, speed: 0.7 },
  { position: [3.4, 4.1, -3.8], scale: 0.9, speed: 1 },
  { position: [4.8, 2.9, -1.8], scale: 0.65, speed: 1.25 },
  { position: [-4.6, 2.7, -2.2], scale: 0.7, speed: 0.9 },
  { position: [0.9, 5.5, -5.6], scale: 1.2, speed: 0.55 },
]

function Cloud({ data }) {
  const group = useRef()
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.position.x = data.position[0] + Math.sin(t * 0.09 * data.speed) * 0.5
    group.current.position.y = data.position[1] + Math.sin(t * 0.22 * data.speed + 1) * 0.16
  })

  return (
    <group ref={group} position={data.position} scale={data.scale}>
      {[
        [0, 0, 0, 0.9, 0.55, 0.65],
        [-0.65, 0.02, 0.04, 0.6, 0.42, 0.5],
        [0.68, 0.05, 0.02, 0.58, 0.4, 0.48],
        [-0.22, 0.34, 0.02, 0.56, 0.45, 0.5],
        [0.34, 0.32, 0.06, 0.5, 0.42, 0.45],
        [0, 0.12, 0.35, 0.58, 0.36, 0.35],
      ].map((blob, index) => (
        <mesh
          key={index}
          geometry={SPHERE}
          material={material}
          position={[blob[0], blob[1], blob[2]]}
          scale={[blob[3], blob[4], blob[5]]}
        />
      ))}
    </group>
  )
}

function Clouds() {
  return (
    <group>
      {CLOUD_DATA.map((data, index) => (
        <Float key={index} speed={0.5 + index * 0.1} rotationIntensity={0} floatIntensity={0.35}>
          <Cloud data={data} />
        </Float>
      ))}
    </group>
  )
}

const BUTTERFLY_COLORS = [
  ['#ffabd4', '#ffd4ea'],
  ['#c4b0ff', '#e8ddff'],
  ['#a9e3ff', '#d9f5ff'],
]

function Butterfly({ index }) {
  const group = useRef()
  const leftWing = useRef()
  const rightWing = useRef()
  const color = BUTTERFLY_COLORS[index % BUTTERFLY_COLORS.length]
  const seed = index * 2.7 + 0.6

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!group.current) return
    group.current.position.set(
      Math.sin(t * 0.35 + seed) * 2.8,
      1.5 + Math.sin(t * 0.9 + seed) * 0.3 + index * 0.16,
      Math.cos(t * 0.3 + seed) * 1.1 - 1.5,
    )
    group.current.rotation.y = Math.sin(t * 0.35 + seed) * 0.7
    const flap = Math.sin(t * 13 + seed) * 0.75
    if (leftWing.current) leftWing.current.rotation.z = 0.3 + flap
    if (rightWing.current) rightWing.current.rotation.z = -0.3 - flap
  })

  return (
    <group ref={group} scale={0.7}>
      <mesh position={[0, 0, 0]} scale={[0.025, 0.16, 0.025]} castShadow>
        <capsuleGeometry args={[1, 1.1, 4, 8]} />
        <meshStandardMaterial color="#8e6bb0" roughness={0.4} />
      </mesh>
      <group ref={leftWing} position={[-0.02, 0.03, 0]}>
        <mesh position={[-0.18, 0, 0]} scale={[0.2, 0.12, 0.035]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshPhysicalMaterial
            color={color[0]}
            roughness={0.25}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            emissive={color[0]}
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[-0.12, -0.12, 0]} scale={[0.13, 0.09, 0.03]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshPhysicalMaterial
            color={color[1]}
            roughness={0.25}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group ref={rightWing} position={[0.02, 0.03, 0]}>
        <mesh position={[0.18, 0, 0]} scale={[0.2, 0.12, 0.035]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshPhysicalMaterial
            color={color[0]}
            roughness={0.25}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            emissive={color[0]}
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[0.12, -0.12, 0]} scale={[0.13, 0.09, 0.03]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshPhysicalMaterial
            color={color[1]}
            roughness={0.25}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  )
}

function Butterflies({ count }) {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <Butterfly key={index} index={index} />
      ))}
    </group>
  )
}

function MagicStage() {
  const texture = useMemo(() => createRadialTexture(), [])
  const glow = useRef()

  useFrame(({ clock }) => {
    if (glow.current) {
      glow.current.material.opacity = 0.42 + Math.sin(clock.elapsedTime * 1.2) * 0.08
    }
  })

  const stones = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const t = index / 6
      return {
        x: Math.sin(t * Math.PI) * 0.5 + 0.1,
        z: 2.85 - t * 1.65,
        scale: 0.24 - t * 0.05,
        rotation: t * 2.4,
      }
    })
  }, [])

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.018, 0]}
        geometry={new THREE.PlaneGeometry(4.2, 3.4)}
        scale={1}
      >
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh
        ref={glow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.022, 0]}
      >
        <ringGeometry args={[1.55, 1.6, 96]} />
        <meshBasicMaterial color="#fff1ff" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
        <ringGeometry args={[2.05, 2.075, 96]} />
        <meshBasicMaterial color="#ffd6f6" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 1.82, 0.05, Math.sin(angle) * 1.82]}
            scale={0.022}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#fff5ff" />
          </mesh>
        )
      })}
      {stones.map((stone, index) => (
        <mesh
          key={index}
          geometry={STONE}
          position={[stone.x, 0.015, stone.z]}
          scale={[stone.scale, 0.035, stone.scale * 0.78]}
          rotation={[0, stone.rotation, 0]}
          receiveShadow
        >
          <meshStandardMaterial color={index % 2 ? '#f4e9ff' : '#ffeaf7'} roughness={0.75} />
        </mesh>
      ))}
    </group>
  )
}

export default function Garden({ isMobile }) {
  return (
    <group>
      <Island />
      <MagicStage />
      <Grass count={isMobile ? 50 : 95} />
      <Flowers count={isMobile ? 16 : 26} />
      <Bushes />
      <Mushrooms />
      <Crystals />
      <Rainbow />
      <Clouds />
      <Butterflies count={isMobile ? 2 : 3} />
    </group>
  )
}
