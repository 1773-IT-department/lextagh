// GENERATED from the Claude Design prototype "Linzzy Home.dc.html" by scratch convert.mjs, then kept in the repo.
// The markup, inline styles and animation hooks (data-pin, data-reveal, data-speed, data-marquee, data-progress,
// data-chapter) are the prototype's own; the page component supplies v (the prototype's renderVals) and runs the
// scroll engine (components/linzzy/scroll.ts). Hover styles live in app/linzzy-hover.css.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, type CSSProperties } from "react";
import { css } from "../css";
import { lextaSiteUrl as LEXTA } from "@/lib/site";

export default function HomeView({ v: vals }: { v: any }) {
  return (
    <>
      <div style={{"position":"relative","overflowX":"clip","background":"#FBF8FF"} as CSSProperties}>
        <header style={{"position":"fixed","top":"0","left":"0","right":"0","zIndex":"60","display":"flex","alignItems":"center","justifyContent":"space-between","gap":"12px","padding":"16px clamp(14px,3vw,40px)","pointerEvents":"none"} as CSSProperties}>
          {"\n  "}
          <a href="/" onClick={vals.toTop} aria-label="Linzzy home" style={{"pointerEvents":"auto","display":"flex","background":"#fff","padding":"6px 12px"} as CSSProperties}>
            {"\n    "}
            <img src="/images/original/linzzy-logo.webp" alt="Linzzy" style={{"height":"38px","width":"auto"} as CSSProperties} />
            {"\n  "}
          </a>
          {"\n  "}
          <div style={{"pointerEvents":"auto","display":"flex","alignItems":"stretch"} as CSSProperties}>
            {"\n    "}
            <a className="lzh0" href={vals.pageHref.wtb} onClick={vals.page.wtb} style={{"display":"flex","alignItems":"center","padding":"0 20px","height":"50px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
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
          {"\n  "}
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
          {"\n  "}
          <div data-progress="1" style={{"height":"100%","width":"0","background":"#C2185B"} as CSSProperties}>
          </div>
        </div>
        {vals.menuOpen ? (
          <>
            {"\n  "}
            <div id="site-menu" style={{"position":"fixed","inset":"0","zIndex":"58","background":"#23103a","color":"#fff","padding":"110px clamp(20px,5vw,80px) 48px","overflow":"auto","display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,380px),1fr))","gap":"48px","alignContent":"start"} as CSSProperties}>
              {"\n    "}
              <div>
                {"\n      "}
                <p style={{"margin":"0 0 18px","fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","textTransform":"uppercase","color":"#F48FB1"} as CSSProperties}>
                  {"This story"}
                </p>
                {"\n      "}
                {(vals.chapters ?? []).map((c: any, i0: number) => (
                  <Fragment key={i0}>
                    {"\n        "}
                    <a className="lzh1" href={c.href} onClick={c.go} style={{"display":"flex","alignItems":"baseline","gap":"18px","padding":"10px 0","borderBottom":"1px solid rgba(255,255,255,0.14)","color":"#fff","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.4vw,44px)","lineHeight":"1.05"} as CSSProperties}>
                      <span style={{"fontFamily":"'Hanken Grotesk',sans-serif","fontSize":"13px","fontWeight":"700","color":"#9EE6C8"} as CSSProperties}>
                        {c.num}
                      </span>
                      {c.name}
                    </a>
                    {"\n      "}
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
                    {"\n        "}
                    <a className="lzh2" href={n.href} onClick={n.go} style={{"display":"block","padding":"10px 0","borderBottom":"1px solid rgba(255,255,255,0.14)","color":"#fff","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.4vw,44px)","lineHeight":"1.05"} as CSSProperties}>
                      {n.label}
                    </a>
                    {"\n      "}
                  </Fragment>
                ))}
                {"\n    "}
              </nav>
              {"\n  "}
            </div>
          </>
        ) : null}
        {/* 01 HERO */}
        <section id="ch-hero" data-pin="1" data-chapter="Gentle Care" data-num="00" data-screen-label="01 Hero" style={{"position":"relative","height":"340vh","background":"#1a0b2b"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden"} as CSSProperties}>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","clipPath":"inset(calc((1 - clamp(0, var(--p,0) * 2.4, 1)) * 24%) calc((1 - clamp(0, var(--p,0) * 2.4, 1)) * 33%) round calc((1 - clamp(0, var(--p,0) * 2.4, 1)) * 240px))","willChange":"clip-path"} as CSSProperties}>
              {"\n      "}
              <img src="/images/original/banner-on-the-go.webp" alt="A confident young woman walking with her bag beside packs of Linzzy sanitary towels" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"72% center","transform":"scale(calc(1.3 - clamp(0, var(--p,0) * 2.4, 1) * 0.3))"} as CSSProperties} />
              {"\n      "}
              <div style={{"position":"absolute","inset":"0","background":"#1a0b2b","opacity":"calc(clamp(0, (var(--p,0) - 0.4) * 4, 1) * 0.68)"} as CSSProperties}>
              </div>
              {"\n    "}
            </div>
            {"\n\n    "}
            <div style={{"position":"absolute","left":"6%","top":"58%","width":"clamp(110px,15vw,250px)","transform":"translateY(calc(var(--p,0) * -95vh)) rotate(calc(-14deg + var(--p,0) * 50deg))","zIndex":"3"} as CSSProperties}>
              {"\n      "}
              <img src="/images/original/pad-heavy-flow.webp" alt="" style={{"width":"100%","height":"auto","filter":"drop-shadow(0 30px 40px rgba(0,0,0,0.45))"} as CSSProperties} />
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","right":"5%","top":"10%","width":"clamp(100px,13vw,220px)","transform":"translateY(calc(var(--p,0) * 80vh)) rotate(calc(10deg - var(--p,0) * 40deg))","zIndex":"3"} as CSSProperties}>
              {"\n      "}
              <img src="/images/original/baby-diapers.webp" alt="" style={{"width":"100%","height":"auto","filter":"drop-shadow(0 30px 40px rgba(0,0,0,0.45))"} as CSSProperties} />
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","right":"16%","bottom":"-4%","width":"clamp(90px,11vw,190px)","transform":"translateY(calc(var(--p,0) * -130vh)) rotate(calc(18deg + var(--p,0) * -60deg))","zIndex":"3"} as CSSProperties}>
              {"\n      "}
              <img src="/images/original/pad-cool-mint.webp" alt="" style={{"width":"100%","height":"auto","filter":"drop-shadow(0 30px 40px rgba(0,0,0,0.45))"} as CSSProperties} />
              {"\n    "}
            </div>
            {"\n\n    "}
            <h1 style={{"position":"absolute","inset":"0","margin":"0","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(58px,11.5vw,210px)","lineHeight":"0.86","letterSpacing":"-0.035em","color":"#fff","textAlign":"center","opacity":"calc(1 - clamp(0, (var(--p,0) - 0.28) * 5, 1))","zIndex":"2","pointerEvents":"none","textShadow":"0 10px 60px rgba(26,11,43,0.5)"} as CSSProperties}>
              {"\n      "}
              <span style={{"display":"block","transform":"translateX(calc(clamp(0, var(--p,0) * 2.4, 1) * -60vw))"} as CSSProperties}>
                {"Gentle Care"}
              </span>
              {"\n      "}
              <span style={{"display":"block","fontStyle":"italic","color":"#F48FB1","transform":"scale(calc(1 - clamp(0, var(--p,0) * 2.4, 1) * 0.4))"} as CSSProperties}>
                {"for Bright"}
              </span>
              {"\n      "}
              <span style={{"display":"block","transform":"translateX(calc(clamp(0, var(--p,0) * 2.4, 1) * 60vw))"} as CSSProperties}>
                {"Beginnings"}
              </span>
              {"\n    "}
            </h1>
            {"\n\n    "}
            <div style={{"position":"absolute","inset":"0","zIndex":"4","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center","padding":"90px clamp(20px,6vw,100px) 60px","textAlign":"center","color":"#fff","pointerEvents":"none"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#9EE6C8","opacity":"clamp(0, (var(--p,0) - 0.46) * 6, 1)"} as CSSProperties}>
                {"Linzzy Products"}
              </p>
              {"\n      "}
              <p style={{"margin":"22px 0 0","maxWidth":"1000px","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(34px,5vw,80px)","lineHeight":"1.02","letterSpacing":"-0.02em","textWrap":"balance","opacity":"clamp(0, (var(--p,0) - 0.5) * 6, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.5) * 6, 1)) * 70px))"} as CSSProperties}>
                {"Because Every Woman Deserves Comfort, and Every Baby Deserves "}
                <em style={{"color":"#F48FB1"} as CSSProperties}>
                  {"Loving Care."}
                </em>
              </p>
              {"\n      "}
              <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"center","gap":"10px 28px","marginTop":"28px","fontSize":"15px","fontWeight":"600","color":"#eee5f7","opacity":"clamp(0, (var(--p,0) - 0.62) * 6, 1)"} as CSSProperties}>
                {"\n        "}
                <span>
                  {"Your flow. Your comfort. Your choice."}
                </span>
                <span style={{"color":"#9EE6C8"} as CSSProperties}>
                  {"Little Moments. Loving Care."}
                </span>
                {"\n      "}
              </div>
              {"\n      "}
              <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"center","gap":"2px","marginTop":"36px","pointerEvents":"auto","opacity":"clamp(0, (var(--p,0) - 0.7) * 6, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.7) * 6, 1)) * 40px))"} as CSSProperties}>
                {"\n        "}
                <a className="lzh3" href="#ch-products" onClick={vals.jump.products} style={{"padding":"20px 30px","background":"#fff","color":"#23103a","fontWeight":"700","fontSize":"15px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                  {"Explore Our Products ↓"}
                </a>
                {"\n        "}
                <a className="lzh0" href={vals.pageHref.wtb} onClick={vals.page.wtb} style={{"padding":"20px 30px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"15px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                  {"Where to Buy"}
                </a>
                {"\n      "}
              </div>
              {"\n    "}
            </div>
            {"\n\n    "}
            <div style={{"position":"absolute","left":"50%","bottom":"34px","transform":"translateX(-50%)","display":"flex","flexDirection":"column","alignItems":"center","gap":"10px","color":"#fff","fontSize":"12px","fontWeight":"700","letterSpacing":"0.24em","textTransform":"uppercase","opacity":"calc(1 - clamp(0, var(--p,0) * 10, 1))","zIndex":"5"} as CSSProperties}>
              {"Scroll to begin"}
              <span style={{"width":"1px","height":"48px","background":"linear-gradient(#fff,rgba(255,255,255,0))"} as CSSProperties}>
              </span>
            </div>
            {"\n  "}
          </div>
        </section>
        {/* 02 PROLOGUE */}
        <section id="ch-welcome" data-pin="1" data-chapter="Welcome" data-num="01" data-screen-label="02 Welcome" style={{"position":"relative","height":"230vh","background":"#FBF8FF"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","height":"100vh","display":"flex","alignItems":"center","justifyContent":"center","padding":"90px clamp(20px,6vw,100px)","overflow":"hidden"} as CSSProperties}>
            {"\n    "}
            <div style={{"position":"absolute","left":"clamp(20px,6vw,100px)","top":"110px","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#C2185B"} as CSSProperties}>
              {"Welcome"}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","right":"-6vw","top":"50%","width":"clamp(180px,26vw,420px)","aspectRatio":"3/4","borderRadius":"999px 999px 0 0","overflow":"hidden","transform":"translate(calc((1 - clamp(0, (var(--p,0) - 0.55) * 3, 1)) * 40vw), -50%) rotate(6deg)","opacity":"0.95"} as CSSProperties}>
              {"\n      "}
              <img src="/images/nursery/mum-changing.webp" alt="A smiling mother changing her laughing baby's diaper, with Linzzy Baby Diapers and Baby Wipes nearby" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"68% center"} as CSSProperties} />
              {"\n    "}
            </div>
            {"\n    "}
            <p data-words="1" style={{"position":"relative","margin":"0","maxWidth":"1180px","display":"flex","flexWrap":"wrap","gap":"0 0.26em","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(30px,4.5vw,72px)","lineHeight":"1.1","letterSpacing":"-0.02em","color":"#23103a"} as CSSProperties}>
              {"\n      "}
              {(vals.welcomeWords ?? []).map((w: any, i2: number) => (
                <Fragment key={i2}>
                  <span data-w="1" style={css(`opacity:0.12;color:${w.c};font-style:${w.s}`)}>
                    {w.t}
                  </span>
                </Fragment>
              ))}
              {"\n    "}
            </p>
            {"\n  "}
          </div>
        </section>
        {/* 03 CARE THAT GROWS */}
        <section id="ch-grows" data-chapter="Care That Grows" data-num="02" data-screen-label="03 Care That Grows" style={{"position":"relative","background":"#FBF8FF","padding":"clamp(60px,10vw,140px) clamp(20px,6vw,100px) clamp(80px,12vw,180px)"} as CSSProperties}>
          {"\n  "}
          <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(56px,12vw,220px)","lineHeight":"0.86","letterSpacing":"-0.04em","color":"#23103a"} as CSSProperties}>
            {"\n    "}
            <span style={{"display":"block","transform":"translateX(calc((1 - var(--r,0)) * -12vw))","opacity":"var(--r,0)"} as CSSProperties}>
              {"Care That"}
            </span>
            {"\n    "}
            <span style={{"display":"block","paddingLeft":"clamp(0px,14vw,260px)","fontStyle":"italic","color":"#C2185B","transform":"translateX(calc((1 - var(--r,0)) * 18vw))","opacity":"var(--r,0)"} as CSSProperties}>
              {"Grows"}
            </span>
            {"\n    "}
            <span style={{"display":"block","textAlign":"right","transform":"translateY(calc((1 - var(--r,0)) * 80px))","opacity":"var(--r,0)"} as CSSProperties}>
              {"with You"}
            </span>
            {"\n  "}
          </h2>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,420px),1fr))","gap":"clamp(40px,6vw,100px)","marginTop":"clamp(60px,8vw,120px)","alignItems":"start"} as CSSProperties}>
            {"\n    "}
            <div style={{"position":"relative","height":"clamp(420px,52vw,720px)","overflow":"hidden"} as CSSProperties}>
              {"\n      "}
              <div data-speed="0.14" style={{"position":"absolute","left":"0","right":"0","top":"-14%","height":"128%"} as CSSProperties}>
                {"\n        "}
                <img src="/images/original/mother-daughter.webp" alt="A mother handing her smiling daughter a pack of Linzzy sanitary towels" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"center 30%"} as CSSProperties} />
                {"\n      "}
              </div>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"clamp(40px,6vw,90px)","paddingTop":"clamp(0px,6vw,100px)"} as CSSProperties}>
              {"\n      "}
              <p data-reveal="1" style={{"margin":"0","fontSize":"clamp(19px,1.6vw,24px)","lineHeight":"1.5","color":"#3d2a55","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
                {"Our range of feminine hygiene and baby care essentials is thoughtfully developed to support everyday cleanliness, comfort and confidence."}
              </p>
              {"\n      "}
              <p data-reveal="1" style={{"margin":"0","fontSize":"clamp(19px,1.6vw,24px)","lineHeight":"1.5","color":"#3d2a55","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
                {"Whether you're managing your monthly cycle, caring for your little one or preparing for another busy day, Linzzy understands that the little things make a big difference."}
              </p>
              {"\n      "}
              <div data-reveal="1" style={{"opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))","display":"flex","flexDirection":"column","gap":"18px"} as CSSProperties}>
                {"\n        "}
                <p style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,2.8vw,42px)","lineHeight":"1.1","color":"#23103a"} as CSSProperties}>
                  {"At Linzzy, we believe care should never be complicated."}
                </p>
                {"\n        "}
                <p style={{"margin":"0","fontSize":"clamp(19px,1.6vw,24px)","lineHeight":"1.5","color":"#3d2a55"} as CSSProperties}>
                  {"Every stage of life brings different needs, and we're committed to making everyday personal care easier to manage. Our products support two important journeys:"}
                </p>
                {"\n      "}
              </div>
              {"\n      "}
              <div data-reveal="1" style={{"display":"grid","gridTemplateColumns":"1fr 1fr","borderTop":"1px solid #23103a","opacity":"var(--r,0)"} as CSSProperties}>
                {"\n        "}
                <a className="lzh4" href="#ch-fem" onClick={vals.jump.fem} style={{"padding":"20px 16px 20px 0","borderRight":"1px solid #23103a","color":"#23103a","display":"flex","flexDirection":"column","gap":"6px"} as CSSProperties}>
                  <span style={{"fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","color":"#C2185B"} as CSSProperties}>
                    {"01"}
                  </span>
                  <span style={{"fontFamily":"'DM Serif Display',serif","fontSize":"clamp(24px,2.4vw,34px)"} as CSSProperties}>
                    {"Feminine Care ↓"}
                  </span>
                </a>
                {"\n        "}
                <a className="lzh5" href="#ch-baby" onClick={vals.jump.baby} style={{"padding":"20px 0 20px 20px","color":"#23103a","display":"flex","flexDirection":"column","gap":"6px"} as CSSProperties}>
                  <span style={{"fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","color":"#0E7A5B"} as CSSProperties}>
                    {"02"}
                  </span>
                  <span style={{"fontFamily":"'DM Serif Display',serif","fontSize":"clamp(24px,2.4vw,34px)"} as CSSProperties}>
                    {"Baby Care ↓"}
                  </span>
                </a>
                {"\n      "}
              </div>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* 04 CHAPTER 01 FEMININE */}
        <section id="ch-fem" data-pin="1" data-chapter="Feminine Care" data-num="03" data-screen-label="04 Feminine Care" style={{"position":"relative","height":"360vh","background":"#3a1150"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden","color":"#fff"} as CSSProperties}>
            {"\n    "}
            <div style={{"position":"absolute","left":"-3vw","bottom":"-10vh","fontFamily":"'DM Serif Display',serif","fontSize":"52vw","lineHeight":"0.8","color":"rgba(255,255,255,0.05)","transform":"translateY(calc(var(--p,0) * -24vh))","pointerEvents":"none"} as CSSProperties}>
              {"01"}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","top":"0","right":"0","bottom":"0","width":"clamp(56%, (900px - 100vw) * 999, 100%)","clipPath":"circle(calc(7% + clamp(0, var(--p,0) * 1.9, 1) * 75%) at 55% 50%)"} as CSSProperties}>
              {"\n      "}
              <img src="/images/original/flow-focus-grow.webp" alt="A young woman in a confident yoga pose next to a stack of Linzzy sanitary towel packs" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"center 30%","transform":"scale(calc(1.25 - var(--p,0) * 0.25))"} as CSSProperties} />
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","width":"clamp(0%, (900px - 100vw) * 999, 100%)","background":"linear-gradient(180deg,rgba(58,17,80,0.2) 0%,rgba(58,17,80,0.95) 52%)"} as CSSProperties}>
            </div>
            {"\n    "}
            <div style={{"position":"absolute","top":"0","bottom":"0","left":"clamp(20px,5vw,80px)","width":"clamp(38%, (900px - 100vw) * 999, calc(100% - 40px))","display":"flex","flexDirection":"column","justifyContent":"center","padding":"clamp(80px, (900px - 100vw) * 999, 34vh) 0 60px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#F48FB1","opacity":"clamp(0, var(--p,0) * 8, 1)"} as CSSProperties}>
                {"Chapter 01 · Feminine Care"}
              </p>
              {"\n      "}
              <h3 style={{"margin":"16px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(42px,5.4vw,92px)","lineHeight":"0.92","letterSpacing":"-0.03em"} as CSSProperties}>
                {"\n        "}
                <span style={{"display":"block","overflow":"hidden"} as CSSProperties}>
                  <span style={{"display":"block","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.02) * 9, 1)) * 105%))"} as CSSProperties}>
                    {"Confidence"}
                  </span>
                </span>
                {"\n        "}
                <span style={{"display":"block","overflow":"hidden"} as CSSProperties}>
                  <span style={{"display":"block","fontStyle":"italic","color":"#F48FB1","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.06) * 9, 1)) * 105%))"} as CSSProperties}>
                    {"Through Every"}
                  </span>
                </span>
                {"\n        "}
                <span style={{"display":"block","overflow":"hidden"} as CSSProperties}>
                  <span style={{"display":"block","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.1) * 9, 1)) * 105%))"} as CSSProperties}>
                    {"Cycle"}
                  </span>
                </span>
                {"\n      "}
              </h3>
              {"\n      "}
              <div style={{"display":"grid","marginTop":"28px","minHeight":"5.4em","fontSize":"clamp(17px,1.4vw,21px)","lineHeight":"1.5"} as CSSProperties}>
                {"\n        "}
                <p style={{"gridArea":"1/1","margin":"0","color":"#eee5f7","opacity":"min(clamp(0, (var(--p,0) - 0.2) * 10, 1), clamp(0, (0.42 - var(--p,0)) * 10, 1))","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.2) * 10, 1)) * 30px))"} as CSSProperties}>
                  {"Every woman's menstrual experience is unique."}
                </p>
                {"\n        "}
                <p style={{"gridArea":"1/1","margin":"0","color":"#eee5f7","opacity":"min(clamp(0, (var(--p,0) - 0.42) * 10, 1), clamp(0, (0.62 - var(--p,0)) * 10, 1))","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.42) * 10, 1)) * 30px))"} as CSSProperties}>
                  {"From lighter days to heavier flows, Linzzy offers sanitary towels and panty liners designed with different lengths and protection needs in mind."}
                </p>
                {"\n        "}
                <p style={{"gridArea":"1/1","margin":"0","color":"#eee5f7","opacity":"clamp(0, (var(--p,0) - 0.62) * 10, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.62) * 10, 1)) * 30px))"} as CSSProperties}>
                  {"Discover Linzzy Cool Mint, Heavy Flow, Extra Long Sanitary Towels and Panty Liners."}
                </p>
                {"\n      "}
              </div>
              {"\n      "}
              <div style={{"display":"grid","gridTemplateColumns":"repeat(4,minmax(0,1fr))","gap":"8px","marginTop":"22px","maxWidth":"440px"} as CSSProperties}>
                {"\n        "}
                <div style={{"aspectRatio":"1","background":"#EFE6FF","padding":"8px","opacity":"clamp(0, (var(--p,0) - 0.66) * 12, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.66) * 12, 1)) * 50px))"} as CSSProperties}>
                  <img src="/images/linzzy/pad-cool-mint.webp" alt="Linzzy Cool Mint Sanitary Towels" style={{"width":"100%","height":"100%","objectFit":"contain"} as CSSProperties} />
                </div>
                {"\n        "}
                <div style={{"aspectRatio":"1","background":"#EFE6FF","padding":"8px","opacity":"clamp(0, (var(--p,0) - 0.7) * 12, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.7) * 12, 1)) * 50px))"} as CSSProperties}>
                  <img src="/images/linzzy/pad-heavy-flow.webp" alt="Linzzy Heavy Flow Sanitary Towels" style={{"width":"100%","height":"100%","objectFit":"contain"} as CSSProperties} />
                </div>
                {"\n        "}
                <div style={{"aspectRatio":"1","background":"#EFE6FF","padding":"8px","opacity":"clamp(0, (var(--p,0) - 0.74) * 12, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.74) * 12, 1)) * 50px))"} as CSSProperties}>
                  <img src="/images/linzzy/pad-extra-long.webp" alt="Linzzy Extra Long Sanitary Towels" style={{"width":"100%","height":"100%","objectFit":"contain"} as CSSProperties} />
                </div>
                {"\n        "}
                <div style={{"aspectRatio":"1","background":"#EFE6FF","padding":"8px","opacity":"clamp(0, (var(--p,0) - 0.78) * 12, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.78) * 12, 1)) * 50px))"} as CSSProperties}>
                  <img src="/images/linzzy/panty-liner.webp" alt="Linzzy Panty Liners" style={{"width":"100%","height":"100%","objectFit":"contain"} as CSSProperties} />
                </div>
                {"\n      "}
              </div>
              {"\n      "}
              <div style={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"14px 22px","marginTop":"26px","opacity":"clamp(0, (var(--p,0) - 0.84) * 10, 1)"} as CSSProperties}>
                {"\n        "}
                <a className="lzh3" href={vals.pageHref.fem} onClick={vals.page.fem} style={{"padding":"18px 26px","background":"#fff","color":"#3a1150","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                  {"Discover Feminine Care →"}
                </a>
                {"\n        "}
                <span style={{"fontFamily":"'DM Serif Display',serif","fontStyle":"italic","fontSize":"20px","color":"#F48FB1"} as CSSProperties}>
                  {"Your flow. Your comfort. Your choice."}
                </span>
                {"\n      "}
              </div>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* 05 CHAPTER 02 BABY */}
        <section id="ch-baby" data-pin="1" data-chapter="Baby Care" data-num="04" data-screen-label="05 Baby Care" style={{"position":"relative","height":"360vh","background":"#0B3D2E"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden","color":"#fff"} as CSSProperties}>
            {"\n    "}
            <div style={{"position":"absolute","right":"-3vw","bottom":"-10vh","fontFamily":"'DM Serif Display',serif","fontSize":"52vw","lineHeight":"0.8","color":"rgba(255,255,255,0.05)","transform":"translateY(calc(var(--p,0) * -24vh))","pointerEvents":"none"} as CSSProperties}>
              {"02"}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","top":"0","left":"0","bottom":"0","width":"clamp(56%, (900px - 100vw) * 999, 100%)","clipPath":"inset(0 calc((1 - clamp(0, var(--p,0) * 1.9, 1)) * 100%) 0 0)"} as CSSProperties}>
              {"\n      "}
              <img src="/images/nursery/joyful-baby.webp" alt="A smiling baby on a soft blanket beside Linzzy Baby Diapers" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"30% center","transform":"scale(calc(1.25 - var(--p,0) * 0.25)) translateX(calc((1 - clamp(0, var(--p,0) * 1.9, 1)) * -8%))"} as CSSProperties} />
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","top":"0","bottom":"0","left":"calc(clamp(56%, (900px - 100vw) * 999, 100%) - 3px)","width":"3px","background":"#9EE6C8","transform":"translateX(calc((clamp(0, var(--p,0) * 1.9, 1) - 1) * 56vw))","opacity":"calc(1 - clamp(0, (var(--p,0) - 0.5) * 10, 1))"} as CSSProperties}>
            </div>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","width":"clamp(0%, (900px - 100vw) * 999, 100%)","background":"linear-gradient(180deg,rgba(11,61,46,0.2) 0%,rgba(11,61,46,0.95) 52%)"} as CSSProperties}>
            </div>
            {"\n    "}
            <div style={{"position":"absolute","top":"0","bottom":"0","right":"clamp(20px,5vw,80px)","width":"clamp(36%, (900px - 100vw) * 999, calc(100% - 40px))","display":"flex","flexDirection":"column","justifyContent":"center","padding":"clamp(80px, (900px - 100vw) * 999, 34vh) 0 60px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#9EE6C8","opacity":"clamp(0, var(--p,0) * 8, 1)"} as CSSProperties}>
                {"Chapter 02 · Baby Care"}
              </p>
              {"\n      "}
              <h3 style={{"margin":"16px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(42px,5.4vw,92px)","lineHeight":"0.92","letterSpacing":"-0.03em"} as CSSProperties}>
                {"\n        "}
                <span style={{"display":"block","overflow":"hidden"} as CSSProperties}>
                  <span style={{"display":"block","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.02) * 9, 1)) * 105%))"} as CSSProperties}>
                    {"Little Beginnings,"}
                  </span>
                </span>
                {"\n        "}
                <span style={{"display":"block","overflow":"hidden"} as CSSProperties}>
                  <span style={{"display":"block","fontStyle":"italic","color":"#9EE6C8","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.06) * 9, 1)) * 105%))"} as CSSProperties}>
                    {"Loving"}
                  </span>
                </span>
                {"\n        "}
                <span style={{"display":"block","overflow":"hidden"} as CSSProperties}>
                  <span style={{"display":"block","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.1) * 9, 1)) * 105%))"} as CSSProperties}>
                    {"Protection"}
                  </span>
                </span>
                {"\n      "}
              </h3>
              {"\n      "}
              <div style={{"display":"grid","marginTop":"28px","minHeight":"5.4em","fontSize":"clamp(17px,1.4vw,21px)","lineHeight":"1.5"} as CSSProperties}>
                {"\n        "}
                <p style={{"gridArea":"1/1","margin":"0","color":"#e6fbf2","opacity":"min(clamp(0, (var(--p,0) - 0.2) * 10, 1), clamp(0, (0.42 - var(--p,0)) * 10, 1))","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.2) * 10, 1)) * 30px))"} as CSSProperties}>
                  {"Your baby's world is filled with first smiles, little movements, playful discoveries and beautiful milestones."}
                </p>
                {"\n        "}
                <p style={{"gridArea":"1/1","margin":"0","color":"#e6fbf2","opacity":"min(clamp(0, (var(--p,0) - 0.42) * 10, 1), clamp(0, (0.62 - var(--p,0)) * 10, 1))","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.42) * 10, 1)) * 30px))"} as CSSProperties}>
                  {"Linzzy Baby Diapers and Baby Wipes are designed to support the daily care routines that keep little ones clean and comfortable."}
                </p>
                {"\n        "}
                <p style={{"gridArea":"1/1","margin":"0","color":"#e6fbf2","opacity":"clamp(0, (var(--p,0) - 0.62) * 10, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.62) * 10, 1)) * 30px))"} as CSSProperties}>
                  {"From diaper changes at home to family outings, Linzzy is part of your everyday care essentials."}
                </p>
                {"\n      "}
              </div>
              {"\n      "}
              <div style={{"display":"grid","gridTemplateColumns":"repeat(2,minmax(0,1fr))","gap":"8px","marginTop":"22px","maxWidth":"260px"} as CSSProperties}>
                {"\n        "}
                <div style={{"aspectRatio":"1","background":"#DDF7EC","padding":"8px","opacity":"clamp(0, (var(--p,0) - 0.68) * 12, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.68) * 12, 1)) * 50px))"} as CSSProperties}>
                  <img src="/images/linzzy/baby-diapers.webp" alt="Linzzy Baby Diapers" style={{"width":"100%","height":"100%","objectFit":"contain"} as CSSProperties} />
                </div>
                {"\n        "}
                <div style={{"aspectRatio":"1","background":"#DDF7EC","padding":"8px","opacity":"clamp(0, (var(--p,0) - 0.74) * 12, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.74) * 12, 1)) * 50px))"} as CSSProperties}>
                  <img src="/images/linzzy/baby-wipes.webp" alt="Linzzy Baby Wipes" style={{"width":"100%","height":"100%","objectFit":"contain"} as CSSProperties} />
                </div>
                {"\n      "}
              </div>
              {"\n      "}
              <div style={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"14px 22px","marginTop":"26px","opacity":"clamp(0, (var(--p,0) - 0.84) * 10, 1)"} as CSSProperties}>
                {"\n        "}
                <a className="lzh6" href={vals.pageHref.baby} onClick={vals.page.baby} style={{"padding":"18px 26px","background":"#fff","color":"#0B3D2E","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                  {"Discover Baby Care →"}
                </a>
                {"\n        "}
                <span style={{"fontFamily":"'DM Serif Display',serif","fontStyle":"italic","fontSize":"20px","color":"#9EE6C8"} as CSSProperties}>
                  {"Little Moments. Loving Care. Brighter Beginnings."}
                </span>
                {"\n      "}
              </div>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* 06 PRODUCTS TRACK */}
        <section id="ch-products" data-pin="1" data-chapter="Featured Products" data-num="05" data-screen-label="06 Featured Products" style={{"position":"relative","height":"420vh","background":"#FBF8FF"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden","display":"flex","flexDirection":"column","padding":"96px 0 44px"} as CSSProperties}>
            {"\n    "}
            <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"space-between","alignItems":"end","gap":"16px 40px","padding":"0 clamp(20px,5vw,80px)"} as CSSProperties}>
              {"\n      "}
              <div>
                {"\n        "}
                <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#C2185B"} as CSSProperties}>
                  {"Featured products"}
                </p>
                {"\n        "}
                <h2 style={{"margin":"10px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(40px,6vw,104px)","lineHeight":"0.9","letterSpacing":"-0.035em","color":"#23103a"} as CSSProperties}>
                  {"Your Comfort, "}
                  <em style={{"color":"#C2185B"} as CSSProperties}>
                    {"Their Care"}
                  </em>
                </h2>
                {"\n      "}
              </div>
              {"\n      "}
              <a className="lzh7" href={vals.pageHref.products} onClick={vals.page.products} style={{"padding":"16px 0","borderBottom":"1.5px solid #23103a","color":"#23103a","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"View all products →"}
              </a>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"flex":"1","minHeight":"0","marginTop":"clamp(20px,3vh,40px)"} as CSSProperties}>
              {"\n      "}
              <div data-track="1" style={{"display":"flex","gap":"clamp(14px,2vw,28px)","height":"100%","width":"max-content","padding":"0 clamp(20px,5vw,80px)","willChange":"transform"} as CSSProperties}>
                {"\n        "}
                {(vals.featured ?? []).map((p: any, i3: number) => (
                  <Fragment key={i3}>
                    {"\n          "}
                    <article onClick={p.open} style={css(`flex:none;width:min(80vw,480px);height:100%;background:${p.soft};display:flex;flex-direction:column;padding:clamp(18px,2vw,28px);color:#23103a;cursor:pointer`)}>
                      {"\n            "}
                      <div style={{"display":"flex","justifyContent":"space-between","fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","textTransform":"uppercase"} as CSSProperties}>
                        <span style={css(`color:${p.tone}`)}>
                          {p.cat}
                        </span>
                        <span>
                          {p.num}
                          {" / "}
                          {p.total}
                        </span>
                      </div>
                      {"\n            "}
                      <div style={{"flex":"1","minHeight":"0","display":"flex","alignItems":"center","justifyContent":"center","padding":"16px 8px"} as CSSProperties}>
                        {"\n              "}
                        <img src={p.img} alt={p.alt} style={{"maxWidth":"100%","maxHeight":"100%","objectFit":"contain","filter":"drop-shadow(0 24px 30px rgba(35,16,58,0.22))"} as CSSProperties} />
                        {"\n            "}
                      </div>
                      {"\n            "}
                      <h3 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(24px,2.2vw,32px)","lineHeight":"1.02","letterSpacing":"-0.015em"} as CSSProperties}>
                        <a href={p.href} style={{ color: "inherit" }}>{p.name}</a>
                      </h3>
                      {"\n            "}
                      <p style={{"margin":"10px 0 0","fontSize":"15px","lineHeight":"1.5","color":"#3d2a55"} as CSSProperties}>
                        {p.desc}
                      </p>
                      {"\n          "}
                    </article>
                    {"\n        "}
                  </Fragment>
                ))}
                {"\n      "}
              </div>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"margin":"22px clamp(20px,5vw,80px) 0","height":"1px","background":"rgba(35,16,58,0.15)"} as CSSProperties}>
              <div style={{"height":"100%","width":"calc(var(--p,0) * 100%)","background":"#23103a"} as CSSProperties}>
              </div>
            </div>
            {"\n  "}
          </div>
        </section>
        {/* TAGLINES */}
        <section aria-label="Linzzy taglines" style={{"background":"#1a0b2b","color":"#fff","padding":"clamp(50px,7vw,100px) 0","overflow":"hidden","display":"flex","flexDirection":"column","gap":"12px"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"relative","overflow":"hidden","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.6vw,60px)","lineHeight":"1.2"} as CSSProperties}>
            {"\n    "}
            <div data-marquee="1" style={{"display":"flex","gap":"0.6em","width":"max-content","whiteSpace":"nowrap","paddingRight":"0.6em","willChange":"transform"} as CSSProperties}>
              {"\n      "}
              <span>
                {"Gentle Care for Bright Beginnings"}
              </span>
              <span style={{"color":"#C2185B"} as CSSProperties}>
                {"✦"}
              </span>
              <span style={{"fontStyle":"italic","color":"#F48FB1"} as CSSProperties}>
                {"Your flow. Your comfort. Your choice."}
              </span>
              <span style={{"color":"#C2185B"} as CSSProperties}>
                {"✦"}
              </span>
              <span>
                {"Absorb. Lock. Breathe."}
              </span>
              <span style={{"color":"#C2185B"} as CSSProperties}>
                {"✦"}
              </span>
              {"\n      "}
              <span>
                {"Gentle Care for Bright Beginnings"}
              </span>
              <span style={{"color":"#C2185B"} as CSSProperties}>
                {"✦"}
              </span>
              <span style={{"fontStyle":"italic","color":"#F48FB1"} as CSSProperties}>
                {"Your flow. Your comfort. Your choice."}
              </span>
              <span style={{"color":"#C2185B"} as CSSProperties}>
                {"✦"}
              </span>
              <span>
                {"Absorb. Lock. Breathe."}
              </span>
              <span style={{"color":"#C2185B"} as CSSProperties}>
                {"✦"}
              </span>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
          {"\n  "}
          <div style={{"position":"relative","overflow":"hidden","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.6vw,60px)","lineHeight":"1.2"} as CSSProperties}>
            {"\n    "}
            <div data-marquee="-1" style={{"display":"flex","gap":"0.6em","width":"max-content","whiteSpace":"nowrap","paddingRight":"0.6em","willChange":"transform"} as CSSProperties}>
              {"\n      "}
              <span style={{"fontStyle":"italic","color":"#9EE6C8"} as CSSProperties}>
                {"Little Moments. Loving Care. Brighter Beginnings."}
              </span>
              <span style={{"color":"#0E7A5B"} as CSSProperties}>
                {"✦"}
              </span>
              <span>
                {"Everyday care, made simple."}
              </span>
              <span style={{"color":"#0E7A5B"} as CSSProperties}>
                {"✦"}
              </span>
              <span style={{"fontStyle":"italic","color":"#F48FB1"} as CSSProperties}>
                {"Your Comfort. Your Confidence. Your Everyday Care."}
              </span>
              <span style={{"color":"#0E7A5B"} as CSSProperties}>
                {"✦"}
              </span>
              {"\n      "}
              <span style={{"fontStyle":"italic","color":"#9EE6C8"} as CSSProperties}>
                {"Little Moments. Loving Care. Brighter Beginnings."}
              </span>
              <span style={{"color":"#0E7A5B"} as CSSProperties}>
                {"✦"}
              </span>
              <span>
                {"Everyday care, made simple."}
              </span>
              <span style={{"color":"#0E7A5B"} as CSSProperties}>
                {"✦"}
              </span>
              <span style={{"fontStyle":"italic","color":"#F48FB1"} as CSSProperties}>
                {"Your Comfort. Your Confidence. Your Everyday Care."}
              </span>
              <span style={{"color":"#0E7A5B"} as CSSProperties}>
                {"✦"}
              </span>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* 07 WHY */}
        <section id="ch-why" data-chapter="Why Linzzy" data-num="06" data-screen-label="07 Why Families Choose Linzzy" style={{"position":"relative","background":"#1a0b2b","color":"#fff","padding":"clamp(40px,6vw,80px) clamp(20px,5vw,80px) clamp(80px,10vw,140px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,400px),1fr))","gap":"40px clamp(40px,6vw,100px)","alignItems":"start"} as CSSProperties}>
            {"\n    "}
            <div className="lz-side" style={{"position":"sticky","top":"clamp(100px,18vh,180px)"} as CSSProperties}>
              {"\n      "}
              <h2 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(48px,6.4vw,112px)","lineHeight":"0.9","letterSpacing":"-0.035em"} as CSSProperties}>
                {"Why Families "}
                <em style={{"color":"#F48FB1"} as CSSProperties}>
                  {"Choose"}
                </em>
                {" Linzzy"}
              </h2>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column"} as CSSProperties}>
              {"\n      "}
              <div style={{"position":"sticky","top":"110px","minHeight":"min(62vh,520px)","marginBottom":"10vh","background":"#EFE6FF","color":"#23103a","padding":"clamp(28px,3.4vw,52px)","display":"flex","flexDirection":"column","justifyContent":"space-between","gap":"30px","boxShadow":"0 -30px 60px -30px rgba(0,0,0,0.5)"} as CSSProperties}>
                {"\n        "}
                <span style={{"fontFamily":"'DM Serif Display',serif","fontSize":"clamp(80px,10vw,160px)","lineHeight":"0.8","color":"#C2185B"} as CSSProperties}>
                  {"01"}
                </span>
                {"\n        "}
                <div>
                  <h3 style={{"margin":"0 0 12px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(30px,3vw,46px)","lineHeight":"1"} as CSSProperties}>
                    {"Thoughtful Everyday Care"}
                  </h3>
                  <p style={{"margin":"0","fontSize":"18px","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
                    {"Products developed around the changing hygiene and comfort needs of women and babies."}
                  </p>
                </div>
                {"\n      "}
              </div>
              {"\n      "}
              <div style={{"position":"sticky","top":"140px","minHeight":"min(62vh,520px)","marginBottom":"10vh","background":"#DDF7EC","color":"#0B3D2E","padding":"clamp(28px,3.4vw,52px)","display":"flex","flexDirection":"column","justifyContent":"space-between","gap":"30px","boxShadow":"0 -30px 60px -30px rgba(0,0,0,0.5)"} as CSSProperties}>
                {"\n        "}
                <span style={{"fontFamily":"'DM Serif Display',serif","fontSize":"clamp(80px,10vw,160px)","lineHeight":"0.8","color":"#0E7A5B"} as CSSProperties}>
                  {"02"}
                </span>
                {"\n        "}
                <div>
                  <h3 style={{"margin":"0 0 12px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(30px,3vw,46px)","lineHeight":"1"} as CSSProperties}>
                    {"Practical Product Choices"}
                  </h3>
                  <p style={{"margin":"0","fontSize":"18px","lineHeight":"1.55","color":"#1f3d33"} as CSSProperties}>
                    {"A range of feminine and baby care essentials to support different routines, preferences and stages."}
                  </p>
                </div>
                {"\n      "}
              </div>
              {"\n      "}
              {(vals.whyRest ?? []).map((w: any, i4: number) => (
                <Fragment key={i4}>
                  {"\n        "}
                  <div style={css(`position:sticky;top:${w.top};min-height:min(62vh,520px);margin-bottom:10vh;background:${w.bg};color:${w.fg};padding:clamp(28px,3.4vw,52px);display:flex;flex-direction:column;justify-content:space-between;gap:30px;box-shadow:0 -30px 60px -30px rgba(0,0,0,0.5)`)}>
                    {"\n          "}
                    <span style={css(`font-family:'DM Serif Display',serif;font-size:clamp(80px,10vw,160px);line-height:0.8;color:${w.num}`)}>
                      {w.n}
                    </span>
                    {"\n          "}
                    <div>
                      <h3 style={{"margin":"0 0 12px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(30px,3vw,46px)","lineHeight":"1"} as CSSProperties}>
                        {w.t}
                      </h3>
                      <p style={css(`margin:0;font-size:18px;line-height:1.55;color:${w.fg}`)}>
                        {w.d}
                      </p>
                    </div>
                    {"\n        "}
                  </div>
                  {"\n      "}
                </Fragment>
              ))}
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* 08 TIPS */}
        <section id="ch-tips" data-chapter="Tips & Advice" data-num="07" data-screen-label="08 Tips & Advice" style={{"position":"relative","background":"#FBF8FF","padding":"clamp(80px,10vw,150px) 0 clamp(80px,10vw,140px)","overflow":"hidden"} as CSSProperties}>
          {"\n  "}
          <h2 data-reveal="1" style={{"margin":"0","padding":"0 clamp(20px,5vw,80px)","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(52px,10vw,190px)","lineHeight":"0.9","letterSpacing":"-0.04em","color":"#23103a"} as CSSProperties}>
            {"\n    "}
            <span style={{"display":"block","transform":"translateX(calc((1 - var(--r,0)) * -14vw))","opacity":"var(--r,0)"} as CSSProperties}>
              {"Care Beyond"}
            </span>
            {"\n    "}
            <span style={{"display":"block","textAlign":"right","transform":"translateX(calc((1 - var(--r,0)) * 14vw))","opacity":"var(--r,0)"} as CSSProperties}>
              {"the "}
              <em style={{"color":"#C2185B"} as CSSProperties}>
                {"Product"}
              </em>
            </span>
            {"\n  "}
          </h2>
          {"\n  "}
          <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"space-between","alignItems":"end","gap":"24px","padding":"clamp(30px,4vw,60px) clamp(20px,5vw,80px) 0"} as CSSProperties}>
            {"\n    "}
            <div style={{"maxWidth":"620px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0 0 12px","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#C2185B"} as CSSProperties}>
                {"Tips & Advice"}
              </p>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"clamp(18px,1.5vw,22px)","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
                {"We believe that informed care makes everyday life easier. Explore practical articles on menstrual hygiene, choosing sanitary towels, diaper-changing routines, baby wipes, parenting and personal well-being."}
              </p>
              {"\n    "}
            </div>
            {"\n    "}
            <a className="lzh7" href={vals.pageHref.tips} onClick={vals.page.tips} style={{"padding":"16px 0","borderBottom":"1.5px solid #23103a","color":"#23103a","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
              {"Explore Tips & Advice →"}
            </a>
            {"\n  "}
          </div>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,300px),1fr))","gap":"clamp(20px,3vw,40px)","padding":"clamp(50px,6vw,90px) clamp(20px,5vw,80px) 0","alignItems":"start"} as CSSProperties}>
            {"\n    "}
            {(vals.homeTips ?? []).map((t: any, i5: number) => (
              <Fragment key={i5}>
                {"\n      "}
                <div style={css(`padding-top:${t.offset}`)}>
                  {"\n        "}
                  <article data-speed={t.speed} onClick={t.open} style={{"cursor":"pointer","display":"flex","flexDirection":"column","gap":"16px","willChange":"transform"} as CSSProperties}>
                    {"\n          "}
                    <div style={{"aspectRatio":"4/5","overflow":"hidden","background":"#EFE6FF"} as CSSProperties}>
                      {"\n            "}
                      <img className="lzh8" src={t.img} alt={t.alt} style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"center 35%","transition":"transform .8s"} as CSSProperties} />
                      {"\n          "}
                    </div>
                    {"\n          "}
                    <p style={css(`margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${t.tone}`)}>
                      {t.catLabel}
                      {" · "}
                      {t.topic}
                      {t.mins}
                    </p>
                    {"\n          "}
                    <h3 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(24px,2.1vw,30px)","lineHeight":"1.1","color":"#23103a","textWrap":"pretty"} as CSSProperties}>
                      <a href={t.href} style={{ color: "inherit" }}>{t.title}</a>
                    </h3>
                    {"\n        "}
                  </article>
                  {"\n      "}
                </div>
                {"\n    "}
              </Fragment>
            ))}
            {"\n  "}
          </div>
        </section>
        {/* 09 PARENT CORNER */}
        <section id="ch-corner" data-pin="1" data-chapter="Parent Corner" data-num="08" data-screen-label="09 Parent Corner" style={{"position":"relative","height":"260vh","background":"#FBF8FF"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden"} as CSSProperties}>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","clipPath":"inset(calc((1 - clamp(0, var(--p,0) * 2.2, 1)) * 14%) round calc((1 - clamp(0, var(--p,0) * 2.2, 1)) * 60px))"} as CSSProperties}>
              {"\n      "}
              <img src="/images/nursery/dad-playtime.webp" alt="A father playing with his laughing baby on a play mat, with Linzzy Baby Diapers and Baby Wipes" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"35% center","transform":"scale(calc(1.4 - clamp(0, var(--p,0) * 2.2, 1) * 0.4))"} as CSSProperties} />
              {"\n      "}
              <div style={{"position":"absolute","inset":"0","background":"linear-gradient(180deg,rgba(26,11,43,0.1) 10%,rgba(26,11,43,0.9) 78%)","opacity":"clamp(0, (var(--p,0) - 0.3) * 4, 1)"} as CSSProperties}>
              </div>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","left":"0","right":"0","bottom":"0","padding":"0 clamp(20px,5vw,80px) clamp(60px,9vh,100px)","color":"#fff","maxWidth":"980px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#9EE6C8","opacity":"clamp(0, (var(--p,0) - 0.4) * 8, 1)"} as CSSProperties}>
                {"Linzzy Parent Corner"}
              </p>
              {"\n      "}
              <h2 style={{"margin":"16px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(40px,6vw,100px)","lineHeight":"0.92","letterSpacing":"-0.035em"} as CSSProperties}>
                {"\n        "}
                <span style={{"display":"block","overflow":"hidden"} as CSSProperties}>
                  <span style={{"display":"block","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.42) * 8, 1)) * 105%))"} as CSSProperties}>
                    {"Every Parent Has a Story."}
                  </span>
                </span>
                {"\n        "}
                <span style={{"display":"block","overflow":"hidden"} as CSSProperties}>
                  <span style={{"display":"block","fontStyle":"italic","color":"#9EE6C8","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.5) * 8, 1)) * 105%))"} as CSSProperties}>
                    {"Every Story Can Inspire."}
                  </span>
                </span>
                {"\n      "}
              </h2>
              {"\n      "}
              <div style={{"display":"flex","flexDirection":"column","gap":"6px","marginTop":"24px","fontSize":"clamp(16px,1.3vw,19px)","lineHeight":"1.55","maxWidth":"640px"} as CSSProperties}>
                {"\n        "}
                <p style={{"margin":"0","fontWeight":"600","opacity":"clamp(0, (var(--p,0) - 0.6) * 8, 1)"} as CSSProperties}>
                  {"Join our growing parenting community."}
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#eee5f7","opacity":"clamp(0, (var(--p,0) - 0.66) * 8, 1)"} as CSSProperties}>
                  {"Share your baby care experiences, discover practical parenting tips and explore educational answers to frequently asked questions."}
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#eee5f7","opacity":"clamp(0, (var(--p,0) - 0.72) * 8, 1)"} as CSSProperties}>
                  {"Your experience could help another family navigate the beautiful journey of parenthood."}
                </p>
                {"\n      "}
              </div>
              {"\n      "}
              <a className="lzh9" href={vals.pageHref.corner} onClick={vals.page.corner} style={{"display":"inline-block","marginTop":"26px","padding":"18px 26px","background":"#0E7A5B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase","opacity":"clamp(0, (var(--p,0) - 0.8) * 8, 1)"} as CSSProperties}>
                {"Read Parent Corner →"}
              </a>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* 10 CONNECT */}
        <section id="ch-connect" data-chapter="Connect" data-num="09" data-screen-label="10 Connect" style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,460px),1fr))"} as CSSProperties}>
          {"\n  "}
          <div style={{"minHeight":"72vh","background":"#FFF1C9","color":"#23103a","padding":"clamp(40px,6vw,100px) clamp(20px,5vw,80px)","display":"flex","flexDirection":"column","justifyContent":"flex-end","gap":"20px"} as CSSProperties}>
            {"\n    "}
            <h3 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,5.4vw,92px)","lineHeight":"0.92","letterSpacing":"-0.035em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 80px))"} as CSSProperties}>
              {"Connect With Our "}
              <em style={{"color":"#C2185B"} as CSSProperties}>
                {"Community"}
              </em>
            </h3>
            {"\n    "}
            <p style={{"margin":"0","maxWidth":"520px","fontSize":"clamp(17px,1.4vw,20px)","lineHeight":"1.55","color":"#4a3b20"} as CSSProperties}>
              {"Follow Linzzy for product information, practical hygiene tips, parenting conversations and community initiatives."}
            </p>
            {"\n    "}
            <div style={{"display":"flex","flexWrap":"wrap","gap":"8px 28px","marginTop":"10px"} as CSSProperties}>
              {"\n      "}
              <a className="lzh4" href="https://www.instagram.com/linzzy_products/" target="_blank" style={{"padding":"8px 0","borderBottom":"1.5px solid #23103a","color":"#23103a","fontWeight":"700","fontSize":"15px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"Instagram ↗"}
              </a>
              {"\n      "}
              <a className="lzh4" href="https://www.facebook.com/people/Linzzy-Product/61572662232439/" target="_blank" style={{"padding":"8px 0","borderBottom":"1.5px solid #23103a","color":"#23103a","fontWeight":"700","fontSize":"15px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"Facebook ↗"}
              </a>
              {"\n      "}
              <a className="lzh4" href="https://whatsapp.com/channel/0029Vb7CGlb35fLvDzjVPU41" target="_blank" style={{"padding":"8px 0","borderBottom":"1.5px solid #23103a","color":"#23103a","fontWeight":"700","fontSize":"15px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"WhatsApp ↗"}
              </a>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
          {"\n  "}
          <div style={{"minHeight":"72vh","background":"#C2185B","color":"#fff","padding":"clamp(40px,6vw,100px) clamp(20px,5vw,80px)","display":"flex","flexDirection":"column","justifyContent":"flex-end","gap":"20px"} as CSSProperties}>
            {"\n    "}
            <h3 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,5.4vw,92px)","lineHeight":"0.92","letterSpacing":"-0.035em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 80px))"} as CSSProperties}>
              {"Stay Connected with "}
              <em>
                {"Linzzy"}
              </em>
            </h3>
            {"\n    "}
            <p style={{"margin":"0","maxWidth":"520px","fontSize":"clamp(17px,1.4vw,20px)","lineHeight":"1.55","color":"#fff"} as CSSProperties}>
              {"Have a question, product experience or suggestion? We would love to hear from you. Your feedback matters because every experience helps us understand how we can serve you better."}
            </p>
            {"\n    "}
            <div style={{"display":"flex","flexWrap":"wrap","gap":"2px","marginTop":"10px"} as CSSProperties}>
              {"\n      "}
              <a className="lzha" href={vals.pageHref.contact} onClick={vals.page.contact} style={{"padding":"18px 26px","background":"#fff","color":"#C2185B","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"Contact Linzzy →"}
              </a>
              {"\n      "}
              <a className="lzh0" href={vals.pageHref.wtb} onClick={vals.page.wtb} style={{"padding":"18px 26px","background":"#23103a","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"Find a stockist"}
              </a>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* prototype chat link replaced by the site's live chat launcher */}
        {/* FOOTER */}
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
              <a href="/" onClick={vals.toTop} style={{"color":"#fff"} as CSSProperties}>
                {"Home"}
              </a>
              {"\n      "}
              <a href={vals.pageHref.about} onClick={vals.page.about} style={{"color":"#fff"} as CSSProperties}>
                {"About Us"}
              </a>
              {"\n      "}
              <a href={vals.pageHref.tips} onClick={vals.page.tips} style={{"color":"#fff"} as CSSProperties}>
                {"Tips & Advice"}
              </a>
              {"\n      "}
              <a href={vals.pageHref.faqs} onClick={vals.page.faqs} style={{"color":"#fff"} as CSSProperties}>
                {"FAQs"}
              </a>
              {"\n      "}
              <a href={vals.pageHref.contact} onClick={vals.page.contact} style={{"color":"#fff"} as CSSProperties}>
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
              <a href={vals.pageHref.products} onClick={vals.page.products} style={{"color":"#fff"} as CSSProperties}>
                {"All Products"}
              </a>
              {"\n      "}
              <a href="#ch-fem" onClick={vals.jump.fem} style={{"color":"#fff"} as CSSProperties}>
                {"Feminine Care"}
              </a>
              {"\n      "}
              <a href="#ch-baby" onClick={vals.jump.baby} style={{"color":"#fff"} as CSSProperties}>
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
