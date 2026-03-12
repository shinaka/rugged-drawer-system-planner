import { useRef } from 'react'
import { usePlannerStore } from '../../store/plannerStore'
import { drawerCatalog, getMakerWorldUrl } from '../../data/drawerCatalog'
import { exportLayout, importLayout, downloadJson } from '../../utils/export'
import styles from './PartsListPanel.module.css'

export default function PartsListPanel() {
  const placements = usePlannerStore(s => s.placements)
  const loadLayout = usePlannerStore(s => s.loadLayout)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const counts = new Map<string, number>()
  for (const p of placements) {
    counts.set(p.profileId, (counts.get(p.profileId) ?? 0) + 1)
  }

  const items = drawerCatalog
    .filter(p => counts.has(p.id))
    .map(p => ({ profile: p, count: counts.get(p.id) ?? 0 }))
    .sort((a, b) => a.profile.name.localeCompare(b.profile.name))

  const total = placements.length

  function handleExport() {
    const json = exportLayout(placements)
    downloadJson(`rugged-drawer-layout-${Date.now()}.json`, json)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const loaded = importLayout(ev.target?.result as string)
        loadLayout(loaded)
      } catch {
        alert('Could not load layout — invalid or unsupported file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Parts List</h2>
        <div className={styles.actions}>
          {total > 0 && (
            <button onClick={handleExport} className={styles.exportBtn}>
              Export JSON
            </button>
          )}
          <button onClick={() => fileInputRef.current?.click()} className={styles.importBtn}>
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className={styles.list}>
        {items.length === 0 ? (
          <p className={styles.emptyState}>Place items to see the parts list</p>
        ) : (
          items.map(({ profile, count }) => (
            <div key={profile.id} className={styles.row}>
              <div className={styles.rowLeft}>
                <div
                  className={styles.colorDot}
                  style={{ backgroundColor: profile.color }}
                />
                <span className={styles.name}>{profile.name}</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.count}>×{count}</span>
                <a
                  href={getMakerWorldUrl(profile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.makerLink}
                >
                  MakerWorld
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {total > 0 && (
        <div className={styles.footer}>
          <div className={styles.total}>
            <span className={styles.totalLabel}>Total items</span>
            <span className={styles.totalValue}>{total}</span>
          </div>
        </div>
      )}
    </div>
  )
}
