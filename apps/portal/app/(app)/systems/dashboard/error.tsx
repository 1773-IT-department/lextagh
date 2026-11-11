"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Management dashboard</h1>
      <div className="alert error" role="alert">Something went wrong while loading the dashboard. Please try again. If it keeps happening, tell the IT team.</div>
      <button className="btn" type="button" onClick={reset}>Try again</button>
    </>
  );
}
