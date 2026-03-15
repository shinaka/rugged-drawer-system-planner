import { useState } from 'react'
import { usePlannerStore } from '../../store/plannerStore'
import HelpModal from './HelpModal'
import ChangelogModal from './ChangelogModal'
import SaveModal from './SaveModal'
import LoadModal from './LoadModal'
import type { SavedSetup } from '../../utils/localStorage'
import styles from './Toolbar.module.css'

interface Props {
  onResetCamera: () => void
}

export default function Toolbar({ onResetCamera }: Props) {
  const [helpOpen, setHelpOpen] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [loadOpen, setLoadOpen] = useState(false)

  const undo = usePlannerStore(s => s.undo)
  const redo = usePlannerStore(s => s.redo)
  const clearAll = usePlannerStore(s => s.clearAll)
  const rotateSelected = usePlannerStore(s => s.rotateSelected)
  const selectedId = usePlannerStore(s => s.selectedId)
  const removePlacement = usePlannerStore(s => s.removePlacement)
  const historyIndex = usePlannerStore(s => s.historyIndex)
  const history = usePlannerStore(s => s.history)
  const newSetup = usePlannerStore(s => s.newSetup)
  const saveSetup = usePlannerStore(s => s.saveSetup)
  const loadSetup = usePlannerStore(s => s.loadSetup)
  const currentSetupName = usePlannerStore(s => s.currentSetupName)
  const isDirty = usePlannerStore(s => s.isDirty)
  const placements = usePlannerStore(s => s.placements)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  function handleNew() {
    if (isDirty && placements.length > 0) {
      if (!window.confirm('You have unsaved changes. Start a new setup anyway?')) return
    }
    newSetup()
  }

  function handleSaveClick() {
    if (currentSetupName) {
      saveSetup(currentSetupName)
    } else {
      setSaveOpen(true)
    }
  }

  function handleSaveConfirm(name: string) {
    saveSetup(name)
    setSaveOpen(false)
  }

  function handleLoadConfirm(setup: SavedSetup) {
    loadSetup(setup.name, setup.placements)
    setLoadOpen(false)
  }

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.title}>Rugged Drawer System Planner</span>

        <div className={styles.divider} />

        {currentSetupName && (
          <span className={styles.setupName} title={currentSetupName}>
            {currentSetupName}{isDirty ? ' *' : ''}
          </span>
        )}

        <ToolbarBtn onClick={handleNew} title="New setup">
          + New
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setLoadOpen(true)} title="Load a saved setup">
          ↑ Load
        </ToolbarBtn>
        <ToolbarBtn
          onClick={handleSaveClick}
          title={currentSetupName ? `Save to "${currentSetupName}"` : 'Save current setup'}
          highlight={isDirty}
        >
          ↓ Save{isDirty && currentSetupName ? ' *' : ''}
        </ToolbarBtn>

        <div className={styles.divider} />

        <ToolbarBtn onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          ↩ Undo
        </ToolbarBtn>
        <ToolbarBtn onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          ↪ Redo
        </ToolbarBtn>
        <ToolbarBtn onClick={onResetCamera} title="Reset Camera (H)">
          ⌂ Reset View
        </ToolbarBtn>
        <div className={styles.divider} />

        <ToolbarBtn onClick={rotateSelected} disabled={!selectedId} title="Rotate (R)">
          ⟳ Rotate
        </ToolbarBtn>
        <ToolbarBtn onClick={() => { if (selectedId) removePlacement(selectedId) }} disabled={!selectedId} title="Delete (Del)" danger>
          ✕ Delete
        </ToolbarBtn>

        <div className={styles.divider} />

        <ToolbarBtn onClick={() => setHelpOpen(true)} title="Help">
          ? Help
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setChangelogOpen(true)} title="Changelog">
          ◷ Changelog
        </ToolbarBtn>
        <a
          href="https://github.com/shinaka/rugged-drawer-system-planner"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.btn}
          title="View on GitHub"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '0.7rem', height: '0.7rem', display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem', marginBottom: '0.1rem' }}>
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>GitHub
        </a>

        <div className={styles.spacer} />

        <ToolbarBtn onClick={clearAll} danger title="Clear all placed items">
          Clear All
        </ToolbarBtn>
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {changelogOpen && <ChangelogModal onClose={() => setChangelogOpen(false)} />}
      {saveOpen && (
        <SaveModal
          initialName={currentSetupName ?? ''}
          onSave={handleSaveConfirm}
          onCancel={() => setSaveOpen(false)}
        />
      )}
      {loadOpen && (
        <LoadModal
          onLoad={handleLoadConfirm}
          onCancel={() => setLoadOpen(false)}
        />
      )}
    </>
  )
}

interface BtnProps {
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  highlight?: boolean
  title?: string
  children: React.ReactNode
}

function ToolbarBtn({ onClick, disabled, danger, highlight, title, children }: BtnProps) {
  const cls = danger ? styles.btnDanger : highlight ? styles.btnHighlight : styles.btn
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={cls}>
      {children}
    </button>
  )
}
