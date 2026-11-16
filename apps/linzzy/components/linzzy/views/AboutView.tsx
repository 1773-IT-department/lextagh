// GENERATED from the Claude Design prototype "Linzzy About.dc.html" by scratch convert.mjs, then kept in the repo.
// The markup, inline styles and animation hooks (data-pin, data-reveal, data-speed, data-marquee, data-progress,
// data-chapter) are the prototype's own; the page component supplies v (the prototype's renderVals) and runs the
// scroll engine (components/linzzy/scroll.ts). Hover styles live in app/linzzy-hover.css.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, type CSSProperties } from "react";
import { css } from "../css";
import { lextaSiteUrl as LEXTA } from "@/lib/site";

export default function AboutView({ v: vals }: { v: any }) {
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
            <a className="lza0" href="/contact#where-to-buy" style={{"display":"flex","alignItems":"center","padding":"0 20px","height":"50px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
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
                    <a className="lza1" href={c.href} onClick={c.go} style={{"display":"flex","alignItems":"baseline","gap":"18px","padding":"10px 0","borderBottom":"1px solid rgba(255,255,255,0.14)","color":"#fff","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.4vw,44px)","lineHeight":"1.05"} as CSSProperties}>
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
                    <a className="lza2" href={n.href} aria-current={n.current} style={css(`display:block;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.14);color:${n.c};font-family:'DM Serif Display',serif;font-size:clamp(28px,3.4vw,44px);line-height:1.05`)}>
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
        <section id="top" data-chapter="Rooted in Care" data-num="00" data-screen-label="01 About Hero" style={{"background":"#FBF8FF","padding":"clamp(130px,16vw,200px) clamp(20px,5vw,80px) clamp(70px,9vw,130px)"} as CSSProperties}>
          {"\n  "}
          <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#0E7A5B"} as CSSProperties}>
            {"About Linzzy"}
          </p>
          {"\n  "}
          <h1 data-reveal="1" style={{"margin":"20px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(50px,9.4vw,176px)","lineHeight":"0.88","letterSpacing":"-0.04em","color":"#23103a"} as CSSProperties}>
            {"\n    "}
            <span style={{"display":"block","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -10vw))"} as CSSProperties}>
              {"Rooted in Care."}
            </span>
            {"\n    "}
            <span style={{"display":"block","fontStyle":"italic","color":"#0E7A5B","textAlign":"right","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * 10vw))"} as CSSProperties}>
              {"Inspired by Life."}
            </span>
            {"\n    "}
            <span style={{"display":"block","fontSize":"0.55em","lineHeight":"1","marginTop":"0.2em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
              {"Made for Everyday Moments."}
            </span>
            {"\n  "}
          </h1>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,280px),1fr))","gap":"32px clamp(30px,4vw,60px)","marginTop":"clamp(60px,8vw,110px)","paddingTop":"32px","borderTop":"1px solid #23103a","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#3d2a55"} as CSSProperties}>
            {"\n    "}
            <p data-reveal="1" style={{"margin":"0","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 50px))"} as CSSProperties}>
              {"Linzzy is a feminine, maternal and baby care brand under Lexta Ghana Limited, created to support the personal care needs of women, mothers and growing families."}
            </p>
            {"\n    "}
            <p data-reveal="1" style={{"margin":"0","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 80px))"} as CSSProperties}>
              {"We understand that every stage of life comes with its own experiences, responsibilities and moments that deserve thoughtful attention."}
            </p>
            {"\n    "}
            <p data-reveal="1" style={{"margin":"0","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 110px))"} as CSSProperties}>
              {"From the confidence a woman seeks during her menstrual cycle to the comfort parents want for their babies, Linzzy is committed to making everyday hygiene and personal care more convenient."}
            </p>
            {"\n    "}
            <p data-reveal="1" style={{"margin":"0","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 140px))"} as CSSProperties}>
              {"Our product portfolio includes sanitary towels, panty liners, baby diapers and baby wipes, offering practical choices for different care routines."}
            </p>
            {"\n  "}
          </div>
        </section>
        {/* STORY PIN */}
        <section id="story" data-pin="1" data-chapter="Our Story" data-num="01" data-screen-label="02 Our Story" style={{"position":"relative","height":"380vh","background":"#1a0b2b"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden","color":"#fff"} as CSSProperties}>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","opacity":"min(1, clamp(0, (0.36 - var(--p,0)) * 10, 1))"} as CSSProperties}>
              <img src="/images/original/mother-daughter.webp" alt="A mother handing her smiling daughter a pack of Linzzy sanitary towels" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"center 30%","transform":"scale(calc(1.15 - var(--p,0) * 0.3))"} as CSSProperties} />
            </div>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","opacity":"min(clamp(0, (var(--p,0) - 0.3) * 10, 1), clamp(0, (0.66 - var(--p,0)) * 10, 1))"} as CSSProperties}>
              <img src="/images/nursery/mum-changing.webp" alt="A smiling mother changing her laughing baby's diaper" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"68% center","transform":"scale(calc(1.2 - var(--p,0) * 0.2))"} as CSSProperties} />
            </div>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","opacity":"clamp(0, (var(--p,0) - 0.6) * 10, 1)"} as CSSProperties}>
              <img src="/images/nursery/joyful-baby.webp" alt="A smiling baby on a soft blanket beside Linzzy Baby Diapers" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"30% center","transform":"scale(calc(1.25 - var(--p,0) * 0.25))"} as CSSProperties} />
            </div>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","background":"rgba(26,11,43,0.62)"} as CSSProperties}>
            </div>
            {"\n    "}
            <div style={{"position":"absolute","inset":"0","display":"flex","flexDirection":"column","justifyContent":"center","gap":"clamp(10px,2vh,24px)","padding":"90px clamp(20px,6vw,100px)","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(36px,5.6vw,96px)","lineHeight":"1","letterSpacing":"-0.03em"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","opacity":"calc(clamp(0, (var(--p,0) - 0.04) * 8, 1) * (1 - clamp(0, (var(--p,0) - 0.3) * 4, 0.6)))","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.04) * 8, 1)) * 60px))"} as CSSProperties}>
                {"Every woman has a story."}
              </p>
              {"\n      "}
              <p style={{"margin":"0","fontStyle":"italic","color":"#F48FB1","opacity":"calc(clamp(0, (var(--p,0) - 0.34) * 8, 1) * (1 - clamp(0, (var(--p,0) - 0.62) * 4, 0.6)))","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.34) * 8, 1)) * 60px))"} as CSSProperties}>
                {"Every mother has a journey."}
              </p>
              {"\n      "}
              <p style={{"margin":"0","color":"#9EE6C8","opacity":"clamp(0, (var(--p,0) - 0.66) * 8, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.66) * 8, 1)) * 60px))"} as CSSProperties}>
                {"Every child begins life with moments worth protecting."}
              </p>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        <section style={{"background":"#1a0b2b","color":"#fff","padding":"clamp(60px,8vw,120px) clamp(20px,5vw,80px) clamp(90px,11vw,160px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,420px),1fr))","gap":"40px clamp(40px,6vw,100px)","alignItems":"start"} as CSSProperties}>
            {"\n    "}
            <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(40px,4.8vw,80px)","lineHeight":"0.95","letterSpacing":"-0.03em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
              {"Our Story, "}
              <em style={{"color":"#F48FB1"} as CSSProperties}>
                {"Inspired by the People"}
              </em>
              {" We Care For"}
            </h2>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"22px","fontSize":"clamp(17px,1.4vw,21px)","lineHeight":"1.6","color":"#d9cdea"} as CSSProperties}>
              {"\n      "}
              <p data-reveal="1" style={{"margin":"0","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 40px))"} as CSSProperties}>
                {"Linzzy draws inspiration from these everyday experiences."}
              </p>
              {"\n      "}
              <p data-reveal="1" style={{"margin":"0","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 40px))"} as CSSProperties}>
                {"We recognise that personal care is not simply about using a product. It is about feeling comfortable, prepared, understood and supported."}
              </p>
              {"\n      "}
              <p data-reveal="1" style={{"margin":"0","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 40px))"} as CSSProperties}>
                {"This understanding guides our commitment to developing and offering feminine and baby care essentials that respond to everyday consumer needs."}
              </p>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* VISION / MISSION STACK */}
        <section id="vision" data-chapter="Vision & Mission" data-num="02" data-screen-label="03 Vision and Mission" style={{"position":"relative"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","minHeight":"100vh","background":"#EFE6FF","color":"#23103a","padding":"clamp(110px,14vh,160px) clamp(20px,5vw,80px) 80px","display":"flex","flexDirection":"column","justifyContent":"space-between","gap":"40px"} as CSSProperties}>
            {"\n    "}
            <p style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(70px,15vw,280px)","lineHeight":"0.8","letterSpacing":"-0.05em","color":"#5B1A7A"} as CSSProperties}>
              {"Our "}
              <em>
                {"Vision"}
              </em>
            </p>
            {"\n    "}
            <p style={{"margin":"0","maxWidth":"900px","alignSelf":"flex-end","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(24px,2.8vw,44px)","lineHeight":"1.2"} as CSSProperties}>
              {"To become a trusted feminine and baby care brand that supports healthier hygiene practices, everyday comfort and greater confidence for women and families across Africa."}
            </p>
            {"\n  "}
          </div>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","minHeight":"100vh","background":"#DDF7EC","color":"#0B3D2E","padding":"clamp(110px,14vh,160px) clamp(20px,5vw,80px) 80px","display":"flex","flexDirection":"column","justifyContent":"space-between","gap":"40px","boxShadow":"0 -40px 80px -30px rgba(0,0,0,0.35)"} as CSSProperties}>
            {"\n    "}
            <p style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(70px,15vw,280px)","lineHeight":"0.8","letterSpacing":"-0.05em","color":"#0E7A5B"} as CSSProperties}>
              {"Our "}
              <em>
                {"Mission"}
              </em>
            </p>
            {"\n    "}
            <p style={{"margin":"0","maxWidth":"900px","alignSelf":"flex-end","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(24px,2.8vw,44px)","lineHeight":"1.2"} as CSSProperties}>
              {"To provide accessible, dependable and thoughtfully developed feminine hygiene and baby care products while promoting education, responsible care and meaningful community engagement."}
            </p>
            {"\n  "}
          </div>
        </section>
        {/* VALUES */}
        <section id="values" data-chapter="Core Values" data-num="03" data-screen-label="04 Core Values" style={{"position":"relative","background":"#FBF8FF","padding":"clamp(90px,11vw,160px) clamp(20px,5vw,80px)"} as CSSProperties}>
          {"\n  "}
          <h2 data-reveal="1" style={{"margin":"0 0 clamp(40px,5vw,70px)","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(48px,7vw,124px)","lineHeight":"0.9","letterSpacing":"-0.04em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
            {"Our Core "}
            <em style={{"color":"#C2185B"} as CSSProperties}>
              {"Values"}
            </em>
          </h2>
          {"\n  "}
          <div style={{"borderTop":"1px solid #23103a"} as CSSProperties}>
            {"\n    "}
            {(vals.values ?? []).map((v: any, i2: number) => (
              <Fragment key={i2}>
                {"\n      "}
                <div className="lza3" data-reveal="1" style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,320px),1fr))","gap":"12px 40px","alignItems":"center","padding":"clamp(22px,3vw,36px) 0","borderBottom":"1px solid #23103a","transition":"background .3s,padding .3s"} as CSSProperties}>
                  {"\n        "}
                  <div style={{"display":"flex","alignItems":"baseline","gap":"22px","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -80px))"} as CSSProperties}>
                    {"\n          "}
                    <span style={{"fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","color":"#C2185B"} as CSSProperties}>
                      {v.n}
                    </span>
                    {"\n          "}
                    <h3 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(40px,5.4vw,92px)","lineHeight":"0.95","letterSpacing":"-0.03em"} as CSSProperties}>
                      {v.t}
                    </h3>
                    {"\n        "}
                  </div>
                  {"\n        "}
                  <p style={{"margin":"0","maxWidth":"560px","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.55","color":"#3d2a55","opacity":"var(--r,0)"} as CSSProperties}>
                    {v.d}
                  </p>
                  {"\n      "}
                </div>
                {"\n    "}
              </Fragment>
            ))}
            {"\n  "}
          </div>
        </section>
        {/* COMMITMENTS */}
        <section id="commitments" data-chapter="Our Commitments" data-num="04" data-screen-label="05 Commitments" style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,460px),1fr))","background":"#3a1150","color":"#fff"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"relative","minHeight":"70vh","overflow":"hidden"} as CSSProperties}>
            {"\n    "}
            <div data-speed="0.16" style={{"position":"absolute","left":"0","right":"0","top":"-16%","height":"132%"} as CSSProperties}>
              <img src="/images/original/mother-daughter.webp" alt="A mother handing her smiling daughter a pack of Linzzy sanitary towels" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"center 30%"} as CSSProperties} />
            </div>
            {"\n  "}
          </div>
          {"\n  "}
          <div style={{"padding":"clamp(40px,6vw,100px) clamp(20px,5vw,80px)","display":"flex","flexDirection":"column","justifyContent":"center","gap":"16px"} as CSSProperties}>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#F48FB1"} as CSSProperties}>
              {"For women"}
            </p>
            {"\n    "}
            <h2 data-reveal="1" style={{"margin":"0 0 8px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(38px,4.4vw,72px)","lineHeight":"0.95","letterSpacing":"-0.03em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 50px))"} as CSSProperties}>
              {"Our Commitment to Women"}
            </h2>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#eee5f7"} as CSSProperties}>
              {"We believe every woman deserves access to practical menstrual hygiene information and suitable personal care choices."}
            </p>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#eee5f7"} as CSSProperties}>
              {"Through our feminine care range, we aim to support comfort and confidence while encouraging open, respectful conversations about menstrual health."}
            </p>
            {"\n    "}
            <a className="lza4" href="/products#fem" style={{"alignSelf":"flex-start","marginTop":"12px","padding":"18px 26px","background":"#fff","color":"#3a1150","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
              {"Feminine Care →"}
            </a>
            {"\n  "}
          </div>
        </section>
        <section style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,460px),1fr))","background":"#0B3D2E","color":"#fff"} as CSSProperties}>
          {"\n  "}
          <div style={{"padding":"clamp(40px,6vw,100px) clamp(20px,5vw,80px)","display":"flex","flexDirection":"column","justifyContent":"center","gap":"16px"} as CSSProperties}>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
              {"For babies and families"}
            </p>
            {"\n    "}
            <h2 data-reveal="1" style={{"margin":"0 0 8px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(38px,4.4vw,72px)","lineHeight":"0.95","letterSpacing":"-0.03em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 50px))"} as CSSProperties}>
              {"Our Commitment to Babies and Families"}
            </h2>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#e6fbf2"} as CSSProperties}>
              {"The early years of a child's life are filled with growth, learning and discovery."}
            </p>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#e6fbf2"} as CSSProperties}>
              {"Our baby care range supports parents and caregivers with everyday diapering and hygiene essentials."}
            </p>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#e6fbf2"} as CSSProperties}>
              {"Beyond products, we encourage safe care routines, informed parenting and shared learning through our Tips & Advice platform and Linzzy Parent Corner."}
            </p>
            {"\n    "}
            <a className="lza5" href="/products#baby" style={{"alignSelf":"flex-start","marginTop":"12px","padding":"18px 26px","background":"#fff","color":"#0B3D2E","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
              {"Baby Care →"}
            </a>
            {"\n  "}
          </div>
          {"\n  "}
          <div style={{"position":"relative","minHeight":"70vh","overflow":"hidden"} as CSSProperties}>
            {"\n    "}
            <div data-speed="0.16" style={{"position":"absolute","left":"0","right":"0","top":"-16%","height":"132%"} as CSSProperties}>
              <img src="/images/nursery/dad-playtime.webp" alt="A father playing with his laughing baby, with Linzzy Baby Diapers and Baby Wipes nearby" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"35% center"} as CSSProperties} />
            </div>
            {"\n  "}
          </div>
        </section>
        {/* LEXTA + PROMISE */}
        <section id="lexta" data-chapter="Lexta Family" data-num="05" data-screen-label="06 Lexta and Promise" style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,460px),1fr))"} as CSSProperties}>
          {"\n  "}
          <div style={{"minHeight":"72vh","background":"#23103a","color":"#fff","padding":"clamp(40px,6vw,100px) clamp(20px,5vw,80px)","display":"flex","flexDirection":"column","justifyContent":"flex-end","gap":"18px"} as CSSProperties}>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
              {"Lexta Ghana Limited"}
            </p>
            {"\n    "}
            <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(40px,4.8vw,80px)","lineHeight":"0.92","letterSpacing":"-0.03em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
              {"Part of the Lexta Ghana Family"}
            </h2>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#d9cdea"} as CSSProperties}>
              {"Linzzy is proudly part of Lexta Ghana Limited, a Ghanaian company with a portfolio of household, personal care and family-focused brands."}
            </p>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#d9cdea"} as CSSProperties}>
              {"Our relationship with Lexta reflects our commitment to responsible business practices, consumer care and long-term brand development."}
            </p>
            {"\n    "}
            <a className="lza6" href={`${LEXTA}/`} target="_blank" style={{"alignSelf":"flex-start","marginTop":"10px","padding":"18px 26px","background":"#0E7A5B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
              {"Visit Lexta Ghana Limited ↗"}
            </a>
            {"\n  "}
          </div>
          {"\n  "}
          <div style={{"minHeight":"72vh","background":"#FFF1C9","color":"#23103a","padding":"clamp(40px,6vw,100px) clamp(20px,5vw,80px)","display":"flex","flexDirection":"column","justifyContent":"flex-end","gap":"18px"} as CSSProperties}>
            {"\n    "}
            <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(40px,4.8vw,80px)","lineHeight":"0.92","letterSpacing":"-0.03em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
              {"A Promise That Goes "}
              <em style={{"color":"#C2185B"} as CSSProperties}>
                {"Beyond Products"}
              </em>
            </h2>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#4a3b20"} as CSSProperties}>
              {"We believe meaningful care begins with listening."}
            </p>
            {"\n    "}
            <p style={{"margin":"0","fontSize":"clamp(17px,1.3vw,19px)","lineHeight":"1.6","color":"#4a3b20"} as CSSProperties}>
              {"As our consumers' needs evolve, we remain committed to learning, improving and supporting the families who trust our brand."}
            </p>
            {"\n    "}
            <p style={{"margin":"4px 0 0","fontFamily":"'DM Serif Display',serif","fontStyle":"italic","fontSize":"clamp(22px,2vw,28px)","color":"#C2185B"} as CSSProperties}>
              {"Linzzy, Gentle Care for Bright Beginnings."}
            </p>
            {"\n    "}
            <div style={{"display":"flex","flexWrap":"wrap","gap":"2px","marginTop":"10px"} as CSSProperties}>
              {"\n      "}
              <a className="lza7" href="/products" style={{"padding":"18px 26px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"Discover Our Products →"}
              </a>
              {"\n      "}
              <a className="lza8" href="/contact" style={{"padding":"18px 26px","background":"#23103a","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"Contact Us"}
              </a>
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
