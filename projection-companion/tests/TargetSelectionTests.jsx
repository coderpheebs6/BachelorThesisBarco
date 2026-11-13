import { useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Grid, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import projectorModelUrl from '../src/models/generic_white_digital_projector/scene.gltf?url'
import towerModelUrl from '../src/models/christmas-clock-tower.glb?url'

const initialProjectors = [
  { id: 1, position: [-3, 0.225, 2], rotation: Math.PI },
  { id: 2, position: [3, 0.225, 2], rotation: Math.PI },
]

function NormalizedModel({ modelUrl, height = 1, onPointerDown }) {
  const { scene } = useGLTF(modelUrl)
  const model = useMemo(() => {
    const clone = scene.clone()
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = height / size.y

    clone.scale.setScalar(scale)
    clone.position.set(
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale,
    )
    return clone
  }, [height, scene])

  return <primitive object={model} onPointerDown={onPointerDown} />
}

function ProjectorBeam({ position, rotation, targetCorners }) {
  const { lineGeometry, fillGeometry } = useMemo(() => {
    const forward = new THREE.Vector3(Math.sin(rotation), 0, Math.cos(rotation))
    const origin = new THREE.Vector3(...position).addScaledVector(forward, 0.45)
    const targetCenter = targetCorners
      ? targetCorners.reduce(
        (center, point) => center.add(new THREE.Vector3(...point)),
        new THREE.Vector3(),
      ).multiplyScalar(1 / targetCorners.length)
      : origin.clone().addScaledVector(forward, 5)
    const direction = targetCorners
      ? targetCenter.clone().sub(origin).normalize()
      : forward

    const side = new THREE.Vector3(direction.z, 0, -direction.x).normalize()
    origin.addScaledVector(side, 0.18)
    origin.y = 0.2
    const targets = targetCorners?.map((point) => new THREE.Vector3(...point)) ?? [
      targetCenter.clone().addScaledVector(side, -1.15),
      targetCenter.clone().addScaledVector(side, 1.15),
    ]
    const linePoints = targets.flatMap((point) => [origin, point])
    const line = new THREE.BufferGeometry().setFromPoints(linePoints)
    const fill = new THREE.BufferGeometry()
    const fillPoints = targets.length === 4
      ? [origin, targets[0], targets[1], origin, targets[1], targets[2], origin, targets[2], targets[3]]
      : [origin, targets[0], targets[1]]
    fill.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        fillPoints.flatMap((point) => point.toArray()),
        3,
      ),
    )
    return { lineGeometry: line, fillGeometry: fill }
  }, [position, rotation, targetCorners])

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

function SelectedSurface({ surface }) {
  const geometry = useMemo(() => {
    if (!surface) return null
    const nextGeometry = new THREE.BufferGeometry()
    nextGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(surface.vertices.flatMap((point) => point), 3),
    )
    nextGeometry.computeVertexNormals()
    return nextGeometry
  }, [surface])

  if (!geometry) return null
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#c084fc"
        transparent
        opacity={0.75}
        side={THREE.DoubleSide}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  )
}

function Projector({
  projector,
  selected,
  onSelect,
  onMove,
  onRotate,
  onDragChange,
}) {
  const { camera, gl } = useThree()
  const lastPointer = useRef({ x: 0, y: 0 })
  const raycaster = useRef(new THREE.Raycaster())
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const intersection = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())

  const pointerOnGrid = (event) => {
    const pointer = new THREE.Vector2(
      (event.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(event.clientY / gl.domElement.clientHeight) * 2 + 1,
    )
    raycaster.current.setFromCamera(pointer, camera)
    return raycaster.current.ray.intersectPlane(plane.current, intersection.current)
  }

  return (
    <group
      position={projector.position}
      rotation={[0, projector.rotation, 0]}
      scale={selected ? 1.08 : 1}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect(projector.id)
        lastPointer.current = { x: event.clientX, y: event.clientY }
        if (pointerOnGrid(event)) {
          offset.current.set(
            projector.position[0] - intersection.current.x,
            0,
            projector.position[2] - intersection.current.z,
          )
        }
        onDragChange(true)
        event.target.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!event.buttons) return
        event.stopPropagation()
        if (event.shiftKey) {
          onRotate(
            projector.id,
            projector.rotation + (event.clientX - lastPointer.current.x) * 0.01,
          )
        } else if (pointerOnGrid(event)) {
          onMove(projector.id, [
            intersection.current.x + offset.current.x,
            0.225,
            intersection.current.z + offset.current.z,
          ])
        }
        lastPointer.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerUp={(event) => {
        event.stopPropagation()
        onDragChange(false)
        event.target.releasePointerCapture(event.pointerId)
      }}
    >
      <NormalizedModel modelUrl={projectorModelUrl} height={0.45} />
    </group>
  )
}

