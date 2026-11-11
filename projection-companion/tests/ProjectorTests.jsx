import StackingTests from './StackingTests'
import projectorModelUrl from '../src/models/generic_white_digital_projector/scene.gltf?url'

// Runs the stacking interaction tests with the projector model.
export default function ProjectorTests() {
  return (
    <StackingTests
      modelUrl={projectorModelUrl}
      objectLabel="projector"
      initialObjects={[
        { id: 1, position: [-3, 0.5, 2], rotation: Math.PI },
        { id: 2, position: [3, 0.5, 2], rotation: Math.PI },
      ]}
    />
  )
}
