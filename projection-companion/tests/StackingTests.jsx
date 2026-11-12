import { useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Grid, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import ProjectionSidebar from '../src/components/ProjectionSidebar'
import onionModelUrl from '../src/models/onion-model.gltf/yellow_onion_4k.gltf?url'

const cubeHeight = 1
// Cubes must overlap substantially before they can stack.
const snapDistance = 0.35
const initialCube = { id: 1, position: [0, 0.5, 0], rotation: 0 }

// Converts pointer input to a position on the horizontal grid.
function pointerOnGrid(event, camera, gl, raycaster, plane, intersection) {
  const pointer = new THREE.Vector2(
    (event.clientX / gl.domElement.clientWidth) * 2 - 1,
    -(event.clientY / gl.domElement.clientHeight) * 2 + 1,
  )
  raycaster.current.setFromCamera(pointer, camera)
  return raycaster.current.ray.intersectPlane(plane.current, intersection.current)
}

// Loads a reusable onion model for each scene object.
function OnionModel({ modelUrl }) {
  const { scene } = useGLTF(modelUrl)
  const model = useMemo(() => {
    const clone = scene.clone()
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = 1 / Math.max(size.x, size.y, size.z)

    clone.scale.setScalar(scale)
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    return clone
  }, [scene])

  return <primitive object={model} />
}

// Projects a purple trapezoid from the projector lens onto the grid.
function ProjectorBeam({ position, rotation }) {
  const { lineGeometry, fillGeometry } = useMemo(() => {
    // Use the same Y rotation as the projector model.
    const forward = new THREE.Vector3(Math.sin(rotation), 0, Math.cos(rotation))
    const side = new THREE.Vector3(forward.z, 0, -forward.x).normalize()
    const origin = new THREE.Vector3(...position).addScaledVector(
      forward,
      0.45,
    )
    origin.addScaledVector(side, 0.18)
    origin.y = 0.2
    const targetCenter = origin.clone().addScaledVector(forward, 5)
    targetCenter.y = 0.02
    const leftTarget = targetCenter.clone().addScaledVector(side, -1.15)
    const rightTarget = targetCenter.clone().addScaledVector(side, 1.15)
    const line = new THREE.BufferGeometry().setFromPoints([
      origin,
      leftTarget,
      origin,
      rightTarget,
    ])
    const fill = new THREE.BufferGeometry()
    fill.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [...origin.toArray(), ...leftTarget.toArray(), ...rightTarget.toArray()],
        3,
      ),
    )
    return { lineGeometry: line, fillGeometry: fill }
  }, [position, rotation])

  return (
    <>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color="#b76cff" transparent opacity={0.9} />
      </line>
      <mesh geometry={fillGeometry}>
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

// Renders one onion and handles selection, dragging, and rotation.
function TestCube({
  cube,
  modelUrl,
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
    <group
      position={cube.position}
      rotation={[0, cube.rotation, 0]}
      scale={selected ? 1.05 : 1}
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
      <OnionModel modelUrl={modelUrl} />
    </group>
  )
}

useGLTF.preload(onionModelUrl)

// Displays the cubes, grid, lights, and camera controls.
function StackingScene({
  cubes,
  modelUrl,
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
      <color attach="background" args={['#171922']} />
      <fog attach="fog" args={['#171922', 10, 28]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      {cubes.map((cube) => (
        <group key={cube.id}>
          <ProjectorBeam position={cube.position} rotation={cube.rotation} />
          <TestCube
            cube={cube}
            modelUrl={modelUrl}
            selected={cube.id === selectedId}
            onSelect={onSelect}
            onMove={onMove}
            onBeginDrag={onBeginDrag}
            onRotate={onRotate}
            onDragChange={onDragChange}
          />
        </group>
      ))}
      <Grid
        infiniteGrid
        args={[100, 100]}
        cellSize={0.5}
        sectionSize={2.5}
        cellThickness={0.5}
        sectionThickness={1}
        cellColor="#343746"
        sectionColor="#656b80"
        fadeDistance={60}
        fadeStrength={0.35}
      />
      <OrbitControls makeDefault enabled={!dragging} />
    </>
  )
}

// Provides controls for adding, stacking, moving, and removing cubes.
export default function StackingTests({
  modelUrl = onionModelUrl,
  objectLabel = 'onion',
  initialObjects = [initialCube],
}) {
  const [cubes, setCubes] = useState(initialObjects)
  const [selectedId, setSelectedId] = useState(initialObjects[0]?.id ?? null)
  const [nextId, setNextId] = useState(
    initialObjects.reduce((highest, object) => Math.max(highest, object.id), 0) + 1,
  )
  const [dragging, setDragging] = useState(false)

  // Adds a new cube at the centre of the grid.
  const addCube = () => {
    setCubes((current) => [
      ...current,
      { id: nextId, position: [current.length * 1.5, 0.5, 0], rotation: Math.PI },
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
          modelUrl={modelUrl}
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
          <button type="button" onClick={addCube}>Add {objectLabel}</button>
          <button type="button" onClick={stackSelected} disabled={!selectedId}>Stack</button>
          <button type="button" onClick={removeSelected} disabled={!selectedId}>Remove</button>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          {objectLabel[0].toUpperCase() + objectLabel.slice(1)}s: {cubes.length}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>
          Selected: {selectedId ?? 'none'}
        </p>
      </aside>
    </div>
  )
}