function TargetSelectionScene({
  projectors,
  selectedId,
  targets,
  surface,
  onProjectorSelect,
  onTargetSelect,
  onMove,
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
      <NormalizedModel
        modelUrl={towerModelUrl}
        height={6}
        onPointerDown={(event) => {
          event.stopPropagation()
          onTargetSelect(event)
        }}
      />
      <SelectedSurface surface={surface} />
      {projectors.map((projector) => (
        <group key={projector.id}>
          <ProjectorBeam
            position={projector.position}
            rotation={projector.rotation}
            targetCorners={targets[projector.id]}
          />
          <Projector
            projector={projector}
            selected={projector.id === selectedId}
            onSelect={onProjectorSelect}
            onMove={onMove}
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

export default function TargetSelectionTests() {
  const [selectedId, setSelectedId] = useState(initialProjectors[0].id)
  const [targets, setTargets] = useState({})
  const [surface, setSurface] = useState(null)
  const [projectors, setProjectors] = useState(initialProjectors)
  const [dragging, setDragging] = useState(false)

  const selectTarget = (event) => {
    const { object, faceIndex } = event
    if (!object.geometry?.attributes.position || faceIndex === undefined) return
    const index = object.geometry.index
    const vertexIndices = index
      ? [index.getX(faceIndex * 3), index.getX(faceIndex * 3 + 1), index.getX(faceIndex * 3 + 2)]
      : [faceIndex * 3, faceIndex * 3 + 1, faceIndex * 3 + 2]
    const vertices = vertexIndices.map((vertexIndex) => {
      const vertex = new THREE.Vector3().fromBufferAttribute(
        object.geometry.attributes.position,
        vertexIndex,
      )
      return vertex.applyMatrix4(object.matrixWorld).toArray()
    })
    setTargets((current) => ({
      ...current,
      [selectedId]: vertices,
    }))
    setSurface({ vertices })
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [5, 4, 5], fov: 50 }}>
        <TargetSelectionScene
          projectors={projectors}
          selectedId={selectedId}
          targets={targets}
          surface={surface}
          onProjectorSelect={setSelectedId}
          onTargetSelect={selectTarget}
          onMove={(id, position) => setProjectors((current) => current.map((projector) => (
            projector.id === id ? { ...projector, position } : projector
          )))}
          onRotate={(id, rotation) => setProjectors((current) => current.map((projector) => (
            projector.id === id ? { ...projector, rotation } : projector
          )))}
          onDragChange={setDragging}
          dragging={dragging}
        />
      </Canvas>
      <aside
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          width: 240,
          padding: 18,
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.94)',
          color: '#20202a',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.18)',
        }}
      >
        <strong>Target selection test</strong>
        <p style={{ margin: '8px 0 0', fontSize: 14 }}>
          Projector {selectedId} is selected. Drag a projector to move it, or
          hold Shift while dragging to rotate it. Then click one surface of a
          wall, roof, or door. Only that clicked surface turns purple.
        </p>
      </aside>
    </div>
  )
}

useGLTF.preload(projectorModelUrl)
useGLTF.preload(towerModelUrl)
