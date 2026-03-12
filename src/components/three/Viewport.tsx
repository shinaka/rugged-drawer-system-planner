import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { usePlannerStore } from '../../store/plannerStore'
import { useSnapPosition } from '../../hooks/useSnap'
import GridPlane from './GridPlane'
import GhostPreview from './GhostPreview'
import PlacedItem from './PlacedItem'
import { useEffect } from 'react'

export interface ViewportHandle {
  resetCamera: () => void
}

const GROUND_Y = 0

// Inner scene component that has access to R3F context
function Scene({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl> }) {
  const { camera, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y))
  const planeHit = useRef(new THREE.Vector3())

  const heldItem = usePlannerStore(s => s.heldItem)
  const addPlacement = usePlannerStore(s => s.addPlacement)
  const selectPlacement = usePlannerStore(s => s.selectPlacement)
  const setGhostPosition = usePlannerStore(s => s.setGhostPosition)
  const setGhostValid = usePlannerStore(s => s.setGhostValid)
  const ghostPosition = usePlannerStore(s => s.ghostPosition)
  const ghostValid = usePlannerStore(s => s.ghostValid)
  const placements = usePlannerStore(s => s.placements)

  const getSnappedPosition = useSnapPosition()

  // Dynamic ground plane that follows stack height when holding an item
  const updateGhostFromPointer = useCallback((event: PointerEvent) => {
    if (!heldItem) return

    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera)

    // Ray-cast against Y=0 plane initially to get XZ
    const tempPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const tempHit = new THREE.Vector3()
    if (!raycaster.current.ray.intersectPlane(tempPlane, tempHit)) return

    const { position, valid } = getSnappedPosition(tempHit.x, tempHit.z)

    // Update the ground plane to the snapped Y for accurate placement
    groundPlane.current.constant = -position[1]
    if (raycaster.current.ray.intersectPlane(groundPlane.current, planeHit.current)) {
      setGhostPosition(position)
      setGhostValid(valid)
    }
  }, [heldItem, camera, gl, getSnappedPosition, setGhostPosition, setGhostValid])

  const handlePointerMove = useCallback((event: PointerEvent) => {
    updateGhostFromPointer(event)
  }, [updateGhostFromPointer])

  const handleClick = useCallback(() => {
    if (!heldItem) return
    if (ghostPosition && ghostValid) {
      addPlacement(heldItem, ghostPosition)
    }
  }, [heldItem, ghostPosition, ghostValid, addPlacement])

  const handlePointerLeave = useCallback(() => {
    setGhostPosition(null)
  }, [setGhostPosition])

  useEffect(() => {
    const el = gl.domElement
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('click', handleClick)
    el.addEventListener('pointerleave', handlePointerLeave)
    return () => {
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('click', handleClick)
      el.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [handlePointerMove, handleClick, handlePointerLeave, gl.domElement])

  // click on empty ground to deselect
  function handleGroundClick(e: THREE.Event) {
    if (heldItem) return
    // @ts-expect-error stopPropagation exists on R3F events
    e.stopPropagation?.()
    selectPlacement(null)
  }

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={1.0} />
      <directionalLight
        position={[200, 400, 200]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={2000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />
      {/* Front fill — camera looks toward -Z so we light from that side */}
      <directionalLight position={[-200, 300, -500]} intensity={0.9} />
      <hemisphereLight args={['#2a3a5a', '#0a0f1a', 0.5]} />

      {/* Grid ground */}
      <GridPlane />

      {/* Invisible click-target for ground (deselect) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
        onClick={handleGroundClick}
        visible={false}
      >
        <planeGeometry args={[42 * 40, 42 * 40]} />
        <meshBasicMaterial />
      </mesh>

      {/* Placed drawers */}
      {placements.map(p => (
        <PlacedItem key={p.id} placement={p} orbitRef={controlsRef} />
      ))}

      {/* Ghost preview */}
      <GhostPreview />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={50}
        maxDistance={3000}
        mouseButtons={{
          LEFT: heldItem ? undefined : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  )
}

const Viewport = forwardRef<ViewportHandle>((_, ref) => {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  useImperativeHandle(ref, () => ({
    resetCamera() {
      if (controlsRef.current) {
        controlsRef.current.reset()
      }
    },
  }))

  return (
    <Canvas
      shadows
      camera={{ position: [300, 400, 500], fov: 45, near: 1, far: 5000 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0d1117' }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <Scene controlsRef={controlsRef} />
    </Canvas>
  )
})

Viewport.displayName = 'Viewport'

export default Viewport
