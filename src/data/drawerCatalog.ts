import type { DrawerProfile } from '../types'

// MakerWorld URL: MW_BASE#profileId-{instance.id}
//
// To update profile IDs when new sizes are added, run this in the browser console
// on the MakerWorld model page:
//
//   JSON.parse(document.getElementById('__NEXT_DATA__').textContent)
//     .props.pageProps.design.instances.map(i => ({ id: i.id, title: i.title }))

const H1_MM = 42   // standard height
const H2_MM = 84   // double high height (2 × 42mm Gridfinity units)

const COMPAT = ['X1C', 'P1S', 'H2x', 'A1']

const PROFILE_IDS: Record<string, number> = {
  // H1 Standard
  '2x2_h1': 751765,
  '2x3_h1': 948677,
  '2x4_h1': 756910,
  '2x5_h1': 755167,
  '3x1_h1': 1434394,
  '3x2_h1': 751762,
  '3x3_h1': 1162657,
  '3x5_h1': 751683,
  '3x6_h1': 1013303,
  '4x1_h1': 1012238,
  '4x2_h1': 931929,
  '4x3_h1': 1021224,
  '4x5_h1': 880975,
  '4x6_h1': 789089,
  '5x1_h1': 2479054,
  '5x2_h1': 1340249,
  '5x3_h1': 1140127,
  '5x4_h1': 1139980,
  '5x5_h1': 1102667,
  '5x6_h1': 1104963,
  '6x1_h1': 2479178,
  '6x2_h1': 2294402,
  '6x3_h1': 1771428,
  '6x4_h1': 1826692,
  '6x5_h1': 2284744,
  '6x6_h1': 1706772,

  // H2 Double High
  '2x2_h2': 2113958,
  '2x6_h2': 1760203,
  '3x3_h2': 2177941,
  '3x4_h2': 890025,
  '3x5_h2': 813147,
  '3x6_h2': 1375944,
  '3x7_h2': 1761006,
  '4x2_h2': 1016817,
  '4x3_h2': 1172643,
  '4x4_h2': 940698,
  '4x5_h2': 950435,
  '4x6_h2': 886983,
  '4x7_h2': 1760808,
  '5x2_h2': 1992114,
  '5x3_h2': 1150495,
  '5x4_h2': 1167504,
  '5x5_h2': 1131366,
  '5x6_h2': 1114273,
  '5x7_h2': 1756922,
  '6x3_h2': 1771110,
  '6x4_h2': 1706696,
  '6x6_h2': 1931612,

  // Special / Mini / Multi-drawer
  '4x4_mini':    845919,
  '3x4_mini_1':  751700,
  '3x4_mini_2':  751700,  // same profile set as mini_1
  '5x6_stacked': 2204290,
  '3x5_stacked': 2197232,
  '2x4_mini_h2': 1249382,

  // Baseplates (all sizes share the same multi-plate profile)
  'baseplate_2x2': 755201,
  'baseplate_3x2': 755201,
  'baseplate_3x3': 755201,
  'baseplate_4x2': 755201,
  'baseplate_4x3': 755201,
  'baseplate_4x4': 755201,
  'baseplate_5x2': 755201,
  'baseplate_5x3': 755201,
  'baseplate_5x4': 755201,
  'baseplate_5x5': 755201,
  'baseplate_6x2': 755201,
  'baseplate_6x3': 755201,
  'baseplate_6x4': 755201,
  'baseplate_6x6': 755201,
}

// Note: naming convention is depth-first (e.g. "6×2" = 6 deep, 2 wide)
function makeH1(depth: number, width: number): DrawerProfile {
  const id = `${depth}x${width}_h1`
  return {
    id,
    name: `${depth}×${width} Standard`,
    gridWidth: width,
    gridDepth: depth,
    heightType: 'H1',
    heightMm: H1_MM,
    printerCompatibility: COMPAT,
    makerWorldProfileId: PROFILE_IDS[id]?.toString(),
    category: 'standard',
    color: '#3b82f6',
  }
}

function makeH2(depth: number, width: number): DrawerProfile {
  const id = `${depth}x${width}_h2`
  return {
    id,
    name: `${depth}×${width} Double High`,
    gridWidth: width,
    gridDepth: depth,
    heightType: 'H2',
    heightMm: H2_MM,
    printerCompatibility: COMPAT,
    makerWorldProfileId: PROFILE_IDS[id]?.toString(),
    category: 'standard',
    color: '#6366f1',
  }
}

