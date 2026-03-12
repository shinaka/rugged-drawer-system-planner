import { usePlannerStore } from '../../store/plannerStore'
import styles from './Toolbar.module.css'

interface Props {
  onResetCamera: () => void
}

export default function Toolbar({ onResetCamera }: Props) {
  const undo = usePlannerStore(s => s.undo)
  const redo = usePlannerStore(s => s.redo)
  const clearAll = usePlannerStore(s => s.clearAll)
  const rotateSelected = usePlannerStore(s => s.rotateSelected)
  const selectedId = usePlannerStore(s => s.selectedId)
  const removePlacement = usePlannerStore(s => s.removePlacement)
  const historyIndex = usePlannerStore(s => s.historyIndex)
  const history = usePlannerStore(s => s.history)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  function handleDelete() {
    if (selectedId) removePlacement(selectedId)
  }

  return (
    <div className={styles.toolbar}>
      <span className={styles.title}>Rugged Drawer Planner</span>

      <div className={styles.divider} />

      <ToolbarBtn onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        ↩ Undo
      </ToolbarBtn>
      <ToolbarBtn onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        ↪ Redo
      </ToolbarBtn>

      <div className={styles.divider} />

      <ToolbarBtn onClick={rotateSelected} disabled={!selectedId} title="Rotate (R)">
        ⟳ Rotate
      </ToolbarBtn>
      <ToolbarBtn onClick={handleDelete} disabled={!selectedId} title="Delete (Del)" danger>
        ✕ Delete
      </ToolbarBtn>

      <div className={styles.divider} />

      <ToolbarBtn onClick={onResetCamera} title="Reset Camera (H)">
        ⌂ Reset View
      </ToolbarBtn>

      <div className={styles.spacer} />

      <ToolbarBtn onClick={clearAll} danger title="Clear all placed items">
        Clear All
      </ToolbarBtn>
    </div>
  )
}

interface BtnProps {
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  title?: string
  children: React.ReactNode
}

function ToolbarBtn({ onClick, disabled, danger, title, children }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={danger ? styles.btnDanger : styles.btn}
    >
      {children}
    </button>
  )
}
