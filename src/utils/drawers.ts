import type { DrawerProfile, Placement } from '../types'
import { getProfile } from '../data/drawerCatalog'

// Drawer cell layout

export function getDrawerLayout(profileId: string): { columns: number; rows: number } {
  switch (profileId) {
    case '2x5_h1':
    case '4x4_mini':
    case '3x4_mini_2': return { columns: 2, rows: 1 }
    case '5x6_stacked':
    case '3x5_stacked': return { columns: 2, rows: 2 }
    default: return { columns: 1, rows: 1 }
  }
}

export function getDrawerCount(profile: DrawerProfile | undefined): number {
  if (!profile || profile.category === 'baseplate') return 0
  const { columns, rows } = getDrawerLayout(profile.id)
  return columns * rows
}

export function areAllDrawersOpen(placements: Placement[], openDrawers: Record<string, number[]>, pendingCloneId: string | null): boolean {
  const drawers = placements.filter(p => p.id !== pendingCloneId && getDrawerCount(getProfile(p.profileId)) > 0)
  return drawers.length > 0 && drawers.every(p => {
    const count = getDrawerCount(getProfile(p.profileId))
    return Array.from({ length: count }, (_, i) => i).every(i => openDrawers[p.id]?.includes(i))
  })
}
