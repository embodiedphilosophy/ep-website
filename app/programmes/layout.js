import '../school/school.css';

export const metadata = { title: 'Embodied Philosophy', robots: { index: false, follow: false } };

// Programme pages are drawn inside Circle (it supplies the sidebar and header), like the school pages
export default function Layout({ children }) {
  return <div className="sch-root"><main className="sch-main">{children}</main></div>;
}
