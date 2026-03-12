import { useState } from 'react'
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

export default function CatalogPanel() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = drawerCatalog.filter(p => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'h1'        && p.category === 'standard' && p.heightType === 'H1') ||
      (filter === 'h2'        && p.category === 'standard' && p.heightType === 'H2') ||
      (filter === 'special'   && p.category === 'divided') ||
      (filter === 'baseplate' && p.category === 'baseplate')
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

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
