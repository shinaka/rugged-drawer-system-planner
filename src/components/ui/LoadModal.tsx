import { useState } from 'react'
import { listSaves, deleteSave } from '../../utils/localStorage'
import type { SavedSetup } from '../../utils/localStorage'
import styles from './SaveLoadModal.module.css'

interface Props {
  onLoad: (setup: SavedSetup) => void
  onCancel: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function LoadModal({ onLoad, onCancel }: Props) {
  const [saves, setSaves] = useState<SavedSetup[]>(() => listSaves())

  function handleDelete(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    deleteSave(name)
    setSaves(listSaves())
  }

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span>Load Setup</span>
          <button className={styles.close} onClick={onCancel}>✕</button>
        </div>

        <div className={styles.body}>
          {saves.length === 0 ? (
            <p className={styles.empty}>No saved setups yet. Use Save to store your current layout.</p>
          ) : (
            <ul className={styles.saveList}>
              {saves.map(s => (
                <li key={s.name} className={styles.saveRow}>
                  <button className={styles.saveLoad} onClick={() => onLoad(s)}>
                    <span className={styles.saveName}>{s.name}</span>
                    <span className={styles.saveMeta}>
                      {s.placements.length} item{s.placements.length !== 1 ? 's' : ''} · {formatDate(s.savedAt)}
                    </span>
                  </button>
                  <button
                    className={styles.saveDelete}
                    onClick={e => handleDelete(s.name, e)}
                    title={`Delete "${s.name}"`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
