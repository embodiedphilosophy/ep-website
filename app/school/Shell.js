// The season view is shown inside Circle's own page (Circle supplies the sidebar), so this is only a wrapper.
export default function Shell({ children }) {
  return <main className="sch-main">{children}</main>;
}
