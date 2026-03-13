import { useEffect } from 'react'
import { usePlannerStore } from '../store/plannerStore'
import type { FilamentEntry } from '../types'

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRaClll_ES0QkoN6SkyVpNsCb7Af-wJtnn3KjHeqlbJ_m1XBylqF2oS8QnG1HFNGzW2Tetc9hr0vlu1/pub?gid=745834875&single=true&output=csv'

export function useFilamentSheet() {
  const setFilamentData = usePlannerStore(s => s.setFilamentData)

  useEffect(() => {
    fetch(SHEET_URL)
      .then(r => r.text())
      .then(csv => {
        const data: Record<string, FilamentEntry> = {}
        const lines = csv.trim().split('\n').slice(1) // skip header
        for (const line of lines) {
          const [id, gramsStr, hoursStr] = line.split(',')
          const grams = parseFloat(gramsStr)
          const hours = parseFloat(hoursStr)
          if (id && grams > 0) {
            data[id.trim()] = { grams, hours: hours > 0 ? hours : 0 }
          }
        }
        setFilamentData(data)
      })
      .catch(() => { /* silently fall back to catalog values */ })
  }, [setFilamentData])
}
