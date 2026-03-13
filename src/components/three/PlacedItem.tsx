import { useRef, useState, useLayoutEffect, useEffect } from 'react'
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
  gizmoDraggingRef: React.MutableRefObject<boolean>
}

function effectiveDims(gridW: number, gridD: number, rotation: 0 | 90 | 180 | 270): [number, number] {
  return (rotation === 90 || rotation === 270)
    ? [gridD * GRID_UNIT, gridW * GRID_UNIT]
    : [gridW * GRID_UNIT, gridD * GRID_UNIT]
}

export default function PlacedItem({ placement, orbitRef, gizmoDraggingRef }: Props) {
  const selectedId = usePlannerStore(s => s.selectedId)
  const heldItem = usePlannerStore(s => s.heldItem)
  const selectPlacement = usePlannerStore(s => s.selectPlacement)
  const movePlacement = usePlannerStore(s => s.movePlacement)
  const duplicatePlacement = usePlannerStore(s => s.duplicatePlacement)

  const profile = getProfile(placement.profileId)
  if (!profile) return null

  const isSelected = selectedId === placement.id

  const groupRef = useRef<THREE.Group>(null)
  const tcRef = useRef<TransformControlsImpl>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragValid, setDragValid] = useState(true)

  // workingPos: non-null when item was dropped at an invalid position (red ghost, still selected)
  const [workingPos, setWorkingPos] = useState<[number, number, number] | null>(null)
  const [workingValid] = useState(false)

  // Refs for values read inside event callbacks — avoids stale closures
  const dragValidRef = useRef(true)
  const dragSnappedPosRef = useRef<[number, number, number]>([...placement.position])
  const shiftHeldRef = useRef(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeldRef.current = true }
    const up   = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeldRef.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Keep the THREE.Group position in sync with placement.position (or workingPos) when not dragging
  const [px, py, pz] = placement.position
  useLayoutEffect(() => {
    if (!groupRef.current || isDragging) return
    const [wx, wy, wz] = workingPos ?? placement.position
    groupRef.current.position.set(wx, wy, wz)
  }, [px, py, pz, isDragging, workingPos])

  // When deselected while holding an invalid workingPos, revert to committed position
  useEffect(() => {
    if (!isSelected && workingPos !== null) {
      setWorkingPos(null)
      if (groupRef.current) {
        groupRef.current.position.set(px, py, pz)
      }
    }
  }, [isSelected])

  function handleClick() {
    if (heldItem) return
    if (gizmoDraggingRef.current) return
    selectPlacement(isSelected ? null : placement.id)
  }

  function handleDragStart() {
    setIsDragging(true)
    setWorkingPos(null)
    gizmoDraggingRef.current = true
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
    if (orbitRef.current) orbitRef.current.enabled = true

    // Delay clearing gizmoDraggingRef so ground click handler fires first
    setTimeout(() => { gizmoDraggingRef.current = false }, 50)

    const snapped = dragSnappedPosRef.current
    const [ox, oy, oz] = placement.position
    const moved =
      Math.abs(snapped[0] - ox) > 0.5 ||
      Math.abs(snapped[1] - oy) > 0.5 ||
      Math.abs(snapped[2] - oz) > 0.5

    if (dragValidRef.current && moved) {
      if (shiftHeldRef.current) {
        duplicatePlacement(placement.id, snapped, placement.rotation)
      } else {
        movePlacement(placement.id, snapped)
      }
      setWorkingPos(null)
    } else if (!dragValidRef.current) {
      setWorkingPos(snapped)
    } else {
      if (groupRef.current) groupRef.current.position.set(ox, oy, oz)
    }
  }

  const showAsGhost = isDragging || workingPos !== null
  const ghostValid = isDragging ? dragValid : workingValid

  return (
    <>
      <group ref={groupRef}>
        <DrawerFrame
          profile={profile}
          position={[0, 0, 0]}
          rotation={placement.rotation}
          selected={isSelected && !isDragging && workingPos === null}
          ghost={showAsGhost}
          valid={ghostValid}
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
