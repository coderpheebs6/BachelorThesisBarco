import { useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import ProjectionSidebar from '../src/components/ProjectionSidebar'

const cubeHeight = 1
// Cubes must overlap substantially before they can stack.
const snapDistance = 0.35
const initialCube = { id: 1, position: [-2, 0.5, 0], rotation: 0 }

// Converts pointer input to a position on the horizontal grid.
function pointerOnGrid(event, camera, gl, raycaster, plane, intersection) {
  const pointer = new THREE.Vector2(
    (event.clientX / gl.domElement.clientWidth) * 2 - 1,
    -(event.clientY / gl.domElement.clientHeight) * 2 + 1,
  )
  raycaster.current.setFromCamera(pointer, camera)
  return raycaster.current.ray.intersectPlane(plane.current, intersection.current)
}

// Renders one cube and handles selection, dragging, and rotation.
function TestCube({
  cube,
  selected,
  onSelect,
  onMove,
  onBeginDrag,
  onRotate,
  onDragChange,
}) {
  const { camera, gl } = useThree()
  const lastPointer = useRef({ x: 0, y: 0 })
  const raycaster = useRef(new THREE.Raycaster())
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5))
  const intersection = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())
  const movingIds = useRef([])
  const snapped = useRef(false)

  return (
    <mesh
      position={cube.position}
      rotation={[0, cube.rotation, 0]}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(cube.id)
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect(cube.id)
        movingIds.current = onBeginDrag(cube.id)
        snapped.current = false
        lastPointer.current = { x: event.clientX, y: event.clientY }
        if (pointerOnGrid(event, camera, gl, raycaster, plane, intersection)) {
          offset.current.set(
            cube.position[0] - intersection.current.x,
            0,
            cube.position[2] - intersection.current.z,
          )
        }
        onDragChange(true)
        event.target.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!event.buttons || snapped.current) return
        event.stopPropagation()
        if (event.shiftKey) {
          onRotate(cube.id, cube.rotation + (event.clientX - lastPointer.current.x) * 0.01)
        } else if (pointerOnGrid(event, camera, gl, raycaster, plane, intersection)) {
          const didSnap = onMove(cube.id, movingIds.current, [
            intersection.current.x + offset.current.x,
            intersection.current.z + offset.current.z,
          ])
          snapped.current = didSnap
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
      <meshStandardMaterial color={selected ? 'hotpink' : 'steelblue'} />
    </mesh>
  )
}

// Displays the cubes, grid, lights, and camera controls.
function StackingScene({
  cubes,
  selectedId,
  onSelect,
  onMove,
  onBeginDrag,
  onRotate,
  onDragChange,
  dragging,
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      {cubes.map((cube) => (
        <TestCube
          key={cube.id}
          cube={cube}
          selected={cube.id === selectedId}
          onSelect={onSelect}
          onMove={onMove}
          onBeginDrag={onBeginDrag}
          onRotate={onRotate}
          onDragChange={onDragChange}
        />
      ))}
      <Grid args={[10, 10]} />
      <OrbitControls makeDefault enabled={!dragging} />
    </>
  )
}

