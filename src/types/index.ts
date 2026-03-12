export interface DrawerProfile {
  id: string
  name: string
  gridWidth: number
  gridDepth: number
  heightType: 'H1' | 'H2' | 'H2D'
  heightMm: number
  printerCompatibility: string[]
  makerWorldProfileId?: string
  category: 'standard' | 'divided' | 'custom' | 'baseplate' | 'tray'
  color: string // display color in 3D view
}

export interface Placement {
  id: string
  profileId: string
  position: [number, number, number] // world position (mm), snapped to grid
  rotation: 0 | 90 | 180 | 270 // Y-axis rotation in degrees
}

export interface PlannerState {
  placements: Placement[]
  selectedId: string | null
  heldItem: DrawerProfile | null
  ghostPosition: [number, number, number] | null
  ghostRotation: 0 | 90 | 180 | 270 // rotation of the ghost preview
  ghostValid: boolean
  movingId: string | null // ID of a placed item being repositioned
  history: Placement[][]
  historyIndex: number

  addPlacement: (profile: DrawerProfile, position: [number, number, number]) => void
  removePlacement: (id: string) => void
  selectPlacement: (id: string | null) => void
  rotateSelected: () => void
  rotateGhost: () => void
  startMove: (id: string) => void
  setHeldItem: (item: DrawerProfile | null) => void
  setGhostPosition: (pos: [number, number, number] | null) => void
  setGhostValid: (valid: boolean) => void
  loadLayout: (placements: Placement[]) => void
  undo: () => void
  redo: () => void
  clearAll: () => void
}
