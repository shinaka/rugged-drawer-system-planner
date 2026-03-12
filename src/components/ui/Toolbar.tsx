import { useState } from 'react'
import { usePlannerStore } from '../../store/plannerStore'
import styles from './Toolbar.module.css'

interface Props {
  onResetCamera: () => void
}

export default function Toolbar({ onResetCamera }: Props) {
  const [helpOpen, setHelpOpen] = useState(false)
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
    <>
      <div className={styles.toolbar}>
        <span className={styles.title}>Rugged Drawer System Planner</span>

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
        <ToolbarBtn onClick={() => setHelpOpen(true)} title="Help">
          ? Help
        </ToolbarBtn>

        <div className={styles.spacer} />

        <ToolbarBtn onClick={clearAll} danger title="Clear all placed items">
          Clear All
        </ToolbarBtn>
      </div>

      {helpOpen && (
        <div className={styles.modalBackdrop} onClick={() => setHelpOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Controls</span>
              <button className={styles.modalClose} onClick={() => setHelpOpen(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.controlsGrid}>
                <div className={styles.controlsSection}>
                  <div className={styles.sectionTitle}>Placing Items</div>
                  <Row k="Click catalog item" v="Pick up to place" />
                  <Row k="Click grid" v="Place item" />
                  <Row k="R" v="Rotate held / selected item" />
                  <Row k="Esc" v="Cancel placement" />
                </div>

                <div className={styles.controlsSection}>
                  <div className={styles.sectionTitle}>Selection</div>
                  <Row k="Click placed item" v="Select" />
                  <Row k="Drag gizmo arrow" v="Move (snaps to grid / stack)" />
                  <Row k="R" v="Rotate selected" />
                  <Row k="Delete / Backspace" v="Remove selected" />
                </div>

                <div className={styles.controlsSection}>
                  <div className={styles.sectionTitle}>Camera</div>
                  <Row k="Left drag" v="Orbit" />
                  <Row k="Right drag / Middle drag" v="Pan" />
                  <Row k="Scroll" v="Zoom" />
                  <Row k="H" v="Reset view" />
                </div>

                <div className={styles.controlsSection}>
                  <div className={styles.sectionTitle}>History</div>
                  <Row k="Ctrl+Z" v="Undo" />
                  <Row k="Ctrl+Y / Ctrl+Shift+Z" v="Redo" />
                </div>
              </div>

              <div className={styles.modalNote}>
                Clicking <strong>Print Profile</strong> links will select the correct print profile on MakerWorld.
                You may need to expand the profile list on the page to see it selected.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className={styles.controlRow}>
      <kbd className={styles.controlKey}>{k}</kbd>
      <span className={styles.controlValue}>{v}</span>
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
