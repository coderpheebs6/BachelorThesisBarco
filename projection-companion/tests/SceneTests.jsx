import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'

// Renders a cube that rotates and changes color when clicked.
function Cube() {
  const ref = useRef()
  const [active, setActive] = useState(false)

  useFrame((state, delta) => {
    ref.current.rotation.y += delta
  })

  return (
    <mesh
      ref={ref}
      position={[0, 1, 0]}
      onClick={() => setActive(!active)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={active ? 'hotpink' : 'steelblue'} />
    </mesh>
  )
}

// Displays the basic scene with lighting, a grid, and camera controls.
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [4, 3, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />

        <Cube />
        <Grid args={[10, 10]} />

        <OrbitControls />
      </Canvas>
    </div>
  )
}