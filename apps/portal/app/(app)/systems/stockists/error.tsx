"use client";

export default function StockistsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Stockists</h1>
      <div className="alert error" role="alert">Something went wrong while loading stockists. Please try again. If it keeps happening, tell the IT team.</div>
      <button className="btn" type="button" onClick={reset}>Try again</button>
    </>
  );
}
