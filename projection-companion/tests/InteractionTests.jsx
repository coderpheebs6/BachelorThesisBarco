import { useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// The cube sits on top of the grid.
const initialPosition = [0, 0.5, 0]

// Renders the cube and handles moving and rotating it with pointer input.
function InteractiveCube({ position, rotation, onMove, onRotate, onDragChange }) {
  const [active, setActive] = useState(false)
  // Used to calculate rotation from horizontal pointer movement.
  const lastPointer = useRef({ x: 0, y: 0 })
  const { camera, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  // The cube moves on this horizontal plane.
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5))
  const intersection = useRef(new THREE.Vector3())
  // Keeps the cube under the same point of the pointer while dragging.
  const dragOffset = useRef(new THREE.Vector3())

  // Converts the pointer position to a position on the horizontal grid.
  const updatePosition = (event) => {
    const pointer = new THREE.Vector2(
      (event.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(event.clientY / gl.domElement.clientHeight) * 2 + 1,
    )
    raycaster.current.setFromCamera(pointer, camera)
    if (raycaster.current.ray.intersectPlane(dragPlane.current, intersection.current)) {
      onMove([
        intersection.current.x + dragOffset.current.x,
        0.5,
        intersection.current.z + dragOffset.current.z,
      ])
    }
  }

  return (
    <mesh
      position={position}
      rotation={[0, rotation, 0]}
      onClick={() => setActive(true)}
      onPointerDown={(event) => {
        event.stopPropagation()
        lastPointer.current = { x: event.clientX, y: event.clientY }
        const pointer = new THREE.Vector2(
          (event.clientX / gl.domElement.clientWidth) * 2 - 1,
          -(event.clientY / gl.domElement.clientHeight) * 2 + 1,
        )
        raycaster.current.setFromCamera(pointer, camera)
        if (raycaster.current.ray.intersectPlane(dragPlane.current, intersection.current)) {
          dragOffset.current.set(
            position[0] - intersection.current.x,
            0,
            position[2] - intersection.current.z,
          )
        }
        onDragChange(true)
        event.target.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!event.buttons) return
        event.stopPropagation()
        if (event.shiftKey) {
          onRotate(rotation + (event.clientX - lastPointer.current.x) * 0.01)
        } else {
          updatePosition(event)
        }
        lastPointer.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerUp={(event) => {
        event.stopPropagation()
        onDragChange(false)
        event.target.releasePointerCapture(event.pointerId)
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={active ? 'hotpink' : 'steelblue'} />
    </mesh>
  )
}

// Combines the interactive cube, grid, lights, and camera controls.
function TestScene({
  onPositionChange,
  onRotationChange,
  onDragChange,
  position,
  rotation,
  dragging,
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <InteractiveCube
        position={position}
        rotation={rotation}
        onMove={onPositionChange}
        onRotate={onRotationChange}
        onDragChange={onDragChange}
      />
      <Grid args={[10, 10]} />
      <OrbitControls makeDefault enabled={!dragging} />
    </>
  )
}

// Displays the interaction test scene and the current test results.
export default function InteractionTests() {
  const [position, setPosition] = useState(initialPosition)
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState(false)

  // Tracks whether the cube is currently being dragged.
  const updateDragging = (value) => setDragging(value)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [4, 3, 4], fov: 50 }}>
        <TestScene
          position={position}
          rotation={rotation}
          onPositionChange={setPosition}
          onRotationChange={setRotation}
          onDragChange={updateDragging}
          dragging={dragging}
        />
      </Canvas>
      <aside
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 280,
          padding: 18,
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.94)',
          color: '#20202a',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.18)',
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: 20 }}>Scene interactie tests</h1>
        <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.6 }}>
          <li>Klik op de cube om hem te selecteren.</li>
          <li>Sleep de cube over het grid om de positie te wijzigen.</li>
          <li>Houd Shift ingedrukt en sleep horizontaal om te roteren.</li>
        </ol>
        <p style={{ margin: '14px 0 0', fontSize: 14 }}>
          Status: {dragging ? 'bezig met slepen' : 'klaar'}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>
          Positie: ({position[0].toFixed(2)}, {position[2].toFixed(2)})
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>
          Rotatie: {(THREE.MathUtils.radToDeg(rotation) % 360).toFixed(0)}°
        </p>
      </aside>
    </div>
  )
}
