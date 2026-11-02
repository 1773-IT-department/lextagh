"use client";

export default function ComplaintsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Complaints</h1>
      <div className="alert error" role="alert">Something went wrong while loading complaints. Please try again. If it keeps happening, tell the IT team.</div>
      <button className="btn" type="button" onClick={reset}>Try again</button>
    </>
  );
}
