export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <h1>Product management</h1>
      <p className="small">Loading products...</p>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
