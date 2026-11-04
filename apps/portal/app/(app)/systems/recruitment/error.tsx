"use client";

export default function RecruitmentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Recruitment</h1>
      <div className="alert error" role="alert">Something went wrong while loading recruitment. Please try again. If it keeps happening, tell the IT team.</div>
      <button className="btn" type="button" onClick={reset}>Try again</button>
    </>
  );
}
