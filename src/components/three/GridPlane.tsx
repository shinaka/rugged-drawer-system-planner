import { Grid } from '@react-three/drei'

const GRID_SIZE = 42 * 20 // 20 cells in each direction

export default function GridPlane() {
  return (
    <>
      {/* Solid ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[GRID_SIZE * 2, GRID_SIZE * 2]} />
        <meshStandardMaterial color="#0d1117" />
      </mesh>

      {/* Gridfinity 42mm grid overlay */}
      <Grid
        position={[0, 0, 0]}
        args={[GRID_SIZE * 2, GRID_SIZE * 2]}
        cellSize={42}
        cellThickness={0.5}
        cellColor="#1e3a5f"
        sectionSize={42 * 4}
        sectionThickness={1.2}
        sectionColor="#2d5a8f"
        fadeDistance={GRID_SIZE * 2}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
    </>
  )
}
