import { ArrowLeft } from 'lucide-react'
import AlignmentCard from './AlignmentCard'
import AlignmentControls from './AlignmentControls'
import ModeSwitch from './ModeSwitch'
import ProjectorList from './ProjectorList'
import ProjectorSettings from './ProjectorSettings'
import './ProjectionSidebar.css'

// Composes the sidebar sections into the complete projection control panel.
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