function makeSpecial(
  id: string,
  name: string,
  depth: number,
  width: number,
  heightMm: number,
): DrawerProfile {
  return {
    id,
    name,
    gridWidth: width,
    gridDepth: depth,
    heightType: heightMm > H1_MM ? 'H2' : 'H1',
    heightMm,
    printerCompatibility: COMPAT,
    makerWorldProfileId: PROFILE_IDS[id]?.toString(),
    category: 'divided',
    color: '#8b5cf6',
  }
}

export const drawerCatalog: DrawerProfile[] = [

  // H1 Standard
  // 2×
  makeH1(2, 2), makeH1(2, 3), makeH1(2, 4), makeH1(2, 5),

  // 3×
  makeH1(3, 1), makeH1(3, 2), makeH1(3, 3), makeH1(3, 5), makeH1(3, 6),
  // (3×4 exists only as mini variants — see Special section)

  // 4×
  makeH1(4, 1), makeH1(4, 2), makeH1(4, 3), makeH1(4, 5), makeH1(4, 6),
  // (4×4 exists only as mini variant — see Special section)

  // 5×
  makeH1(5, 1), makeH1(5, 2), makeH1(5, 3), makeH1(5, 4), makeH1(5, 5), makeH1(5, 6),

  // 6×
  makeH1(6, 1), makeH1(6, 2), makeH1(6, 3), makeH1(6, 4), makeH1(6, 5), makeH1(6, 6),

  // H2 Double High
  // 2×
  makeH2(2, 2), makeH2(2, 6),

  // 3×
  makeH2(3, 3), makeH2(3, 4), makeH2(3, 5), makeH2(3, 6), makeH2(3, 7),

  // 4×
  makeH2(4, 2), makeH2(4, 3), makeH2(4, 4), makeH2(4, 5), makeH2(4, 6), makeH2(4, 7),

  // 5×
  makeH2(5, 2), makeH2(5, 3), makeH2(5, 4), makeH2(5, 5), makeH2(5, 6), makeH2(5, 7),

  // 6×
  makeH2(6, 3), makeH2(6, 4), makeH2(6, 6),

  // Special / Mini / Multi-drawer
  makeSpecial('4x4_mini',       '4×4 Mini (2 side-by-side)',          4, 4, H1_MM),
  makeSpecial('3x4_mini_1',     '3×4 Mini (1 drawer)',                3, 4, H1_MM),
  makeSpecial('3x4_mini_2',     '3×4 Mini (2 drawers)',               3, 4, H1_MM),
  makeSpecial('5x6_stacked',    '5×6 Double Stacked (4 drawers)',     5, 6, H2_MM),
  makeSpecial('3x5_stacked',    '3×5 Double Stacked (4 drawers)',     3, 5, H2_MM),
  makeSpecial('2x4_mini_h2',    '2×4 Mini Double High (1 drawer)',    2, 4, H2_MM),

  // Baseplates
  ...[
    [2, 2], [3, 2], [3, 3],
    [4, 2], [4, 3], [4, 4],
    [5, 2], [5, 3], [5, 4], [5, 5],
    [6, 2], [6, 3], [6, 4], [6, 6],
  ].map(([depth, width]) => {
    const id = `baseplate_${depth}x${width}`
    return {
      id,
      name: `Baseplate ${depth}×${width}`,
      gridWidth: width,
      gridDepth: depth,
      heightType: 'H1' as const,
      heightMm: 5,
      printerCompatibility: COMPAT,
      makerWorldProfileId: PROFILE_IDS[id]?.toString(),
      category: 'baseplate' as const,
      color: '#10b981',
    }
  }),
]

export function getProfile(id: string): DrawerProfile | undefined {
  return drawerCatalog.find(p => p.id === id)
}

const MW_BASE = 'https://makerworld.com/en/models/810461-rugged-drawer-system-gridfinity-stackable'

export function getMakerWorldUrl(profile: DrawerProfile): string {
  if (profile.makerWorldProfileId) {
    return `${MW_BASE}#profileId-${profile.makerWorldProfileId}`
  }
  return MW_BASE
}
