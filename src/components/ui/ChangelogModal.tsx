import styles from './HelpModal.module.css'
import changelogStyles from './ChangelogModal.module.css'

interface Props {
  onClose: () => void
}

export default function ChangelogModal({ onClose }: Props) {
  const entries = __CHANGELOG__

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span>Changelog</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={changelogStyles.body}>
          {entries.map(entry => (
            <div key={entry.version} className={changelogStyles.version}>
              <div className={changelogStyles.versionTag}>{entry.version}</div>
              <ul className={changelogStyles.commits}>
                {entry.commits.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
