import SidebarSection from './SidebarSection'

export default function AlignmentControls() {
  return (
    <SidebarSection className="controls-card">
      <strong>Alignment controls</strong>
      <button type="button" className="re-align-button">
        <span>◎</span>
        Re-align all
      </button>
    </SidebarSection>
  )
}
