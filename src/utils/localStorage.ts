import type { Placement } from '../types'

const STORAGE_KEY = 'rdp-saves'

export interface SavedSetup {
  name: string
  placements: Placement[]
  savedAt: string // ISO timestamp
}

function readAll(): Record<string, SavedSetup> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function listSaves(): SavedSetup[] {
  const all = readAll()
  return Object.values(all).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  )
}

export function writeSave(name: string, placements: Placement[]): void {
  const all = readAll()
  all[name] = { name, placements, savedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function deleteSave(name: string): void {
  const all = readAll()
  delete all[name]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function saveExists(name: string): boolean {
  return name in readAll()
}
