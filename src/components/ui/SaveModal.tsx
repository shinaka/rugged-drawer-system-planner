import { useState, useEffect, useRef } from 'react'
import { saveExists } from '../../utils/localStorage'
import styles from './SaveLoadModal.module.css'

interface Props {
  initialName?: string
  onSave: (name: string) => void
  onCancel: () => void
}

export default function SaveModal({ initialName = '', onSave, onCancel }: Props) {
  const [name, setName] = useState(initialName)
  const [overwriting, setOverwriting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    setOverwriting(name.trim().length > 0 && saveExists(name.trim()))
  }, [name])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSave(trimmed)
  }

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span>Save Setup</span>
          <button className={styles.close} onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <label className={styles.label}>
            Setup name
            <input
              ref={inputRef}
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Workshop shelf, Under-desk…"
              maxLength={64}
            />
          </label>

          {overwriting && (
            <p className={styles.warning}>A setup named "{name.trim()}" already exists and will be overwritten.</p>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.btnSecondary} onClick={onCancel}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={!name.trim()}>Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
