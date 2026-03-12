import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import type { DrawerProfile } from '../../types'
import { GRID_UNIT } from '../../utils/grid'
import * as THREE from 'three'

interface Props {
  profile: DrawerProfile
  position: [number, number, number]
  rotation?: number
  selected?: boolean
  ghost?: boolean
  valid?: boolean
  onClick?: () => void
}

// Shared textures

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function buildMeshTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#22232a'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = '#72738a'
  ctx.lineWidth = 1.5
  const gap = 14
  for (let o = -size; o < size * 2; o += gap) {
    ctx.beginPath(); ctx.moveTo(o, 0); ctx.lineTo(o + size, size); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(o, 0); ctx.lineTo(o - size, size); ctx.stroke()
  }
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function buildTopTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#16161c'
  ctx.fillRect(0, 0, size, size)
  const rim = 5; const r1 = 10
  ctx.fillStyle = '#3e404a'
  roundRect(ctx, rim, rim, size - rim * 2, size - rim * 2, r1)
  ctx.fill()
  const inn = 18; const r2 = 7
  ctx.fillStyle = '#1c1c24'
  roundRect(ctx, inn, inn, size - inn * 2, size - inn * 2, r2)
  ctx.fill()
  ctx.strokeStyle = '#5a5c6a'
  ctx.lineWidth = 1
  roundRect(ctx, rim, rim, size - rim * 2, size - rim * 2, r1)
  ctx.stroke()
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const BASE_MESH_TEX = buildMeshTexture()
const BASE_TOP_TEX = buildTopTexture()

// Drawer cell layout

function getDrawerLayout(profileId: string): { columns: number; rows: number } {
  switch (profileId) {
    case '4x4_mini':    return { columns: 2, rows: 1 }
    case '3x4_mini_2':  return { columns: 2, rows: 1 }
    case '5x6_stacked': return { columns: 2, rows: 2 }
    case '3x5_stacked': return { columns: 2, rows: 2 }
    default:            return { columns: 1, rows: 1 }
  }
}

// Component

