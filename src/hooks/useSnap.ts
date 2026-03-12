import { usePlannerStore } from '../store/plannerStore'
import { getProfile } from '../data/drawerCatalog'
import { snapToGrid, xzOverlaps, GRID_UNIT } from '../utils/grid'

function effectiveDims(gridW: number, gridD: number, rotation: 0 | 90 | 180 | 270): [number, number] {
  return (rotation === 90 || rotation === 270)
    ? [gridD * GRID_UNIT, gridW * GRID_UNIT]
    : [gridW * GRID_UNIT, gridD * GRID_UNIT]
}

export function useSnapPosition() {
  const placements = usePlannerStore(s => s.placements)
  const heldItem = usePlannerStore(s => s.heldItem)
  const ghostRotation = usePlannerStore(s => s.ghostRotation)
  const movingId = usePlannerStore(s => s.movingId)

  function getSnappedPosition(
    rawX: number,
    rawZ: number,
  ): { position: [number, number, number]; valid: boolean } {
    if (!heldItem) return { position: [snapToGrid(rawX), 0, snapToGrid(rawZ)], valid: true }

    const [heldW, heldD] = effectiveDims(heldItem.gridWidth, heldItem.gridDepth, ghostRotation)

    const x = snapToGrid(rawX - heldW / 2) + heldW / 2
    const z = snapToGrid(rawZ - heldD / 2) + heldD / 2

    // Find highest occupied Y among overlapping items (skip item being moved)
    let topY = 0
    for (const p of placements) {
      if (p.id === movingId) continue
      const prof = getProfile(p.profileId)
      if (!prof) continue
      const [pw, pd] = effectiveDims(prof.gridWidth, prof.gridDepth, p.rotation)
      if (xzOverlaps(x, z, heldW, heldD, p.position[0], p.position[2], pw, pd)) {
        const top = p.position[1] + prof.heightMm
        if (top > topY) topY = top
      }
    }

    // Check for collision at this Y level
    const y = topY
    const overlapping = placements.some(p => {
      if (p.id === movingId) return false
      const prof = getProfile(p.profileId)
      if (!prof) return false
      if (Math.abs(p.position[1] - y) > 1) return false
      const [pw, pd] = effectiveDims(prof.gridWidth, prof.gridDepth, p.rotation)
      return xzOverlaps(x, z, heldW, heldD, p.position[0], p.position[2], pw, pd)
    })

    return { position: [x, y, z], valid: !overlapping }
  }

  return getSnappedPosition
}

