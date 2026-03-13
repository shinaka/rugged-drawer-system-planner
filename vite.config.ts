import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

interface ChangelogEntry {
  version: string
  commits: string[]
}

function buildFilamentData(): Record<string, { grams: number; hours: number }> {
  try {
    const csv = readFileSync('filament_data_final.csv', 'utf-8')
    const data: Record<string, { grams: number; hours: number }> = {}
    for (const line of csv.trim().split('\n').slice(1)) {
      const [id, gramsStr, hoursStr] = line.split(',')
      const grams = parseFloat(gramsStr)
      const hours = parseFloat(hoursStr)
      if (id && grams > 0) data[id.trim()] = { grams, hours: hours > 0 ? hours : 0 }
    }
    return data
  } catch {
    return {}
  }
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
        .filter(c => !/^v?\d+\.\d+\.\d+$/.test(c))
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
    __FILAMENT_DATA__: JSON.stringify(buildFilamentData()),
  },
})
