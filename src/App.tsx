import { useRef, useEffect, useCallback, useState } from 'react'
import { version } from '../package.json'
import { getLastSeenVersion, setLastSeenVersion, isVersionNewer } from './utils/localStorage'
import ChangelogModal from './components/ui/ChangelogModal'
import Toolbar from './components/ui/Toolbar'
import CatalogPanel from './components/ui/CatalogPanel'
import PartsListPanel from './components/ui/PartsListPanel'
import Viewport from './components/three/Viewport'
import type { ViewportHandle } from './components/three/Viewport'
import { usePlannerStore } from './store/plannerStore'
import { useFilamentSheet } from './hooks/useFilamentSheet'
import styles from './styles/app.module.css'

export default function App() {
  useFilamentSheet()

  const [leftWidth, setLeftWidth] = useState(() =>
    Number(localStorage.getItem('sidebar-left-width')) || 240
  )
  const [rightWidth, setRightWidth] = useState(() =>
    Number(localStorage.getItem('sidebar-right-width')) || 224
  )
  const dragRef = useRef<{ side: 'left' | 'right'; startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return
      const { side, startX, startWidth } = dragRef.current
      const delta = e.clientX - startX
      if (side === 'left') {
        setLeftWidth(Math.min(480, Math.max(140, startWidth + delta)))
      } else {
        setRightWidth(Math.min(480, Math.max(140, startWidth - delta)))
      }
    }
    function onMouseUp() {
      if (dragRef.current) {
        if (dragRef.current.side === 'left') {
          setLeftWidth(w => { localStorage.setItem('sidebar-left-width', String(w)); return w })
        } else {
          setRightWidth(w => { localStorage.setItem('sidebar-right-width', String(w)); return w })
        }
      }
      dragRef.current = null
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const viewportRef = useRef<ViewportHandle>(null)
  const heldItem = usePlannerStore(s => s.heldItem)
  const movingId = usePlannerStore(s => s.movingId)
  const selectedId = usePlannerStore(s => s.selectedId)
  const setHeldItem = usePlannerStore(s => s.setHeldItem)
  const rotateSelected = usePlannerStore(s => s.rotateSelected)
  const rotateGhost = usePlannerStore(s => s.rotateGhost)
  const startMove = usePlannerStore(s => s.startMove)
  const removePlacement = usePlannerStore(s => s.removePlacement)
  const undo = usePlannerStore(s => s.undo)
  const redo = usePlannerStore(s => s.redo)

  const handleResetCamera = useCallback(() => {
    viewportRef.current?.resetCamera()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return

      switch (e.key) {
        case 'Escape':
          setHeldItem(null)
          break
        case 'r':
        case 'R':
          if (heldItem) rotateGhost()
          else rotateSelected()
          break
        case 'g':
        case 'G':
          if (selectedId && !heldItem) startMove(selectedId)
          break
        case 'Delete':
        case 'Backspace':
          if (selectedId && !heldItem) removePlacement(selectedId)
          break
        case 'h':
        case 'H':
          handleResetCamera()
          break
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
          }
          break
        case 'y':
        case 'Y':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); redo() }
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [heldItem, selectedId, setHeldItem, rotateSelected, rotateGhost, startMove, removePlacement, handleResetCamera, undo, redo])

  const isMoving = !!movingId

  // What's New: show on launch if version has advanced since last visit
  const [whatsNewSince, setWhatsNewSince] = useState<string | null | false>(false) // false = not yet checked
  useEffect(() => {
    const last = getLastSeenVersion()
    if (last === null) {
      // First ever visit — show only the latest entry (pass a fake "since" = second entry's version)
      const entries: { version: string }[] = __CHANGELOG__
      const since = entries.length > 1 ? entries[1].version : null
      setWhatsNewSince(since ?? null)
    } else if (isVersionNewer(version, last)) {
      // Returning user who missed some versions
      setWhatsNewSince(last)
    } else {
      setWhatsNewSince(null) // up to date, don't show
    }
  }, [])

  function handleWhatsNewClose() {
    setLastSeenVersion(version)
    setWhatsNewSince(null)
  }

  return (
    <div className={styles.layout}>
      <Toolbar onResetCamera={handleResetCamera} />

      <div className={styles.body}>
        <div className={styles.sidebarLeft} style={{ width: leftWidth }}>
          <div className="flex-1 min-h-0 overflow-hidden">
            <CatalogPanel />
          </div>
        </div>

        <div
          className={styles.resizeHandle}
          onMouseDown={e => { e.preventDefault(); dragRef.current = { side: 'left', startX: e.clientX, startWidth: leftWidth } }}
        />

        <div
          className={styles.viewport}
          style={{ cursor: heldItem ? 'crosshair' : 'default' }}
        >
          <Viewport ref={viewportRef} />

          {heldItem && (
            <div className={styles.placementBanner}>
              <div className={styles.bannerPill}>
                {isMoving ? 'Moving' : 'Placing'}: <strong>{heldItem.name}</strong>
                <span className="ml-2 text-slate-400 text-xs">
                  · Click to place ·{' '}
                  <kbd className={styles.kbd}>R</kbd> rotate ·{' '}
                  <kbd className={styles.kbd}>Esc</kbd> cancel
                </span>
              </div>
            </div>
          )}

          {selectedId && !heldItem && (
            <div className={styles.selectionBanner}>
              <div className={styles.bannerPillSelected}>
                Selected ·{' '}
                <span className="text-slate-300 text-xs">
                  drag gizmo to move · Shift+drag to duplicate ·{' '}
                  <kbd className={styles.kbd}>G</kbd> pick up ·{' '}
                  <kbd className={styles.kbd}>R</kbd> rotate ·{' '}
                  <kbd className={styles.kbd}>Del</kbd> delete
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          className={styles.resizeHandle}
          onMouseDown={e => { e.preventDefault(); dragRef.current = { side: 'right', startX: e.clientX, startWidth: rightWidth } }}
        />

        <div className={styles.sidebarRight} style={{ width: rightWidth }}>
          <PartsListPanel />
        </div>
      </div>

      <div className={styles.footer}>
        <span>
          v{version} · built by{' '}
          <a
            href="https://makerworld.com/en/@shinaka"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            shinaka
          </a>
        </span>
        <span>
          Rugged Drawer System by{' '}
          <a
            href="https://makerworld.com/en/@K2_Kevin"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            K2_Kevin
          </a>
        </span>
      </div>

      {typeof whatsNewSince === 'string' && (
        <ChangelogModal
          sinceVersion={whatsNewSince || undefined}
          isWhatsNew
          onClose={handleWhatsNewClose}
        />
      )}
    </div>
  )
}
