export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <h1>Recruitment</h1>
      <p className="small">Loading...</p>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
