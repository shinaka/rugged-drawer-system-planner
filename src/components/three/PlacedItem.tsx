import { usePlannerStore } from '../../store/plannerStore'
import { getProfile } from '../../data/drawerCatalog'
import DrawerFrame from './DrawerFrame'
import type { Placement } from '../../types'

interface Props {
  placement: Placement
}

export default function PlacedItem({ placement }: Props) {
  const selectedId = usePlannerStore(s => s.selectedId)
  const heldItem = usePlannerStore(s => s.heldItem)
  const selectPlacement = usePlannerStore(s => s.selectPlacement)
  const startMove = usePlannerStore(s => s.startMove)

  const profile = getProfile(placement.profileId)
  if (!profile) return null

  const isSelected = selectedId === placement.id

  function handleClick() {
    // ignore clicks on items while in placement/move mode
    if (heldItem) return

    if (isSelected) {
      // Second click on selected, pick it up for repositioning
      startMove(placement.id)
    } else {
      selectPlacement(placement.id)
    }
  }

  return (
    <DrawerFrame
      profile={profile}
      position={placement.position}
      rotation={placement.rotation}
      selected={isSelected}
      onClick={handleClick}
    />
  )
}
