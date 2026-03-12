import { usePlannerStore } from '../../store/plannerStore'
import { getProfile } from '../../data/drawerCatalog'
import DrawerFrame from './DrawerFrame'

export default function GhostPreview() {
  const heldItem = usePlannerStore(s => s.heldItem)
  const ghostPosition = usePlannerStore(s => s.ghostPosition)
  const ghostRotation = usePlannerStore(s => s.ghostRotation)
  const ghostValid = usePlannerStore(s => s.ghostValid)

  if (!heldItem || !ghostPosition) return null

  const profile = getProfile(heldItem.id)
  if (!profile) return null

  return (
    <DrawerFrame
      profile={profile}
      position={ghostPosition}
      rotation={ghostRotation}
      ghost
      valid={ghostValid}
    />
  )
}
