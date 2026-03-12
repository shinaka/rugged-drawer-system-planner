import type { Placement } from '../types'
import { drawerCatalog } from '../data/drawerCatalog'

export interface SaveFile {
  version: number
  placements: Placement[]
}

export function exportLayout(placements: Placement[]): string {
  const data: SaveFile = { version: 1, placements }
  return JSON.stringify(data, null, 2)
}

export function importLayout(json: string): Placement[] {
  const data = JSON.parse(json) as SaveFile
  if (data.version !== 1) throw new Error('Unsupported save file version')
  const knownIds = new Set(drawerCatalog.map(p => p.id))
  return data.placements.filter(p => knownIds.has(p.profileId))
}

export function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
