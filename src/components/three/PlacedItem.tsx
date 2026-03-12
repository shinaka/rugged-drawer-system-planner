import { useRef, useState, useLayoutEffect } from 'react'
import { TransformControls } from '@react-three/drei'
import type { TransformControls as TransformControlsImpl } from 'three-stdlib'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { usePlannerStore } from '../../store/plannerStore'
import { getProfile } from '../../data/drawerCatalog'
import { snapToGrid, xzOverlaps, GRID_UNIT } from '../../utils/grid'
import DrawerFrame from './DrawerFrame'
import type { Placement } from '../../types'

interface Props {
  placement: Placement
  orbitRef: React.RefObject<OrbitControlsImpl>
}

function effectiveDims(gridW: number, gridD: number, rotation: 0 | 90 | 180 | 270): [number, number] {
  return (rotation === 90 || rotation === 270)
    ? [gridD * GRID_UNIT, gridW * GRID_UNIT]
    : [gridW * GRID_UNIT, gridD * GRID_UNIT]
}

export default function PlacedItem({ placement, orbitRef }: Props) {
  const selectedId = usePlannerStore(s => s.selectedId)
  const heldItem = usePlannerStore(s => s.heldItem)
  const selectPlacement = usePlannerStore(s => s.selectPlacement)
  const movePlacement = usePlannerStore(s => s.movePlacement)

  const profile = getProfile(placement.profileId)
  if (!profile) return null

  const isSelected = selectedId === placement.id

  const groupRef = useRef<THREE.Group>(null)
  const tcRef = useRef<TransformControlsImpl>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragValid, setDragValid] = useState(true)

  // Refs for values read inside event callbacks — avoids stale closures
  const dragValidRef = useRef(true)
  const dragSnappedPosRef = useRef<[number, number, number]>([...placement.position])
  const justDraggedRef = useRef(false)

  // Keep the THREE.Group position in sync with placement.position when not dragging
  const [px, py, pz] = placement.position
  useLayoutEffect(() => {
    if (!groupRef.current || isDragging) return
    groupRef.current.position.set(px, py, pz)
  }, [px, py, pz, isDragging])

  function handleClick() {
    if (heldItem) return
    // Swallow the synthetic click that fires after a drag release
    if (justDraggedRef.current) { justDraggedRef.current = false; return }
    selectPlacement(isSelected ? null : placement.id)
  }

  function handleDragStart() {
    setIsDragging(true)
    if (orbitRef.current) orbitRef.current.enabled = false
  }

  function handleObjectChange() {
    if (!groupRef.current || !profile) return
    const pos = groupRef.current.position
    const { placements } = usePlannerStore.getState()

    const [heldW, heldD] = effectiveDims(profile.gridWidth, profile.gridDepth, placement.rotation)
    const heldH = profile.heightMm

    // Snap XZ to grid (center-aligned on item footprint)
    const snappedX = snapToGrid(pos.x - heldW / 2) + heldW / 2
    const snappedZ = snapToGrid(pos.z - heldD / 2) + heldD / 2

    // Candidate Y floors: ground + top of every XZ-overlapping item
    const candidateYs: number[] = [0]
    for (const p of placements) {
      if (p.id === placement.id) continue
      const prof = getProfile(p.profileId)
      if (!prof) continue
      const [pw, pd] = effectiveDims(prof.gridWidth, prof.gridDepth, p.rotation)
      if (xzOverlaps(snappedX, snappedZ, heldW, heldD, p.position[0], p.position[2], pw, pd)) {
        candidateYs.push(p.position[1] + prof.heightMm)
      }
    }

    // Snap Y to nearest candidate floor (allows explicit height selection)
    let snappedY = 0
    let minDist = Infinity
    for (const cy of candidateYs) {
      const dist = Math.abs(pos.y - cy)
      if (dist < minDist) { minDist = dist; snappedY = cy }
    }

    // Validate: no collision at snapped position
    const eps = 0.1
    const collides = placements.some(p => {
      if (p.id === placement.id) return false
      const prof = getProfile(p.profileId)
      if (!prof) return false
      const [pw, pd] = effectiveDims(prof.gridWidth, prof.gridDepth, p.rotation)
      if (!xzOverlaps(snappedX, snappedZ, heldW, heldD, p.position[0], p.position[2], pw, pd)) return false
      return snappedY < p.position[1] + prof.heightMm - eps && snappedY + heldH > p.position[1] + eps
    })

    // Write snapped position back so the gizmo visually snaps too
    groupRef.current.position.set(snappedX, snappedY, snappedZ)

    dragSnappedPosRef.current = [snappedX, snappedY, snappedZ]
    dragValidRef.current = !collides
    setDragValid(!collides)
  }

  function handleDragEnd() {
    setIsDragging(false)
    justDraggedRef.current = true
    if (orbitRef.current) orbitRef.current.enabled = true

    const snapped = dragSnappedPosRef.current
    const [ox, oy, oz] = placement.position
    const moved =
      Math.abs(snapped[0] - ox) > 0.5 ||
      Math.abs(snapped[1] - oy) > 0.5 ||
      Math.abs(snapped[2] - oz) > 0.5

    if (dragValidRef.current && moved) {
      movePlacement(placement.id, snapped)
    } else if (groupRef.current) {
      groupRef.current.position.set(ox, oy, oz)
    }
  }

  return (
    <>
      <group ref={groupRef}>
        <DrawerFrame
          profile={profile}
          position={[0, 0, 0]}
          rotation={placement.rotation}
          selected={isSelected && !isDragging}
          ghost={isDragging}
          valid={dragValid}
          onClick={handleClick}
        />
      </group>

      {isSelected && !heldItem && groupRef.current && (
        <TransformControls
          ref={tcRef}
          object={groupRef.current}
          mode="translate"
          onObjectChange={handleObjectChange}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
        />
      )}
    </>
  )
}
