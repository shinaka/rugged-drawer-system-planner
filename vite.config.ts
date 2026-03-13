import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

interface ChangelogEntry {
  version: string
  commits: string[]
}

function buildChangelog(): ChangelogEntry[] {
  try {
    const tags = execSync('git tag --sort=v:refname')
      .toString().trim().split('\n').filter(Boolean)
    if (tags.length === 0) return []

    return tags.map((tag: string, i: number) => {
      const prevTag = tags[i - 1]
      const range = prevTag ? `${prevTag}..${tag}` : tag
      const commits = execSync(`git log ${range} --pretty=format:"%s"`)
        .toString().trim().split('\n').filter(Boolean)
      return { version: tag, commits }
    }).reverse() // newest first
  } catch {
    return []
  }
}

export default defineConfig({
  plugins: [react()],
  base: '/rugged-drawer-system-planner/',
  define: {
    __CHANGELOG__: JSON.stringify(buildChangelog()),
  },
})
