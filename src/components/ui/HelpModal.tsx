import styles from './HelpModal.module.css'

interface Props {
  onClose: () => void
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span>Controls</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.controlsGrid}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Placing Items</div>
              <Row k="Click catalog item" v="Pick up to place" />
              <Row k="Click grid" v="Place item" />
              <Row k="R" v="Rotate held / selected item" />
              <Row k="Esc" v="Cancel placement" />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Selection</div>
              <Row k="Click placed item" v="Select" />
              <Row k="G" v="Pick up selected item to move" />
              <Row k="Drag gizmo arrow" v="Move (snaps to grid / stack)" />
              <Row k="Shift + drag gizmo" v="Duplicate (instead of move)" />
              <Row k="Shift + click to place" v="Duplicate (while using G)" />
              <Row k="R" v="Rotate selected" />
              <Row k="Delete / Backspace" v="Remove selected" />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Camera</div>
              <Row k="Left drag" v="Orbit" />
              <Row k="Right drag / Middle drag" v="Pan" />
              <Row k="Scroll" v="Zoom" />
              <Row k="H" v="Reset view" />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>History</div>
              <Row k="Ctrl+Z" v="Undo" />
              <Row k="Ctrl+Y / Ctrl+Shift+Z" v="Redo" />
            </div>
          </div>

          <div className={styles.note}>
            Clicking <strong>Print Profile</strong> links will select the correct print profile on MakerWorld.
            You may need to expand the profile list on the page to see it selected.
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className={styles.row}>
      <kbd className={styles.key}>{k}</kbd>
      <span className={styles.value}>{v}</span>
    </div>
  )
}
