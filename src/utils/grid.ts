export const GRID_UNIT = 42 // mm

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_UNIT) * GRID_UNIT
}

export function snapPosition(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  return [snapToGrid(x), y, snapToGrid(z)]
}

export function xzOverlaps(
  ax: number, az: number, aw: number, ad: number,
  bx: number, bz: number, bw: number, bd: number,
): boolean {
  const aHW = aw / 2, aHD = ad / 2
  const bHW = bw / 2, bHD = bd / 2
  return (
    Math.abs(ax - bx) < aHW + bHW - 0.1 &&
    Math.abs(az - bz) < aHD + bHD - 0.1
  )
}
