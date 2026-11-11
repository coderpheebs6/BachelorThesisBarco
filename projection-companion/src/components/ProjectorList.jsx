import { useState } from 'react'
import { Check, Info, Plus } from 'lucide-react'
import SidebarSection from './SidebarSection'

export default function ProjectorList() {
  const [projectors, setProjectors] = useState([
    { id: 1, name: 'P1 - Left projector', camera: 'Camera 1', connected: true },
    { id: 2, name: 'P2 - Right projector', camera: 'Camera 2', connected: true },
  ])

  const addProjector = () => {
    setProjectors((current) => [
      ...current,
      {
        id: current.length + 1,
        name: `P${current.length + 1} - New projector`,
        camera: 'Camera',
        connected: false,
      },
    ])
  }

  return (
    <SidebarSection>
      <div className="card-title-row">
        <div>
          <strong>Projectors</strong>
          <small>{projectors.length} projector(s), 1 camera(s) connected</small>
        </div>
        <button type="button" className="icon-button" aria-label="Add projector" onClick={addProjector}>
          <Plus size={16} />
        </button>
      </div>
      {projectors.map((projector) => (
        <div className="projector-row" key={projector.id}>
          <span className="projector-preview" />
          <span className="projector-details">
            <strong>{projector.name}</strong>
            <small>{projector.camera}</small>
          </span>
          <span className={`connection-status ${projector.connected ? 'connected' : ''}`}>
            <Check size={12} />
          </span>
        </div>
      ))}
      <div className="info-note">
        <Info size={16} />
        <span>More than two cameras connected - some projectors may be outside the camera&apos;s view.</span>
      </div>
      <div className="camera-row">
        <span className="projector-preview" />
        <span>Camera&apos;s matching</span>
        <Check size={14} className="green-icon" />
      </div>
    </SidebarSection>
  )
}
