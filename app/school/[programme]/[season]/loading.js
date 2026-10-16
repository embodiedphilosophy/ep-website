// Shown at once while the season's data is fetched from Circle: the shape of the page, so it feels instant
export default function Loading() {
  return (
    <main className="sch-main sch-skel" role="status" aria-label="Loading your season">
      <div className="sk sk-eyebrow" /><div className="sk sk-title" />
      <div className="sk-tabs">{[84, 132, 118, 104, 120].map((w, i) => <div key={i} className="sk sk-pill" style={{ width: w }} />)}</div>
      {[0, 1, 2, 3].map(i => <div key={i} className="sk sk-card" />)}
    </main>
  );
}
