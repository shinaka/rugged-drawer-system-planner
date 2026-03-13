import { useEffect } from 'react'
import { usePlannerStore } from '../store/plannerStore'

export function useFilamentSheet() {
  const setFilamentData = usePlannerStore(s => s.setFilamentData)

  useEffect(() => {
    setFilamentData(__FILAMENT_DATA__)
  }, [setFilamentData])
}
