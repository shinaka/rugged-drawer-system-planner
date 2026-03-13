import { useRef } from 'react'
import { usePlannerStore } from '../../store/plannerStore'
import { drawerCatalog, getMakerWorldUrl } from '../../data/drawerCatalog'
import { exportLayout, importLayout, downloadJson } from '../../utils/export'
import styles from './PartsListPanel.module.css'

export default function PartsListPanel() {
  const placements = usePlannerStore(s => s.placements)
  const filamentData = usePlannerStore(s => s.filamentData)
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

  // Prefer live sheet data, fall back to catalog values
  function getGrams(profileId: string, fallback?: number) {
    return filamentData[profileId]?.grams ?? fallback
  }
  function getHours(profileId: string) {
    return filamentData[profileId]?.hours
  }

  const totalGrams = items.reduce((sum, { profile, count }) => {
    const g = getGrams(profile.id, profile.filamentGrams)
    return g != null ? sum + g * count : sum
  }, 0)
  const totalHours = items.reduce((sum, { profile, count }) => {
    const h = getHours(profile.id)
    return h != null ? sum + h * count : sum
  }, 0)
  const hasAnyGrams = items.some(({ profile }) => getGrams(profile.id, profile.filamentGrams) != null)
  const allHaveGrams = items.length > 0 && items.every(({ profile }) => getGrams(profile.id, profile.filamentGrams) != null)
  const hasAnyHours = items.some(({ profile }) => getHours(profile.id) != null)

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
                {getGrams(profile.id, profile.filamentGrams) != null && (
                  <span className={styles.grams}>~{Math.round(getGrams(profile.id, profile.filamentGrams)! * count)}g</span>
                )}
                <a
                  href={getMakerWorldUrl(profile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.makerLink}
                  title="Clicking this link will select the correct Print Profile on MakerWorld. You may need to expand the profile list on the page to see it selected."
                >
                  Print Profile
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
          {hasAnyGrams && (
            <div className={styles.total}>
              <span className={styles.totalLabel}>
                Est. filament{allHaveGrams ? '' : ' *'}
              </span>
              <span className={styles.totalValue}>~{Math.round(totalGrams)}g</span>
            </div>
          )}
          {hasAnyHours && (
            <div className={styles.total}>
              <span className={styles.totalLabel}>Est. print time</span>
              <span className={styles.totalValue}>~{totalHours.toFixed(1)}h</span>
            </div>
          )}
          {hasAnyGrams && !allHaveGrams && (
            <p className={styles.gramsNote}>* some items have no estimate yet</p>
          )}
        </div>
      )}
    </div>
  )
}
