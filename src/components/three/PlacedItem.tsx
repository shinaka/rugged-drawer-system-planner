import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
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
  const selectedId        = usePlannerStore(s => s.selectedId)
  const heldItem          = usePlannerStore(s => s.heldItem)
  const movingId          = usePlannerStore(s => s.movingId)
  const pendingCloneId    = usePlannerStore(s => s.pendingCloneId)
  const selectPlacement   = usePlannerStore(s => s.selectPlacement)
  const movePlacement     = usePlannerStore(s => s.movePlacement)
  const clonePlacement    = usePlannerStore(s => s.clonePlacement)
  const removePlacement   = usePlannerStore(s => s.removePlacement)
  const discardPlacement  = usePlannerStore(s => s.discardPlacement)
  const setPendingCloneId = usePlannerStore(s => s.setPendingCloneId)

  const profile        = getProfile(placement.profileId)
  const isSelected     = selectedId === placement.id
  // True while this item is the unconfirmed ghost copy from a shift-drag
  const isPendingClone = placement.id === pendingCloneId

  // Refs and state — must all be declared before any conditional return (Rules of Hooks)
  const groupRef = useRef<THREE.Group>(null)
  const tcRef    = useRef<TransformControlsImpl>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragValid,  setDragValid]  = useState(true)

  // workingPos: non-null when item was dropped at an invalid position (red ghost, still selected)
  const [workingPos, setWorkingPos] = useState<[number, number, number] | null>(null)

  // Refs for values read inside event callbacks — avoids stale closures
  const dragValidRef      = useRef(true)
  const dragSnappedPosRef = useRef<[number, number, number]>([...placement.position])
  const shiftHeldRef      = useRef(false)
  // ID of the clone created at drag-start when shift is held; null when not in shift-drag mode
  const duplicateCopyIdRef = useRef<string | null>(null)
  // ID of a copy that survived an invalid drop — waiting to be confirmed or discarded
  const pendingCopyIdRef   = useRef<string | null>(null)
  // Set true when Escape is pressed during a drag, checked at drag-end to cancel
  const dragCancelledRef   = useRef(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeldRef.current = true
      if (e.key === 'Escape') dragCancelledRef.current = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeldRef.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // Keep the THREE.Group position in sync with placement.position (or workingPos) when not dragging
  const [px, py, pz] = placement.position
  useLayoutEffect(() => {
    if (!groupRef.current || isDragging) return
    const [wx, wy, wz] = workingPos ?? placement.position
    groupRef.current.position.set(wx, wy, wz)
  }, [px, py, pz, isDragging, workingPos])

  // When deselected, revert any invalid working position and discard any pending copy
  useEffect(() => {
    if (!isSelected && workingPos !== null) {
      if (pendingCopyIdRef.current) {
        discardPlacement(pendingCopyIdRef.current)
        pendingCopyIdRef.current = null
      }
      setWorkingPos(null)
      if (groupRef.current) {
        groupRef.current.position.set(px, py, pz)
      }
    }
  }, [isSelected])

  // Early returns after all hooks
  if (!profile) return null
  // Hide while being repositioned via G key — the ghost preview takes its place
  if (placement.id === movingId) return null

  function handleClick() {
    if (isPendingClone) return  // pending copies aren't selectable
    if (heldItem) return
    if (gizmoDraggingRef.current) return
    selectPlacement(isSelected ? null : placement.id)
  }

  function handleDragStart() {
    dragCancelledRef.current = false
    setIsDragging(true)
    setWorkingPos(null)
    gizmoDraggingRef.current = true
    if (orbitRef.current) orbitRef.current.enabled = false

    if (shiftHeldRef.current) {
      // Shift held at drag-start: if there's a pending copy from a previous invalid
      // shift-drag, discard it first, then create a fresh clone for this drag.
      if (pendingCopyIdRef.current) {
        discardPlacement(pendingCopyIdRef.current)
        pendingCopyIdRef.current = null
      }
      const copyId = uuidv4()
      duplicateCopyIdRef.current = copyId
      clonePlacement(placement.id, copyId)
    }
    // No-shift drag: leave pendingCopyIdRef alone — a confirmed valid drop will
    // accept the copy; a deselect or Esc will discard it.
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

    // Validate: no collision at snapped position (excluding self only)
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

    const wasCancelled = dragCancelledRef.current
    dragCancelledRef.current = false

    const snapped = dragSnappedPosRef.current
    const [ox, oy, oz] = placement.position
    const moved =
      Math.abs(snapped[0] - ox) > 0.5 ||
      Math.abs(snapped[1] - oy) > 0.5 ||
      Math.abs(snapped[2] - oz) > 0.5

    const copyId = duplicateCopyIdRef.current
    duplicateCopyIdRef.current = null

    if (copyId !== null) {
      // Active shift-drag: a clone was created at the start of this drag
      if (wasCancelled || !moved) {
        // Esc or no movement; undo the clone entirely
        removePlacement(copyId)
        if (groupRef.current) groupRef.current.position.set(ox, oy, oz)
        setWorkingPos(null)
      } else if (dragValidRef.current) {
        // Valid drop; move original to new position, clone is confirmed (no longer pending)
        movePlacement(placement.id, snapped)
        setPendingCloneId(null)
        setWorkingPos(null)
      } else {
        // Invalid drop; keep clone as "pending"; original stays as red ghost.
        pendingCopyIdRef.current = copyId
        setWorkingPos(snapped)
      }

    } else if (pendingCopyIdRef.current !== null) {
      // Subsequent drag after an invalid shift-drop
      const pendingId = pendingCopyIdRef.current
      if (wasCancelled) {
        // Esc; discard pending clone, revert original
        discardPlacement(pendingId)
        pendingCopyIdRef.current = null
        if (groupRef.current) groupRef.current.position.set(ox, oy, oz)
        setWorkingPos(null)
      } else if (dragValidRef.current && moved) {
        // Valid drop; original lands somewhere valid, clone is confirmed
        movePlacement(placement.id, snapped)
        setPendingCloneId(null)
        pendingCopyIdRef.current = null
        setWorkingPos(null)
      } else if (!dragValidRef.current) {
        setWorkingPos(snapped)
      } else {
        // No movement; leave everything as-is
        if (groupRef.current) groupRef.current.position.set(ox, oy, oz)
      }

    } else {
      // Normal drag (no shift-clone involved)
      if (dragValidRef.current && moved) {
        movePlacement(placement.id, snapped)
        setWorkingPos(null)
      } else if (!dragValidRef.current) {
        setWorkingPos(snapped)
      } else {
        if (groupRef.current) groupRef.current.position.set(ox, oy, oz)
      }
    }
  }

  const showAsGhost = isDragging || workingPos !== null
  const ghostValid  = isDragging && dragValid

  return (
    <>
      <group ref={groupRef}>
        <DrawerFrame
          profile={profile}
          position={[0, 0, 0]}
          rotation={placement.rotation}
          selected={isSelected && !isDragging && workingPos === null && !isPendingClone}
          ghost={showAsGhost}
          valid={ghostValid}
          onClick={handleClick}
        />
      </group>

      {isSelected && !heldItem && !isPendingClone && groupRef.current && (
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