// Provides controls for adding, stacking, moving, and removing cubes.
export default function StackingTests() {
  const [cubes, setCubes] = useState([initialCube])
  const [selectedId, setSelectedId] = useState(initialCube.id)
  const [nextId, setNextId] = useState(2)
  const [dragging, setDragging] = useState(false)

  // Adds a new cube at the centre of the grid.
  const addCube = () => {
    setCubes((current) => [
      ...current,
      { id: nextId, position: [-2 - current.length * 1.5, 0.5, 0], rotation: 0 },
    ])
    setSelectedId(nextId)
    setNextId((id) => id + 1)
  }

  // Places the selected cube on top of the highest cube at the same grid position.
  const stackSelected = () => {
    setCubes((current) => {
      const selected = current.find((cube) => cube.id === selectedId)
      if (!selected) return current
      const below = current.filter(
        (cube) =>
          cube.id !== selectedId &&
          Math.abs(cube.position[0] - selected.position[0]) < 0.5 &&
          Math.abs(cube.position[2] - selected.position[2]) < 0.5,
      )
      const highest = below.reduce(
        (height, cube) => Math.max(height, cube.position[1]),
        0,
      )
      return current.map((cube) =>
        cube.id === selectedId
          ? { ...cube, position: [selected.position[0], highest + cubeHeight, selected.position[2]] }
          : cube,
      )
    })
  }

  // Removes the selected cube and selects another remaining cube.
  const removeSelected = () => {
    setCubes((current) => current.filter((cube) => cube.id !== selectedId))
    setSelectedId((id) => cubes.find((cube) => cube.id !== id)?.id ?? null)
  }

  // Detaches only the selected top cube, or keeps the complete stack together.
  const beginDrag = (id) => {
    const selected = cubes.find((cube) => cube.id === id)
    if (!selected) return []

    const stackAbove = cubes
      .filter(
        (cube) =>
          cube.position[0] === selected.position[0] &&
          cube.position[2] === selected.position[2] &&
          cube.position[1] >= selected.position[1],
      )
      .sort((a, b) => a.position[1] - b.position[1])

    const movingIds = stackAbove.map((cube) => cube.id)
    if (movingIds.length === 1 && selected.position[1] > cubeHeight / 2) {
      setCubes((current) =>
        current.map((cube) =>
          cube.id === id
            ? { ...cube, position: [cube.position[0], cubeHeight / 2, cube.position[2]] }
            : cube,
        ),
      )
    }
    return movingIds
  }

  // Moves a cube or complete stack and only snaps when it is centered over another cube.
  const moveCube = (id, movingIds, position) => {
    let didSnap = false
    setCubes((current) => {
      const moving = current.filter((cube) => movingIds.includes(cube.id))
      const dragged = current.find((cube) => cube.id === id)
      if (!dragged || moving.length === 0) return current

      const deltaX = position[0] - dragged.position[0]
      const deltaZ = position[1] - dragged.position[2]
      const nextX = dragged.position[0] + deltaX
      const nextZ = dragged.position[2] + deltaZ
      const target = current
        .filter((cube) => !movingIds.includes(cube.id))
        .map((cube) => ({
          cube,
          distance: Math.max(
            Math.abs(cube.position[0] - nextX),
            Math.abs(cube.position[2] - nextZ),
          ),
        }))
        .filter(({ distance }) => distance <= snapDistance)
        .sort((a, b) => a.distance - b.distance)[0]

      if (target) {
        didSnap = true
        const highest = current
          .filter(
            (cube) =>
              !movingIds.includes(cube.id) &&
              cube.position[0] === target.cube.position[0] &&
              cube.position[2] === target.cube.position[2],
          )
          .reduce((height, cube) => Math.max(height, cube.position[1]), 0)
        const baseY = highest + cubeHeight
        return current.map((cube) => {
          if (!movingIds.includes(cube.id)) return cube
          const relativeY = cube.position[1] - dragged.position[1]
          return {
            ...cube,
            position: [target.cube.position[0], baseY + relativeY, target.cube.position[2]],
          }
        })
      }

      return current.map((cube) => {
        if (!movingIds.includes(cube.id)) return cube
        return {
          ...cube,
          position: [
            cube.id === id ? nextX : cube.position[0] + deltaX,
            cube.id === id ? cubeHeight / 2 : cube.position[1],
            cube.id === id ? nextZ : cube.position[2] + deltaZ,
          ],
        }
      })
    })
    return didSnap
  }

  // Updates one cube's horizontal rotation.
  const rotateCube = (id, rotation) => {
    setCubes((current) => current.map((cube) => (cube.id === id ? { ...cube, rotation } : cube)))
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [5, 4, 5], fov: 50 }}>
        <StackingScene
          cubes={cubes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={moveCube}
          onBeginDrag={beginDrag}
          onRotate={rotateCube}
          onDragChange={setDragging}
          dragging={dragging}
        />
      </Canvas>
      <ProjectionSidebar />
      <aside
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          width: 220,
          padding: 18,
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.94)',
          color: '#20202a',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.18)',
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Stacking</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          <button type="button" onClick={addCube}>Add cube</button>
          <button type="button" onClick={stackSelected} disabled={!selectedId}>Stack</button>
          <button type="button" onClick={removeSelected} disabled={!selectedId}>Remove</button>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>Cubes: {cubes.length}</p>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>
          Selected: {selectedId ?? 'none'}
        </p>
      </aside>
    </div>
  )
}
