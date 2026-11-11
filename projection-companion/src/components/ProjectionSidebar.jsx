import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Eye,
  Info,
  Plus,
  Trash2,
} from 'lucide-react'
import './ProjectionSidebar.css'

function ModeSwitch() {
  const [advanced, setAdvanced] = useState(true)

  return (
    <div className="projection-mode">
      <button type="button" onClick={() => setAdvanced(false)} className={!advanced ? 'active' : ''}>
        Easy
      </button>
      <button type="button" onClick={() => setAdvanced(true)} className={advanced ? 'active' : ''}>
        Advanced
      </button>
    </div>
  )
}

function SectionCard({ children, className = '' }) {
  return <section className={`projection-card ${className}`}>{children}</section>
}

function AlignmentCard() {
  const [expanded, setExpanded] = useState(true)

  return (
    <SectionCard className="alignment-card">
      <button type="button" className="alignment-heading" onClick={() => setExpanded(!expanded)}>
        <span className="step-number">4</span>
        <span>
          <strong>Auto Alignment</strong>
          <small>Automatically align your projectors to the target surface.</small>
        </span>
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        <span className="status-dot" />
      </button>
      {expanded && <div className="alignment-progress">Ready to align</div>}
    </SectionCard>
  )
}

function ProjectorList() {
  const [projectors, setProjectors] = useState([
    { id: 1, name: 'P1 - Left projector', camera: 'Camera 1', connected: true },
    { id: 2, name: 'P2 - Right projector', camera: 'Camera 2', connected: true },
  ])

  return (
    <SectionCard>
      <div className="card-title-row">
        <div>
          <strong>Projectors</strong>
          <small>{projectors.length} projector(s), 1 camera(s) connected</small>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Add projector"
          onClick={() =>
            setProjectors((current) => [
              ...current,
              { id: current.length + 1, name: `P${current.length + 1} - New projector`, camera: 'Camera', connected: false },
            ])
          }
        >
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
    </SectionCard>
  )
}

function AlignmentControls() {
  return (
    <SectionCard className="controls-card">
      <strong>Alignment controls</strong>
      <button type="button" className="re-align-button">
        <span>◎</span>
        Re-align all
      </button>
    </SectionCard>
  )
}

function ProjectorSettings() {
  const [selectedProjector, setSelectedProjector] = useState('P1')

  return (
    <SectionCard className="settings-card">
      <div className="card-title-row">
        <strong>Projectors <span className="aligned-label">● Aligned</span></strong>
      </div>
      <div className="projector-tabs">
        {['P1', 'P2'].map((projector) => (
          <button
            type="button"
            key={projector}
            className={selectedProjector === projector ? 'active' : ''}
            onClick={() => setSelectedProjector(projector)}
          >
            <span className="projector-preview" />{projector}
          </button>
        ))}
      </div>
      <div className="settings-heading">
        <strong>Projector settings</strong>
        <small>Transform</small>
        <small>Device</small>
        <small>Controls</small>
      </div>
      <div className="value-grid">
        {['Position (m)', 'Rotation (°)', 'Orientation'].map((label, index) => (
          <div key={label}>
            <small>{label}</small>
            <div className="value-fields">
              {index === 0 && ['3.644', '0.890', '2.499'].map((value) => <span key={value}>{value}</span>)}
              {index === 1 && ['-4.7°', '62.3°', '3.4°'].map((value) => <span key={value}>{value}</span>)}
              {index === 2 && <><button type="button" className="active">Landscape</button><button type="button">Portrait</button></>}
            </div>
          </div>
        ))}
      </div>
      <div className="settings-actions">
        <button type="button" className="re-align-button"><Check size={13} /> Realign</button>
        <Eye size={16} />
        <CircleHelp size={16} />
        <Trash2 size={16} />
      </div>
    </SectionCard>
  )
}

export default function ProjectionSidebar() {
  return (
    <aside className="projection-sidebar">
      <header className="sidebar-header">
        <ModeSwitch />
        <button type="button" className="back-button" aria-label="Collapse sidebar">
          <ArrowLeft size={20} />
        </button>
      </header>
      <AlignmentCard />
      <ProjectorList />
      <AlignmentControls />
      <ProjectorSettings />
    </aside>
  )
}