export default function DrawerFrame({
  profile,
  position,
  rotation = 0,
  selected = false,
  ghost = false,
  valid = true,
  onClick,
}: Props) {
  const w = profile.gridWidth * GRID_UNIT
  const d = profile.gridDepth * GRID_UNIT
  const h = profile.heightMm
  const centerY = position[1] + h / 2

  const frontTex = useMemo(() => {
    const t = BASE_MESH_TEX.clone()
    t.repeat.set(w / 42, h / 42)
    t.needsUpdate = true
    return t
  }, [w, h])

  const topTex = useMemo(() => {
    const t = BASE_TOP_TEX.clone()
    t.repeat.set(profile.gridWidth, profile.gridDepth)
    t.needsUpdate = true
    return t
  }, [profile.gridWidth, profile.gridDepth])

  const ghostColor = valid ? '#22c55e' : '#ef4444'
  const opacity = ghost ? 0.5 : 1

  // Front face sits at +(d/2 - 1); elements need Z > frontZ to protrude in front
  const frontZ = d / 2 - 1

  // Drawer cell layout
  const { columns, rows } = getDrawerLayout(profile.id)
  const cellW = w / columns
  const cellH = h / rows
  // Notch: narrow cutout flush at the top of each cell
  const cellHandleW = Math.min(cellW - 4, Math.max(8, cellW * 0.42))
  const cellHandleH = Math.max(6, cellH * 0.42)
  const cellHandleBarH = Math.max(3, cellH * 0.1)
  // Position notch flush with the top of the cell (no gap above)
  const notchYOffset = cellH / 2 - cellHandleH / 2 - 1

  const isBaseplate = profile.category === 'baseplate'

  return (
    <group
      position={[position[0], centerY, position[2]]}
      rotation={[0, (rotation * Math.PI) / 180, 0]}
      onClick={onClick ? e => { e.stopPropagation(); onClick() } : undefined}
    >
      {/* ── Main body ── */}
      <RoundedBox
        args={[w - 2, h - 2, d - 2]}
        radius={3}
        smoothness={3}
        castShadow={!ghost}
        receiveShadow={!ghost}
      >
        <meshStandardMaterial
          color={ghost ? ghostColor : '#3e3f46'}
          transparent={ghost}
          opacity={opacity}
          roughness={0.85}
          metalness={0.05}
          side={ghost ? THREE.DoubleSide : THREE.FrontSide}
        />
      </RoundedBox>

      {/* ── Front face: diamond mesh texture ── */}
      {!ghost && (
        <mesh position={[0, 0, frontZ + 0.5]}>
          <planeGeometry args={[w - 6, h - 6]} />
          <meshStandardMaterial map={frontTex} roughness={0.88} metalness={0.06} />
        </mesh>
      )}

      {/* ── Top face: Gridfinity pattern ── */}
      {!ghost && (
        <mesh position={[0, h / 2 - 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w - 4, d - 4]} />
          <meshStandardMaterial map={topTex} roughness={0.70} metalness={0.06} />
        </mesh>
      )}

      {/* ── Cell dividers (multi-drawer layouts only) ── */}
      {!ghost && !isBaseplate && columns > 1 && (
        Array.from({ length: columns - 1 }, (_, i) => (
          <mesh key={`vdiv-${i}`} position={[-w / 2 + (i + 1) * cellW, 0, frontZ + 1]}>
            <boxGeometry args={[3, h - 6, 2]} />
            <meshStandardMaterial color="#0c0c10" roughness={1} metalness={0} />
          </mesh>
        ))
      )}
      {!ghost && !isBaseplate && rows > 1 && (
        Array.from({ length: rows - 1 }, (_, i) => (
          <mesh key={`hdiv-${i}`} position={[0, -h / 2 + (i + 1) * cellH, frontZ + 1]}>
            <boxGeometry args={[w - 6, 3, 2]} />
            <meshStandardMaterial color="#0c0c10" roughness={1} metalness={0} />
          </mesh>
        ))
      )}

      {/* ── Per-cell handle recesses and bars ── */}
      {!isBaseplate && Array.from({ length: columns * rows }, (_, i) => {
        const col = i % columns
        const row = Math.floor(i / columns)
        const cx = -w / 2 + cellW * (col + 0.5)
        const cy = -h / 2 + cellH * (row + 0.5) + notchYOffset
        // Handle bar sits at the bottom edge of the notch
        const barY = -(cellHandleH / 2) + (cellHandleBarH / 2)
        return (
          <group key={`cell-${col}-${row}`} position={[cx, cy, 0]}>
            {/* Recess / notch cutout */}
            {!ghost && (
              <mesh position={[0, 0, frontZ + 2]}>
                <boxGeometry args={[cellHandleW, cellHandleH, 3]} />
                <meshStandardMaterial color="#0a0a0e" roughness={1} metalness={0} />
              </mesh>
            )}
            {/* Orange handle bar — bottom of notch */}
            <group position={[0, ghost ? 0 : barY, ghost ? d / 2 : frontZ + 3.2]}>
              <RoundedBox
                args={[ghost ? cellHandleW * 0.6 : cellHandleW * 0.9, cellHandleBarH, 2.5]}
                radius={cellHandleBarH * 0.45}
                smoothness={3}
              >
                <meshStandardMaterial
                  color="#f97316"
                  transparent={ghost}
                  opacity={ghost ? opacity : 1}
                  roughness={0.35}
                  metalness={0.2}
                />
              </RoundedBox>
            </group>
          </group>
        )
      })}

      {/* ── Ghost top arrow pointing toward front (+Z) ── */}
      {ghost && (
        <mesh position={[0, h / 2 + 0.5, d / 3]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[Math.min(w, d) * 0.08, Math.min(w, d) * 0.14, 3]} />
          <meshStandardMaterial color="#f97316" transparent opacity={opacity} roughness={0.4} />
        </mesh>
      )}

      {/* ── Selection outline ── */}
      {selected && (
        <RoundedBox args={[w + 2, h + 2, d + 2]} radius={3} smoothness={2}>
          <meshBasicMaterial color="#facc15" wireframe />
        </RoundedBox>
      )}
    </group>
  )
}
