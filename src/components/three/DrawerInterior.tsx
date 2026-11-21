import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import * as THREE from 'three'

interface BoxProps {
  size: [number, number, number]
  position: [number, number, number]
  color?: string
}

function Wall({ size, position, color = '#3e3f46' }: BoxProps) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

interface FrameProps {
  width: number
  height: number
  depth: number
  columns: number
  rows: number
}

export function FrameShell({ width: w, height: h, depth: d, columns, rows }: FrameProps) {
  return (
    <group>
      <Wall size={[2, h - 2, d - 2]} position={[-w / 2 + 2, 0, 0]} />
      <Wall size={[2, h - 2, d - 2]} position={[w / 2 - 2, 0, 0]} />
      <Wall size={[w - 6, 2, d - 2]} position={[0, -h / 2 + 2, 0]} />
      <Wall size={[w - 6, 2, d - 2]} position={[0, h / 2 - 2, 0]} />
      <Wall size={[w - 6, h - 6, 2]} position={[0, 0, -d / 2 + 2]} />
      {Array.from({ length: columns - 1 }, (_, i) => (
        <Wall key={`column-${i}`} size={[3, h - 6, d - 4]} position={[-w / 2 + (i + 1) * w / columns, 0, 0]} />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <Wall key={`row-${i}`} size={[w - 6, 3, d - 4]} position={[0, -h / 2 + (i + 1) * h / rows, 0]} />
      ))}
    </group>
  )
}

interface DrawerProps {
  width: number
  height: number
  depth: number
  x: number
  y: number
  open: boolean
  ghost: boolean
  texture: THREE.Texture
  children: ReactNode
  onToggle?: () => void
}

export function SlidingDrawer({ width, height, depth, x, y, open, ghost, texture, children, onToggle }: DrawerProps) {
  const group = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()
  const interactive = !!onToggle && !ghost
  useCursor(hovered && interactive, 'pointer', 'auto', gl.domElement)
  const w = width - 8
  const h = height - 6
  const d = depth - 4
  const frontZ = depth / 2 - 1

  useFrame((_, delta) => {
    if (group.current) {
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, open && !ghost ? d * 0.85 : 0, 12, delta)
    }
  })

  return (
    <group position={[x, y, 0]}>
      <group ref={group} name="sliding-drawer">
        {!ghost && (
          <>
            <Wall size={[w, 2, d]} position={[0, -h / 2 + 1, 0]} color="#737985" />
            <Wall size={[2, h - 2, d]} position={[-w / 2 + 1, 1, 0]} color="#737985" />
            <Wall size={[2, h - 2, d]} position={[w / 2 - 1, 1, 0]} color="#737985" />
            <Wall size={[w - 4, h - 2, 2]} position={[0, 1, -d / 2 + 1]} color="#737985" />
          </>
        )}
        <group
          onClick={interactive ? e => {
            e.stopPropagation()
            if (e.button === 0 && e.delta <= 3) onToggle?.()
          } : undefined}
          onPointerOver={interactive ? e => { e.stopPropagation(); setHovered(true) } : undefined}
          onPointerOut={() => setHovered(false)}
        >
          {!ghost && (
            <mesh name="drawer-front" position={[0, 0, frontZ]} castShadow receiveShadow>
              <boxGeometry args={[width - 6, h, 2]} />
              <meshStandardMaterial
                map={texture} roughness={0.88} metalness={0.06}
                emissive={hovered && interactive ? '#3b82f6' : '#000000'}
                emissiveIntensity={0.6}
              />
            </mesh>
          )}
          {children}
        </group>
      </group>
    </group>
  )
}
