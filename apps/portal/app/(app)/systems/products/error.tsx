"use client";

export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Product management</h1>
      <div className="alert error" role="alert">Something went wrong while loading products. Please try again. If it keeps happening, tell the IT team.</div>
      <button className="btn" type="button" onClick={reset}>Try again</button>
    </>
  );
}
