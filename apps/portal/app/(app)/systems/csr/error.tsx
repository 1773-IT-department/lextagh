"use client";

export default function CsrError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>CSR activities</h1>
      <div className="alert error" role="alert">Something went wrong while loading CSR activities. Please try again. If it keeps happening, tell the IT team.</div>
      <button className="btn" type="button" onClick={reset}>Try again</button>
    </>
  );
}
