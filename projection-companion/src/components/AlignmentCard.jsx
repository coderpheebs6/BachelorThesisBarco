import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import SidebarSection from './SidebarSection'

export default function AlignmentCard() {
  const [expanded, setExpanded] = useState(true)

  return (
    <SidebarSection className="alignment-card">
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
    </SidebarSection>
  )
}
