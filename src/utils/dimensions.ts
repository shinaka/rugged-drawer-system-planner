import type { Placement } from '../types'
import { getProfile } from '../data/drawerCatalog'
import { GRID_UNIT } from './grid'

export function getLayoutDimensions(placements: Placement[]) {
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (const placement of placements) {
    const profile = getProfile(placement.profileId)
    if (!profile) continue

    const rotated = placement.rotation === 90 || placement.rotation === 270
    const width = (rotated ? profile.gridDepth : profile.gridWidth) * GRID_UNIT
    const depth = (rotated ? profile.gridWidth : profile.gridDepth) * GRID_UNIT
    const [x, y, z] = placement.position

    minX = Math.min(minX, x - width / 2)
    maxX = Math.max(maxX, x + width / 2)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y + profile.heightMm)
    minZ = Math.min(minZ, z - depth / 2)
    maxZ = Math.max(maxZ, z + depth / 2)
  }

  if (minX === Infinity) return null

  return { width: maxX - minX, depth: maxZ - minZ, height: maxY - minY }
}
