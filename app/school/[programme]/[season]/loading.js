// Shown at once while the season's data is fetched from Circle, so the frame never flashes unstyled text
export default function Loading() {
  return <div className="sch-loading" role="status" aria-label="Loading your season"><span /></div>;
}
