import type { DrawerProfile } from '../../types'
import { usePlannerStore } from '../../store/plannerStore'
import styles from './CatalogItem.module.css'

interface Props {
  profile: DrawerProfile
}

const HEIGHT_BADGE: Record<string, string> = {
  H1:  'bg-blue-900 text-blue-200',
  H2:  'bg-indigo-900 text-indigo-200',
  H2D: 'bg-pink-900 text-pink-200',
}

export default function CatalogItem({ profile }: Props) {
  const setHeldItem = usePlannerStore(s => s.setHeldItem)
  const heldItem = usePlannerStore(s => s.heldItem)
  const isHeld = heldItem?.id === profile.id

  function handleMouseDown(e: React.MouseEvent) {
    const startX = e.clientX
    const startY = e.clientY

    function onMove(e: MouseEvent) {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (dx * dx + dy * dy > 25) {
        setHeldItem(profile)
        window.removeEventListener('mousemove', onMove)
      }
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <button
      onMouseDown={handleMouseDown}
      onClick={() => setHeldItem(isHeld ? null : profile)}
      className={`${styles.item} ${isHeld ? styles.itemHeld : ''}`}
    >
      <div className={styles.content}>
        <div className={styles.left}>
          <div
            className={styles.colorDot}
            style={{ backgroundColor: profile.color }}
          />
          <span className={styles.name}>{profile.name}</span>
        </div>
        <span className={`${styles.badge} ${HEIGHT_BADGE[profile.heightType] ?? 'bg-slate-700 text-slate-300'}`}>
          {profile.heightType}
        </span>
      </div>
      <div className={styles.dims}>
        {profile.gridDepth * 42}×{profile.gridWidth * 42}mm · {profile.heightMm}mm tall
      </div>
    </button>
  )
}
