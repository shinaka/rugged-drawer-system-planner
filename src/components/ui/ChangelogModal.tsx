import { isVersionNewer } from '../../utils/localStorage'
import styles from './HelpModal.module.css'
import changelogStyles from './ChangelogModal.module.css'

interface Props {
  onClose: () => void
  /** Only show entries newer than this version (for "What's New" on launch). */
  sinceVersion?: string
  isWhatsNew?: boolean
}

export default function ChangelogModal({ onClose, sinceVersion, isWhatsNew }: Props) {
  const all: { version: string; commits: string[] }[] = __CHANGELOG__

  const entries = sinceVersion
    ? all.filter(e => isVersionNewer(e.version, sinceVersion))
    : all

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span>{isWhatsNew ? "What's New" : 'Changelog'}</span>
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
