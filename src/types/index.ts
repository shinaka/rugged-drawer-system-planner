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
  filamentGrams?: number // estimated filament at Bambu 0.20mm standard profile
}

export interface Placement {
  id: string
  profileId: string
  position: [number, number, number] // world position (mm), snapped to grid
  rotation: 0 | 90 | 180 | 270 // Y-axis rotation in degrees
}

export interface FilamentEntry {
  grams: number
  hours: number
}

export interface PlannerState {
  placements: Placement[]
  filamentData: Record<string, FilamentEntry> // fetched from Google Sheet
  selectedId: string | null
  heldItem: DrawerProfile | null
  ghostPosition: [number, number, number] | null
  ghostRotation: 0 | 90 | 180 | 270 // rotation of the ghost preview
  ghostValid: boolean
  movingId: string | null // ID of a placed item being repositioned
  pendingCloneId: string | null // ID of a shift-drag clone that isn't confirmed yet
  history: Placement[][]
  historyIndex: number
  currentSetupName: string | null // name of the last-saved/loaded setup
  isDirty: boolean                // true if placements changed since last save/load

  addPlacement: (profile: DrawerProfile, position: [number, number, number]) => void
  movePlacement: (id: string, position: [number, number, number]) => void
  clonePlacement: (id: string, newId: string) => void
  removePlacement: (id: string) => void
  discardPlacement: (id: string) => void
  setPendingCloneId: (id: string | null) => void
  selectPlacement: (id: string | null) => void
  rotateSelected: () => void
  rotateGhost: () => void
  startMove: (id: string) => void
  setHeldItem: (item: DrawerProfile | null) => void
  setGhostPosition: (pos: [number, number, number] | null) => void
  setGhostValid: (valid: boolean) => void
  setFilamentData: (data: Record<string, FilamentEntry>) => void
  loadLayout: (placements: Placement[]) => void
  newSetup: () => void
  saveSetup: (name: string) => void
  loadSetup: (name: string, placements: Placement[]) => void
  undo: () => void
  redo: () => void
  clearAll: () => void
}
