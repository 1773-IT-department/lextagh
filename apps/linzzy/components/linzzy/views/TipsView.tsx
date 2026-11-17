// GENERATED from the Claude Design prototype "Linzzy Tips.dc.html" by scratch convert.mjs, then kept in the repo.
// The markup, inline styles and animation hooks (data-pin, data-reveal, data-speed, data-marquee, data-progress,
// data-chapter) are the prototype's own; the page component supplies v (the prototype's renderVals) and runs the
// scroll engine (components/linzzy/scroll.ts). Hover styles live in app/linzzy-hover.css.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, type CSSProperties } from "react";
import { css } from "../css";
import { lextaSiteUrl as LEXTA } from "@/lib/site";
import { Err, FormError, Honeypot, fieldAria } from "../FormBits";

export default function TipsView({ v: vals }: { v: any }) {
  return (
    <>
      <div style={{"position":"relative","overflowX":"clip","background":"#FBF8FF"} as CSSProperties}>
        <header style={{"position":"fixed","top":"0","left":"0","right":"0","zIndex":"60","display":"flex","alignItems":"center","justifyContent":"space-between","gap":"12px","padding":"16px clamp(14px,3vw,40px)","pointerEvents":"none"} as CSSProperties}>
          {"\n  "}
          <a href="/" aria-label="Linzzy home" style={{"pointerEvents":"auto","display":"flex","background":"#fff","padding":"6px 12px"} as CSSProperties}>
            <img src="/images/original/linzzy-logo.webp" alt="Linzzy" style={{"height":"38px","width":"auto"} as CSSProperties} />
          </a>
          {"\n  "}
          <div style={{"pointerEvents":"auto","display":"flex","alignItems":"stretch"} as CSSProperties}>
            {"\n    "}
            <a className="lzt0" href="/contact#where-to-buy" style={{"display":"flex","alignItems":"center","padding":"0 20px","height":"50px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
              {"Where to Buy"}
            </a>
            {"\n    "}
            <button type="button" aria-expanded={!!vals.menuOpen} aria-controls="site-menu" onClick={vals.toggleMenu} style={{"height":"50px","minWidth":"96px","padding":"0 20px","border":"0","background":"#fff","color":"#23103a","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase","cursor":"pointer"} as CSSProperties}>
              {vals.menuLabel}
            </button>
            {"\n  "}
          </div>
        </header>
        <div style={{"position":"fixed","left":"clamp(14px,3vw,40px)","bottom":"22px","zIndex":"55","display":"flex","alignItems":"baseline","gap":"12px","color":"#fff","mixBlendMode":"difference","pointerEvents":"none","fontSize":"13px","fontWeight":"700","letterSpacing":"0.12em","textTransform":"uppercase"} as CSSProperties}>
          <span>
            {vals.chapterNum}
          </span>
          <span style={{"width":"40px","height":"1px","background":"#fff","alignSelf":"center"} as CSSProperties}>
          </span>
          <span>
            {vals.chapterName}
          </span>
        </div>
        <div style={{"position":"fixed","left":"0","right":"0","bottom":"0","height":"3px","zIndex":"55","background":"rgba(255,255,255,0.15)"} as CSSProperties}>
          <div data-progress="1" style={{"height":"100%","width":"0","background":"#C2185B"} as CSSProperties}>
          </div>
        </div>
        {/* prototype chat link replaced by the site's live chat launcher */}
        {vals.menuOpen ? (
          <>
            {"\n  "}
            <div id="site-menu" style={{"position":"fixed","inset":"0","zIndex":"58","background":"#23103a","color":"#fff","padding":"110px clamp(20px,5vw,80px) 48px","overflow":"auto","display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,380px),1fr))","gap":"48px","alignContent":"start"} as CSSProperties}>
              {"\n    "}
              <div>
                {"\n      "}
                <p style={{"margin":"0 0 18px","fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","textTransform":"uppercase","color":"#F48FB1"} as CSSProperties}>
                  {"On this page"}
                </p>
                {"\n      "}
                {(vals.chapters ?? []).map((c: any, i0: number) => (
                  <Fragment key={i0}>
                    <a className="lzt1" href={c.href} onClick={c.go} style={{"display":"flex","alignItems":"baseline","gap":"18px","padding":"10px 0","borderBottom":"1px solid rgba(255,255,255,0.14)","color":"#fff","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.4vw,44px)","lineHeight":"1.05"} as CSSProperties}>
                      <span style={{"fontFamily":"'Hanken Grotesk',sans-serif","fontSize":"13px","fontWeight":"700","color":"#9EE6C8"} as CSSProperties}>
                        {c.num}
                      </span>
                      {c.name}
                    </a>
                  </Fragment>
                ))}
                {"\n    "}
              </div>
              {"\n    "}
              <nav aria-label="Pages">
                {"\n      "}
                <p style={{"margin":"0 0 18px","fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","textTransform":"uppercase","color":"#F48FB1"} as CSSProperties}>
                  {"Pages"}
                </p>
                {"\n      "}
                {(vals.pages ?? []).map((n: any, i1: number) => (
                  <Fragment key={i1}>
                    <a className="lzt2" href={n.href} aria-current={n.current} style={css(`display:block;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.14);color:${n.c};font-family:'DM Serif Display',serif;font-size:clamp(28px,3.4vw,44px);line-height:1.05`)}>
                      {n.label}
                    </a>
                  </Fragment>
                ))}
                {"\n    "}
              </nav>
              {"\n  "}
            </div>
          </>
        ) : null}
        {/* HERO */}
        <section id="top" data-chapter="Care Beyond the Product" data-num="00" data-screen-label="01 Tips Hero" style={{"background":"#FBF8FF","padding":"clamp(130px,16vw,200px) clamp(20px,5vw,80px) clamp(60px,8vw,110px)"} as CSSProperties}>
          {"\n  "}
          <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#0E7A5B"} as CSSProperties}>
            {"Tips & Advice"}
          </p>
          {"\n  "}
          <h1 data-reveal="1" style={{"margin":"20px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(56px,11vw,210px)","lineHeight":"0.86","letterSpacing":"-0.04em","color":"#23103a"} as CSSProperties}>
            {"\n    "}
            <span style={{"display":"block","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -12vw))"} as CSSProperties}>
              {"Care Beyond"}
            </span>
            {"\n    "}
            <span style={{"display":"block","textAlign":"right","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * 12vw))"} as CSSProperties}>
              {"the "}
              <em style={{"color":"#C2185B"} as CSSProperties}>
                {"Product"}
              </em>
            </span>
            {"\n  "}
          </h1>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,420px),1fr))","gap":"32px clamp(40px,6vw,100px)","alignItems":"end","marginTop":"clamp(40px,6vw,80px)"} as CSSProperties}>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(18px,1.5vw,22px)","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
              {"We believe that informed care makes everyday life easier. Explore practical articles on menstrual hygiene, choosing sanitary towels, diaper-changing routines, baby wipes, parenting and personal well-being."}
            </p>
            {"\n    "}
            <div style={{"display":"grid","gridTemplateColumns":"repeat(3,minmax(0,1fr))","borderTop":"1px solid #23103a"} as CSSProperties}>
              {"\n      "}
              <a className="lzt3" href="#fem" onClick={vals.jump.fem} style={{"padding":"18px 12px 0 0","borderRight":"1px solid #23103a","color":"#23103a","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(18px,1.8vw,26px)","lineHeight":"1.05"} as CSSProperties}>
                {"Feminine Care ↓"}
              </a>
              {"\n      "}
              <a className="lzt4" href="#baby" onClick={vals.jump.baby} style={{"padding":"18px 12px 0","borderRight":"1px solid #23103a","color":"#23103a","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(18px,1.8vw,26px)","lineHeight":"1.05"} as CSSProperties}>
                {"Baby Care ↓"}
              </a>
              {"\n      "}
              <a className="lzt5" href="#parent-corner" onClick={vals.jump.corner} style={{"padding":"18px 0 0 12px","color":"#23103a","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(18px,1.8vw,26px)","lineHeight":"1.05"} as CSSProperties}>
                {"Parent Corner ↓"}
              </a>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {(vals.sections ?? []).map((s: any, i2: number) => (
          <Fragment key={i2}>
            {"\n  "}
            <section id={s.id} data-chapter={s.chapter} data-num={s.num} data-screen-label={s.label} style={css(`background:${s.bg};padding:clamp(70px,9vw,130px) clamp(20px,5vw,80px)`)}>
              {"\n    "}
              <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"space-between","alignItems":"end","gap":"20px 40px","paddingBottom":"28px","borderBottom":"1px solid #23103a"} as CSSProperties}>
                {"\n      "}
                <h2 data-reveal="1" style={{"margin":"0","maxWidth":"900px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(38px,5.4vw,92px)","lineHeight":"0.92","letterSpacing":"-0.035em","color":"#23103a","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
                  {s.title}
                </h2>
                {"\n      "}
                <p style={css(`margin:0;font-family:'DM Serif Display',serif;font-style:italic;font-size:clamp(20px,1.8vw,26px);color:${s.tone}`)}>
                  {s.tagline}
                </p>
                {"\n    "}
              </div>
              {s.intro ? (
                <p style={{"margin":"28px 0 0","maxWidth":"760px","fontSize":"clamp(17px,1.4vw,20px)","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
                  {s.intro}
                </p>
              ) : null}
              {(s.groups ?? []).length ? (
                <div style={{"marginTop":"28px"} as CSSProperties}>
                  <div role="group" aria-label="Baby care categories" style={{"display":"flex","flexWrap":"wrap","gap":"2px"} as CSSProperties}>
                    {(s.groups ?? []).map((g: any) => (
                      <button key={g.label} type="button" aria-pressed={g.on} onClick={g.onClick} style={css(`cursor:pointer;padding:12px 16px;font-weight:600;font-size:14px;border:1px solid #23103a;background:${g.bg};color:${g.fg}`)}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <p aria-live="polite" style={{"margin":"12px 0 0","minHeight":"1.5em","fontSize":"14px","color":"#7a6890"} as CSSProperties}>
                    {s.groupHint}
                  </p>
                </div>
              ) : null}
              {"\n    "}
              <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fill,minmax(min(100%,320px),1fr))","gap":"clamp(70px,8vw,110px) clamp(20px,3vw,40px)","marginTop":"clamp(50px,6vw,80px)"} as CSSProperties}>
                {"\n      "}
                {(s.items ?? []).map((t: any, i3: number) => (
                  <Fragment key={i3}>
                    {"\n        "}
                    <div hidden={t.hidden}>
                      {"\n          "}
                      <article data-speed={t.speed} onClick={t.open} style={{"display":"flex","flexDirection":"column","gap":"14px","willChange":"transform","cursor":"pointer"} as CSSProperties}>
                        {"\n            "}
                        <div style={css(`aspect-ratio:4/5;overflow:hidden;background:${s.soft}`)}>
                          {"\n              "}
                          {t.hasImg ? (
                            <>
                              <img className="lzt6" src={t.img} alt={t.alt} style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"center 35%","transition":"transform .8s"} as CSSProperties} />
                            </>
                          ) : null}
                          {"\n              "}
                          {t.noImg ? (
                            <>
                              <div style={{"width":"100%","height":"100%","display":"flex","alignItems":"center","justifyContent":"center","padding":"24px","textAlign":"center","background":"repeating-linear-gradient(135deg,rgba(35,16,58,0.06) 0 10px,rgba(35,16,58,0) 10px 20px)","fontFamily":"ui-monospace,Menlo,monospace","fontSize":"12px","lineHeight":"1.5","color":"#5B1A7A"} as CSSProperties}>
                                {t.ph}
                              </div>
                            </>
                          ) : null}
                          {"\n            "}
                        </div>
                        {"\n            "}
                        <p style={css(`margin:4px 0 0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${s.tone}`)}>
                          {t.topic}
                          {t.mins}
                        </p>
                        {"\n            "}
                        <h3 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(24px,2vw,30px)","lineHeight":"1.1","color":"#23103a","textWrap":"pretty"} as CSSProperties}>
                          <a href={t.href} style={{ color: "inherit" }}>{t.title}</a>
                        </h3>
                        {"\n            "}
                        <p style={{"margin":"0","fontSize":"16px","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
                          {t.lede}
                        </p>
                        {"\n          "}
                      </article>
                      {"\n        "}
                    </div>
                    {"\n      "}
                  </Fragment>
                ))}
                {"\n    "}
              </div>
              {"\n    "}
              <p style={{"margin":"clamp(60px,7vw,100px) 0 0","padding":"20px 0","borderTop":"1px solid rgba(35,16,58,0.25)","borderBottom":"1px solid rgba(35,16,58,0.25)","fontSize":"14px","lineHeight":"1.6","color":"#3d2a55","maxWidth":"980px"} as CSSProperties}>
                <strong style={{"display":"block","color":"#23103a","marginBottom":"4px","fontSize":"12px","letterSpacing":"0.14em","textTransform":"uppercase"} as CSSProperties}>
                  {s.noticeTitle}
                </strong>
                {s.notice}
              </p>
              {"\n  "}
            </section>
            {"\n  "}
            {s.isFem ? (
              <>
                {"\n    "}
                <section id="quick" data-pin="1" data-chapter="Six Quick Tips" data-num="02" data-screen-label="03 Six Quick Tips" style={{"position":"relative","height":"340vh","background":"#3a1150"} as CSSProperties}>
                  {"\n      "}
                  <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden","display":"flex","flexDirection":"column","padding":"100px 0 50px","color":"#fff"} as CSSProperties}>
                    {"\n        "}
                    <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"space-between","alignItems":"end","gap":"16px","padding":"0 clamp(20px,5vw,80px)"} as CSSProperties}>
                      {"\n          "}
                      <h2 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,6.4vw,112px)","lineHeight":"0.9","letterSpacing":"-0.035em"} as CSSProperties}>
                        {"Six Quick "}
                        <em style={{"color":"#F48FB1"} as CSSProperties}>
                          {"Tips"}
                        </em>
                      </h2>
                      {"\n          "}
                      <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#F48FB1"} as CSSProperties}>
                        {"Feminine Care & Wellness"}
                      </p>
                      {"\n        "}
                    </div>
                    {"\n        "}
                    <div style={{"flex":"1","minHeight":"0","marginTop":"clamp(20px,4vh,44px)"} as CSSProperties}>
                      {"\n          "}
                      <div data-track="1" style={{"display":"flex","gap":"clamp(14px,2vw,24px)","height":"100%","width":"max-content","padding":"0 clamp(20px,5vw,80px)","willChange":"transform"} as CSSProperties}>
                        {"\n            "}
                        {(vals.quickTips ?? []).map((q: any, i4: number) => (
                          <Fragment key={i4}>
                            {"\n              "}
                            <div style={css(`flex:none;width:min(80vw,420px);height:100%;max-height:520px;background:${q.bg};color:#23103a;padding:clamp(22px,2.6vw,36px);display:flex;flex-direction:column;justify-content:space-between;gap:20px`)}>
                              {"\n                "}
                              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"baseline","gap":"12px"} as CSSProperties}>
                                <span style={{"fontFamily":"'DM Serif Display',serif","fontSize":"clamp(64px,7vw,110px)","lineHeight":"0.8","color":"#C2185B"} as CSSProperties}>
                                  {q.n}
                                </span>
                                <span style={{"fontSize":"12px","fontWeight":"700","letterSpacing":"0.12em","textTransform":"uppercase","color":"#5B1A7A","textAlign":"right"} as CSSProperties}>
                                  {q.k}
                                </span>
                              </div>
                              {"\n                "}
                              <div>
                                <h3 style={{"margin":"0 0 10px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(26px,2.4vw,36px)","lineHeight":"1.02"} as CSSProperties}>
                                  {q.t}
                                </h3>
                                <p style={{"margin":"0","fontSize":"16px","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
                                  {q.d}
                                </p>
                              </div>
                              {"\n              "}
                            </div>
                            {"\n            "}
                          </Fragment>
                        ))}
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </div>
                    {"\n        "}
                    <div style={{"margin":"22px clamp(20px,5vw,80px) 0","height":"1px","background":"rgba(255,255,255,0.2)"} as CSSProperties}>
                      <div style={{"height":"100%","width":"calc(var(--p,0) * 100%)","background":"#F48FB1"} as CSSProperties}>
                      </div>
                    </div>
                    {"\n      "}
                  </div>
                  {"\n    "}
                </section>
                {"\n  "}
              </>
            ) : null}
          </Fragment>
        ))}
        {/* PARENT CORNER */}
        <section id="parent-corner" data-chapter="Parent Corner" data-num="04" data-screen-label="05 Parent Corner" style={{"background":"#1a0b2b","color":"#fff","padding":"clamp(80px,10vw,150px) clamp(20px,5vw,80px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,420px),1fr))","gap":"56px clamp(40px,6vw,100px)","alignItems":"start"} as CSSProperties}>
            {"\n    "}
            <div className="lz-side" style={{"position":"sticky","top":"clamp(100px,14vh,140px)","display":"flex","flexDirection":"column","gap":"16px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                {"Linzzy Parent Corner"}
              </p>
              {"\n      "}
              <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(42px,5.4vw,92px)","lineHeight":"0.92","letterSpacing":"-0.035em"} as CSSProperties}>
                {"\n        "}
                <span style={{"display":"block","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 50px))"} as CSSProperties}>
                  {"Every Parent Has a Story."}
                </span>
                {"\n        "}
                <span style={{"display":"block","fontStyle":"italic","color":"#9EE6C8","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 90px))"} as CSSProperties}>
                  {"Every Story Can Inspire."}
                </span>
                {"\n      "}
              </h2>
              {"\n      "}
              <p style={{"margin":"8px 0 0","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(20px,1.8vw,26px)","color":"#F48FB1"} as CSSProperties}>
                {"Real Parents. Real Experiences. Shared Wisdom."}
              </p>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"clamp(40px,5vw,70px)"} as CSSProperties}>
              {"\n      "}
              <div data-reveal="1" style={{"display":"flex","flexDirection":"column","gap":"16px","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#d9cdea","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 50px))"} as CSSProperties}>
                {"\n        "}
                <p style={{"margin":"0"} as CSSProperties}>
                  {"Every little milestone, every unexpected challenge and every precious moment come with a story."}
                </p>
                {"\n        "}
                <p style={{"margin":"0"} as CSSProperties}>
                  {"At Linzzy, we believe parenting becomes more meaningful when we learn from one another. Whether you're navigating your baby's first diaper change, learning new hygiene routines, celebrating a developmental milestone or discovering what works best for your family, your experience could inspire another parent."}
                </p>
                {"\n        "}
                <p style={{"margin":"0","fontWeight":"700","color":"#F48FB1"} as CSSProperties}>
                  {"Linzzy Parent Corner, Little Stories. Big Lessons. Brighter Beginnings."}
                </p>
                {"\n      "}
              </div>
              {"\n      "}
              <div data-reveal="1" style={{"background":"#C2185B","padding":"clamp(28px,3.4vw,44px)","opacity":"var(--r,0)","transform":"rotate(calc((1 - var(--r,0)) * -6deg)) translateY(calc((1 - var(--r,0)) * 80px))"} as CSSProperties}>
                {"\n        "}
                <p style={{"margin":"0","fontSize":"12px","fontWeight":"700","letterSpacing":"0.14em","textTransform":"uppercase","color":"#FFE3EE"} as CSSProperties}>
                  {"This month's Parent Corner question"}
                </p>
                {"\n        "}
                <p style={{"margin":"16px 0","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(30px,3.2vw,50px)","lineHeight":"1.02"} as CSSProperties}>
                  {"“What's One Baby Care Tip You Wish You Had Known Earlier?”"}
                </p>
                {"\n        "}
                <p style={{"margin":"0 0 10px","fontSize":"15px"} as CSSProperties}>
                  {"Was it a smarter way to pack your diaper bag? A useful diaper-changing routine? Or a simple trick that made outings with your baby easier?"}
                </p>
                {"\n        "}
                <p style={{"margin":"0","fontSize":"15px","lineHeight":"1.55"} as CSSProperties}>
                  {"Tell us what you've learned and why it matters. Your little discovery could become another parent's big help! "}
                  <a href="/contact#message" style={{"color":"#fff","textDecoration":"underline"} as CSSProperties}>
                    {"Contact Linzzy →"}
                  </a>
                </p>
                {"\n      "}
              </div>
              {"\n      "}
              <div data-reveal="1" style={{"opacity":"var(--r,0)"} as CSSProperties}>
                {"\n        "}
                <p style={{"margin":"0 0 18px","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(22px,2vw,30px)","lineHeight":"1.15"} as CSSProperties}>
                  {"Parenting comes with plenty of questions, and finding reliable information matters."}
                </p>
                {"\n        "}
                <div style={{"borderTop":"1px solid rgba(255,255,255,0.2)"} as CSSProperties}>
                  {"\n          "}
                  {(vals.cornerTopics ?? []).map((c: any, i5: number) => (
                    <Fragment key={i5}>
                      {"\n            "}
                      <p style={css(`margin:0;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.2);display:flex;gap:16px;font-size:16px;transform:translateX(calc((1 - var(--r,0)) * ${c.dx}))`)}>
                        <span style={{"fontSize":"12px","fontWeight":"700","color":"#9EE6C8","paddingTop":"3px"} as CSSProperties}>
                          {c.n}
                        </span>
                        {c.t}
                      </p>
                      {"\n          "}
                    </Fragment>
                  ))}
                  {"\n        "}
                </div>
                {"\n      "}
              </div>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* SUBSCRIBE */}
        <section id="subscribe" data-chapter="Stay Connected" data-num="05" data-screen-label="06 Stay Connected" style={{"background":"#DDF7EC","padding":"clamp(70px,9vw,130px) clamp(20px,5vw,80px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,420px),1fr))","gap":"36px clamp(40px,6vw,100px)","alignItems":"end"} as CSSProperties}>
            {"\n    "}
            <div>
              {"\n      "}
              <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,6vw,104px)","lineHeight":"0.9","letterSpacing":"-0.035em","color":"#0B3D2E","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
                {"Stay Connected "}
                <em style={{"color":"#0E7A5B"} as CSSProperties}>
                  {"with Linzzy"}
                </em>
              </h2>
              {"\n    "}
            </div>
            {"\n    "}
            <div>
              {"\n      "}
              {vals.subSent ? (
                <>
                  <p role="status" data-form-message="" tabIndex={-1} style={{"margin":"0","padding":"22px 24px","background":"#0E7A5B","color":"#fff","fontWeight":"700","fontSize":"17px"} as CSSProperties}>
                    {"Thank you. You have opted in to Linzzy educational updates."}
                    {vals.sub.state.reference ? <span style={{ display: "block", marginTop: 6, fontWeight: 500, fontSize: 15 }}>{`Your reference is ${vals.sub.state.reference}.`}</span> : null}
                  </p>
                </>
              ) : null}
              {"\n      "}
              {vals.subOpen ? (
                <form ref={vals.sub.ref} action={vals.sub.action} onSubmit={vals.sub.onSubmit} noValidate aria-label="Sign up for Linzzy educational updates">
                  <Honeypot />
                  {"\n        "}
                  <label htmlFor="sub-email" style={{"display":"block","fontWeight":"700","fontSize":"13px","letterSpacing":"0.1em","textTransform":"uppercase","marginBottom":"10px","color":"#0B3D2E"} as CSSProperties}>
                    {"Your email address"}
                  </label>
                  {"\n        "}
                  <div style={{"display":"flex","borderBottom":"2px solid #0B3D2E"} as CSSProperties}>
                    {"\n          "}
                    <input id="sub-email" name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={vals.sub.state.values?.email ?? ""} {...fieldAria(vals.sub.state, "email", "sub-email-error")} placeholder="your@email.com" style={{"flex":"1","minWidth":"0","border":"0","outline":"none","padding":"16px 0","fontSize":"clamp(18px,1.6vw,24px)","background":"transparent","color":"#0B3D2E"} as CSSProperties} />
                    {"\n          "}
                    <button type="submit" aria-disabled={vals.sub.pending || undefined} style={{"border":"0","cursor":"pointer","padding":"0 24px","background":"#0B3D2E","color":"#fff","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                      {"Subscribe →"}
                    </button>
                    {"\n        "}
                  </div>
                  <Err id="sub-email-error" msg={vals.sub.state.fieldErrors?.email} />
                  {"\n        "}
                  <label style={{"display":"flex","gap":"10px","alignItems":"flex-start","marginTop":"14px","fontSize":"13px","lineHeight":"1.5","color":"#1f3d33"} as CSSProperties}>
                    <input type="checkbox" name="consent" value="yes" {...fieldAria(vals.sub.state, "consent", "sub-consent-error")} style={{"marginTop":"3px","accentColor":"#0E7A5B"} as CSSProperties} />
                    {"Yes, I agree to receive educational updates by email from Linzzy (Lexta Ghana Limited). I can unsubscribe at any time."}
                  </label>
                  <Err id="sub-consent-error" msg={vals.sub.state.fieldErrors?.consent} />
                  {"\n      "}
                  <div style={{ marginTop: 14 }}><FormError state={vals.sub.state} /></div>
                </form>
              ) : null}
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        <footer role="contentinfo" style={{"background":"#1a0b2b","color":"#fff","padding":"clamp(70px,9vw,130px) clamp(20px,5vw,80px) 70px"} as CSSProperties}>
          {"\n  "}
          <p data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(52px,10vw,190px)","lineHeight":"0.86","letterSpacing":"-0.04em"} as CSSProperties}>
            {"\n    "}
            <span style={{"display":"block","transform":"translateX(calc((1 - var(--r,0)) * -20vw))","opacity":"var(--r,0)"} as CSSProperties}>
              {"Gentle Care"}
            </span>
            {"\n    "}
            <span style={{"display":"block","fontStyle":"italic","color":"#F48FB1","paddingLeft":"8vw","transform":"translateX(calc((1 - var(--r,0)) * 20vw))","opacity":"var(--r,0)"} as CSSProperties}>
              {"for Bright"}
            </span>
            {"\n    "}
            <span style={{"display":"block","transform":"translateY(calc((1 - var(--r,0)) * 60px))","opacity":"var(--r,0)"} as CSSProperties}>
              {"Beginnings."}
            </span>
            {"\n  "}
          </p>
          {"\n  "}
          <p style={{"margin":"28px 0 0","fontSize":"18px","color":"#d9cdea"} as CSSProperties}>
            {"Linzzy, Your Comfort, Their Care, Our Commitment."}
          </p>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,200px),1fr))","gap":"36px","marginTop":"72px","paddingTop":"40px","borderTop":"1px solid rgba(255,255,255,0.15)"} as CSSProperties}>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"12px","fontSize":"15px","color":"#d9cdea"} as CSSProperties}>
              {"\n      "}
              <div style={{"alignSelf":"flex-start","padding":"10px 16px","background":"#fff"} as CSSProperties}>
                <img src="/images/original/linzzy-logo.webp" alt="Linzzy" style={{"height":"50px","width":"auto"} as CSSProperties} />
              </div>
              {"\n      "}
              <p style={{"margin":"0"} as CSSProperties}>
                {"Linzzy Products, a brand of Lexta Ghana Limited."}
              </p>
              {"\n      "}
              <a href="tel:+233302235296" style={{"color":"#fff"} as CSSProperties}>
                {"+233 302 235 296"}
              </a>
              {"\n      "}
              <a href="mailto:info@linzzyproducts.com" style={{"color":"#fff"} as CSSProperties}>
                {"info@linzzyproducts.com"}
              </a>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"10px","fontSize":"15px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0 0 6px","fontWeight":"700","fontSize":"13px","letterSpacing":"0.12em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                {"Explore"}
              </p>
              {"\n      "}
              <a href="/" style={{"color":"#fff"} as CSSProperties}>
                {"Home"}
              </a>
              {"\n      "}
              <a href="/about" style={{"color":"#fff"} as CSSProperties}>
                {"About Us"}
              </a>
              {"\n      "}
              <a href="/tips" style={{"color":"#fff"} as CSSProperties}>
                {"Tips & Advice"}
              </a>
              {"\n      "}
              <a href="/faqs" style={{"color":"#fff"} as CSSProperties}>
                {"FAQs"}
              </a>
              {"\n      "}
              <a href="/contact" style={{"color":"#fff"} as CSSProperties}>
                {"Contact & Where to Buy"}
              </a>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"10px","fontSize":"15px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0 0 6px","fontWeight":"700","fontSize":"13px","letterSpacing":"0.12em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                {"Products"}
              </p>
              {"\n      "}
              <a href="/products" style={{"color":"#fff"} as CSSProperties}>
                {"All Products"}
              </a>
              {"\n      "}
              <a href="/products#fem" style={{"color":"#fff"} as CSSProperties}>
                {"Feminine Care"}
              </a>
              {"\n      "}
              <a href="/products#baby" style={{"color":"#fff"} as CSSProperties}>
                {"Baby Care"}
              </a>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"10px","fontSize":"15px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0 0 6px","fontWeight":"700","fontSize":"13px","letterSpacing":"0.12em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                {"The Lexta family"}
              </p>
              {"\n      "}
              <a href={`${LEXTA}/corporate-social-responsibility`} target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Community Impact (CSR) ↗"}
              </a>
              {"\n      "}
              <a href={`${LEXTA}/careers`} target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Careers ↗"}
              </a>
              {"\n      "}
              <a href={`${LEXTA}/`} target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Lexta Ghana Limited ↗"}
              </a>
              {"\n      "}
              <a href={`${LEXTA}/privacy-policy`} target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Privacy Policy ↗"}
              </a>
              {"\n      "}
              <a href={`${LEXTA}/terms-and-conditions`} target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Terms & Conditions ↗"}
              </a>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"10px","fontSize":"15px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0 0 6px","fontWeight":"700","fontSize":"13px","letterSpacing":"0.12em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                {"Follow @Linzzyproducts"}
              </p>
              {"\n      "}
              <a href="https://whatsapp.com/channel/0029Vb7CGlb35fLvDzjVPU41" target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"WhatsApp"}
              </a>
              {"\n      "}
              <a href="https://www.facebook.com/people/Linzzy-Product/61572662232439/" target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Facebook"}
              </a>
              {"\n      "}
              <a href="https://www.instagram.com/linzzy_products/" target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Instagram"}
              </a>
              {"\n      "}
              <span style={{"fontFamily":"ui-monospace,Menlo,monospace","fontSize":"12px","color":"#b9a8d1"} as CSSProperties}>
                {"[PLACEHOLDER: TikTok and X links from Lexta]"}
              </span>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
          {"\n  "}
          <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"space-between","gap":"12px","marginTop":"56px","fontSize":"13px","color":"#b9a8d1"} as CSSProperties}>
            {"\n    "}
            <span>
              {"© 2026 Lexta Ghana Limited. All rights reserved."}
            </span>
            {"\n    "}
            <span>
              {"Feminine Care | Maternal Care | Baby Care"}
            </span>
            {"\n  "}
          </div>
        </footer>
      </div>
    </>
  );
}
