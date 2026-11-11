export default function SidebarSection({ children, className = '' }) {
  return <section className={`projection-card ${className}`}>{children}</section>
}
