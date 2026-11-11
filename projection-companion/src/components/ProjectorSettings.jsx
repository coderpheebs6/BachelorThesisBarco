import { useState } from 'react'
import { Check, CircleHelp, Eye, Trash2 } from 'lucide-react'
import SidebarSection from './SidebarSection'

export default function ProjectorSettings() {
  const [selectedProjector, setSelectedProjector] = useState('P1')

  return (
    <SidebarSection className="settings-card">
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
              {index === 2 && (
                <>
                  <button type="button" className="active">Landscape</button>
                  <button type="button">Portrait</button>
                </>
              )}
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
    </SidebarSection>
  )
}
