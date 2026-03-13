import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { DrawerProfile, FilamentEntry, Placement, PlannerState } from '../types'
import { getProfile } from '../data/drawerCatalog'

const MAX_HISTORY = 50

function pushHistory(history: Placement[][], historyIndex: number, newPlacements: Placement[]) {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(newPlacements)
  return {
    history: newHistory.slice(-MAX_HISTORY) as Placement[][],
    historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
  }
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  placements: [],
  filamentData: {},
  selectedId: null,
  heldItem: null,
  ghostPosition: null,
  ghostRotation: 0,
  ghostValid: true,
  movingId: null,
  pendingCloneId: null,
  history: [[]],
  historyIndex: 0,

  addPlacement: (profile: DrawerProfile, position: [number, number, number]) => {
    const { placements, history, historyIndex, movingId, ghostRotation } = get()
    // When repositioning an existing item, keep its ID so undo is clean
    const id = movingId ?? uuidv4()
    const newPlacement: Placement = { id, profileId: profile.id, position, rotation: ghostRotation }
    const base = movingId ? placements.filter(p => p.id !== movingId) : placements
    const newPlacements = [...base, newPlacement]
    set({
      placements: newPlacements,
      ...pushHistory(history, historyIndex, newPlacements),
      heldItem: null,
      ghostPosition: null,
      ghostRotation: 0,
      movingId: null,
    })
  },

  movePlacement: (id: string, position: [number, number, number]) => {
    const { placements, history, historyIndex } = get()
    const newPlacements = placements.map(p => p.id === id ? { ...p, position } : p)
    set({ placements: newPlacements, ...pushHistory(history, historyIndex, newPlacements) })
  },

  // Silently inserts a copy at the same position/rotation — used by gizmo shift-drag.
  // Also marks the new copy as pending so it renders as a ghost until confirmed.
  clonePlacement: (id: string, newId: string) => {
    const { placements, history, historyIndex } = get()
    const original = placements.find(p => p.id === id)
    if (!original) return
    const copy = { ...original, id: newId }
    const newPlacements = [...placements, copy]
    set({ placements: newPlacements, ...pushHistory(history, historyIndex, newPlacements), pendingCloneId: newId })
  },

  removePlacement: (id: string) => {
    const { placements, history, historyIndex, pendingCloneId } = get()
    const newPlacements = placements.filter(p => p.id !== id)
    set({
      placements: newPlacements,
      ...pushHistory(history, historyIndex, newPlacements),
      selectedId: null,
      ...(pendingCloneId === id ? { pendingCloneId: null } : {}),
    })
  },

  // Like removePlacement but does NOT clear selectedId — used when cleaning up
  // shift-drag copies so we don't accidentally deselect a newly-clicked item.
  discardPlacement: (id: string) => {
    const { placements, history, historyIndex, pendingCloneId } = get()
    const newPlacements = placements.filter(p => p.id !== id)
    set({
      placements: newPlacements,
      ...pushHistory(history, historyIndex, newPlacements),
      ...(pendingCloneId === id ? { pendingCloneId: null } : {}),
    })
  },

  setPendingCloneId: (id: string | null) => set({ pendingCloneId: id }),

  selectPlacement: (id: string | null) => set({ selectedId: id }),

  rotateSelected: () => {
    const { placements, selectedId, history, historyIndex } = get()
    if (!selectedId) return
    const rotations: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270]
    const newPlacements = placements.map(p => {
      if (p.id !== selectedId) return p
      return { ...p, rotation: rotations[(rotations.indexOf(p.rotation) + 1) % 4] }
    })
    set({ placements: newPlacements, ...pushHistory(history, historyIndex, newPlacements) })
  },

  rotateGhost: () => {
    const { ghostRotation } = get()
    const rotations: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270]
    set({ ghostRotation: rotations[(rotations.indexOf(ghostRotation) + 1) % 4] })
  },

  startMove: (id: string) => {
    const { placements } = get()
    const placement = placements.find(p => p.id === id)
    if (!placement) return
    const profile = getProfile(placement.profileId)
    if (!profile) return
    set({ heldItem: profile, ghostRotation: placement.rotation, movingId: id, selectedId: null, ghostPosition: null })
  },

  setHeldItem: (item: DrawerProfile | null) => {
    set({ heldItem: item, selectedId: null, ghostRotation: 0, movingId: null })
  },

  setGhostPosition: (pos: [number, number, number] | null) => set({ ghostPosition: pos }),
  setGhostValid: (valid: boolean) => set({ ghostValid: valid }),
  setFilamentData: (data: Record<string, FilamentEntry>) => set({ filamentData: data }),

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    set({ placements: history[historyIndex - 1] ?? [], historyIndex: historyIndex - 1, selectedId: null, pendingCloneId: null })
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    set({ placements: history[historyIndex + 1] ?? [], historyIndex: historyIndex + 1, selectedId: null, pendingCloneId: null })
  },

  loadLayout: (placements: Placement[]) => {
    const { history, historyIndex } = get()
    set({
      placements,
      selectedId: null, heldItem: null, ghostPosition: null, ghostRotation: 0, movingId: null, pendingCloneId: null,
      ...pushHistory(history, historyIndex, placements),
    })
  },

  clearAll: () => {
    const { history, historyIndex } = get()
    set({
      placements: [], selectedId: null, heldItem: null, ghostPosition: null, ghostRotation: 0, movingId: null, pendingCloneId: null,
      ...pushHistory(history, historyIndex, []),
    })
  },
}))
