import './school.css';

export const metadata = { title: 'Sādhana School · Embodied Philosophy', robots: { index: false, follow: false } };

export default function Layout({ children }) {
  return <div className="sch-root">{children}</div>;
}
