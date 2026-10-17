// Shown at once while the hub reads the member's spaces from Circle
export default function Loading() {
  return (
    <main className="sch-main sch-skel" role="status" aria-label="Loading Sādhana School">
      <div className="sk sk-eyebrow" /><div className="sk sk-title" />
      <div className="sk-tabs">{[110, 96, 78, 96, 170].map((w, i) => <div key={i} className="sk sk-pill" style={{ width: w }} />)}</div>
      {[0, 1, 2, 3].map(i => <div key={i} className="sk sk-card" />)}
    </main>
  );
}
