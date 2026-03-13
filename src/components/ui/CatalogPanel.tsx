import { useState, useRef, useEffect } from 'react'
import { drawerCatalog } from '../../data/drawerCatalog'
import CatalogItem from './CatalogItem'
import styles from './CatalogPanel.module.css'

type FilterKey = 'all' | 'h1' | 'h2' | 'special' | 'baseplate'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'h1',        label: 'Standard' },
  { key: 'h2',        label: 'Double High' },
  { key: 'special',   label: 'Special' },
  { key: 'baseplate', label: 'Baseplates' },
]

const DEPTHS = [2, 3, 4, 5, 6]

export default function CatalogPanel() {
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState<FilterKey>('all')
  const [depthFilter, setDepthFilter] = useState<Set<number>>(new Set())
  const [depthOpen, setDepthOpen]     = useState(false)
  const depthRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (depthRef.current && !depthRef.current.contains(e.target as Node)) {
        setDepthOpen(false)
      }
    }
    if (depthOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [depthOpen])

  function toggleDepth(d: number) {
    setDepthFilter(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  function resetDepth() {
    setDepthFilter(new Set())
    setDepthOpen(false)
  }

  const filtered = drawerCatalog.filter(p => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'h1'        && p.category === 'standard' && p.heightType === 'H1') ||
      (filter === 'h2'        && p.category === 'standard' && p.heightType === 'H2') ||
      (filter === 'special'   && p.category === 'divided') ||
      (filter === 'baseplate' && p.category === 'baseplate')
    const matchDepth  = depthFilter.size === 0 || depthFilter.has(p.gridDepth)
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchDepth && matchSearch
  })

  const depthActive = depthFilter.size > 0

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Catalog</h2>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={filter === f.key ? styles.filterBtnActive : styles.filterBtn}
            >
              {f.label}
            </button>
          ))}

          {/* Depth dropdown */}
          <div className={styles.depthWrap} ref={depthRef}>
            <button
              onClick={() => setDepthOpen(o => !o)}
              className={depthActive ? styles.depthBtnActive : styles.depthBtn}
            >
              {depthActive
                ? `Depth: ${[...depthFilter].sort().join(', ')}`
                : 'Depth ▾'}
            </button>

            {depthOpen && (
              <div className={styles.depthDropdown}>
                {DEPTHS.map(d => (
                  <label key={d} className={styles.depthOption}>
                    <input
                      type="checkbox"
                      checked={depthFilter.has(d)}
                      onChange={() => toggleDepth(d)}
                      className={styles.depthCheckbox}
                    />
                    {d}-deep
                  </label>
                ))}
                <button
                  onClick={resetDepth}
                  className={styles.depthReset}
                  disabled={!depthActive}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <p className={styles.emptyState}>No items found</p>
        )}
        {filtered.map(p => (
          <CatalogItem key={p.id} profile={p} />
        ))}
      </div>

      <div className={styles.hint}>
        <p className={styles.hintText}>
          Click an item to pick it up, then click the grid to place it.
          Press <kbd className={styles.kbd}>R</kbd> to rotate,{' '}
          <kbd className={styles.kbd}>Esc</kbd> to cancel.
        </p>
      </div>
    </div>
  )
}
