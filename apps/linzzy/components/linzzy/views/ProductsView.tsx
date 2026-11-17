// GENERATED from the Claude Design prototype "Linzzy Products.dc.html" by scratch convert.mjs, then kept in the repo.
// The markup, inline styles and animation hooks (data-pin, data-reveal, data-speed, data-marquee, data-progress,
// data-chapter) are the prototype's own; the page component supplies v (the prototype's renderVals) and runs the
// scroll engine (components/linzzy/scroll.ts). Hover styles live in app/linzzy-hover.css.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, type CSSProperties } from "react";
import { css } from "../css";
import { hoochSiteUrl as HOOCH, lextaSiteUrl as LEXTA, yazzSiteUrl as YAZZ } from "@/lib/site";

export default function ProductsView({ v: vals }: { v: any }) {
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
            <a className="lzp0" href="/contact#where-to-buy" style={{"display":"flex","alignItems":"center","padding":"0 20px","height":"50px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
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
                    <a className="lzp1" href={c.href} onClick={c.go} style={{"display":"flex","alignItems":"baseline","gap":"18px","padding":"10px 0","borderBottom":"1px solid rgba(255,255,255,0.14)","color":"#fff","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.4vw,44px)","lineHeight":"1.05"} as CSSProperties}>
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
                    <a className="lzp2" href={n.href} onClick={n.go} aria-current={n.current} style={css(`display:block;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.14);color:${n.c};font-family:'DM Serif Display',serif;font-size:clamp(28px,3.4vw,44px);line-height:1.05`)}>
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
        <section id="top" data-pin="1" data-chapter="Our Collection" data-num="00" data-screen-label="01 Products Hero" style={{"position":"relative","height":"250vh","background":"#FBF8FF"} as CSSProperties}>
          {"\n  "}
          <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden"} as CSSProperties}>
            {"\n    "}
            <div style={{"position":"absolute","right":"0","bottom":"0","top":"clamp(0%, (900px - 100vw) * 999, 52%)","width":"clamp(46%, (900px - 100vw) * 999, 100%)","clipPath":"inset(calc((1 - clamp(0, var(--p,0) * 2.2, 1)) * 100%) 0 0 0)"} as CSSProperties}>
              {"\n      "}
              <img src="/images/nursery/diaper-bag.webp" alt="Linzzy Baby Wipes and Baby Diapers with a packed diaper bag, baby clothes and a soft toy" style={{"width":"100%","height":"100%","objectFit":"cover","objectPosition":"45% center","transform":"scale(calc(1.3 - var(--p,0) * 0.3))"} as CSSProperties} />
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","right":"clamp(10%, (900px - 100vw) * 999, 60%)","top":"62%","width":"clamp(110px,14vw,230px)","zIndex":"3","transform":"translateY(calc(var(--p,0) * -70vh)) rotate(calc(-12deg + var(--p,0) * 34deg))"} as CSSProperties}>
              {"\n      "}
              <img src="/images/original/pad-cool-mint.webp" alt="" style={{"width":"100%","height":"auto","filter":"drop-shadow(0 30px 40px rgba(35,16,58,0.35))"} as CSSProperties} />
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"position":"absolute","left":"clamp(20px,5vw,80px)","top":"0","bottom":"0","width":"clamp(50%, (900px - 100vw) * 999, calc(100% - 40px))","display":"flex","flexDirection":"column","justifyContent":"center","padding":"96px 0 clamp(40px, (900px - 100vw) * 999, 50vh)"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#C2185B"} as CSSProperties}>
                {"Linzzy Products"}
              </p>
              {"\n      "}
              <h1 style={{"margin":"18px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(46px,8vw,150px)","lineHeight":"0.88","letterSpacing":"-0.04em","color":"#23103a"} as CSSProperties}>
                {"\n        "}
                <span style={{"display":"block","transform":"translateX(calc(var(--p,0) * -6vw))"} as CSSProperties}>
                  {"Our Collection."}
                </span>
                {"\n        "}
                <span style={{"display":"block","fontStyle":"italic","color":"#C2185B","transform":"translateX(calc(var(--p,0) * 4vw))"} as CSSProperties}>
                  {"Your Choice."}
                </span>
                {"\n        "}
                <span style={{"display":"block","transform":"translateX(calc(var(--p,0) * -2vw))"} as CSSProperties}>
                  {"Your Comfort."}
                </span>
                {"\n      "}
              </h1>
              {"\n      "}
              <p style={{"margin":"28px 0 0","maxWidth":"520px","fontSize":"clamp(17px,1.4vw,21px)","lineHeight":"1.55","color":"#3d2a55","opacity":"clamp(0, (var(--p,0) - 0.1) * 5, 1)","transform":"translateY(calc((1 - clamp(0, (var(--p,0) - 0.1) * 5, 1)) * 40px))"} as CSSProperties}>
                {"Our range of feminine hygiene and baby care essentials is thoughtfully developed to support everyday cleanliness, comfort and confidence."}
              </p>
              {"\n      "}
              <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","maxWidth":"520px","marginTop":"28px","borderTop":"1px solid #23103a","opacity":"clamp(0, (var(--p,0) - 0.35) * 5, 1)"} as CSSProperties}>
                {"\n        "}
                <a className="lzp3" href="#fem" onClick={vals.jump.fem} style={{"padding":"18px 16px 0 0","borderRight":"1px solid #23103a","color":"#23103a","display":"flex","flexDirection":"column","gap":"4px"} as CSSProperties}>
                  <span style={{"fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","color":"#C2185B"} as CSSProperties}>
                    {`01 · ${vals.femCount} products`}
                  </span>
                  <span style={{"fontFamily":"'DM Serif Display',serif","fontSize":"clamp(22px,2.2vw,30px)"} as CSSProperties}>
                    {"Feminine Care ↓"}
                  </span>
                </a>
                {"\n        "}
                <a className="lzp4" href="#baby" onClick={vals.jump.baby} style={{"padding":"18px 0 0 18px","color":"#23103a","display":"flex","flexDirection":"column","gap":"4px"} as CSSProperties}>
                  <span style={{"fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","color":"#0E7A5B"} as CSSProperties}>
                    {`02 · ${vals.babyCount} products`}
                  </span>
                  <span style={{"fontFamily":"'DM Serif Display',serif","fontSize":"clamp(22px,2.2vw,30px)"} as CSSProperties}>
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
        {(vals.bands ?? []).map((b: any, i2: number) => (
          <Fragment key={i2}>
            {"\n  "}
            <section id={b.id} data-chapter={b.cat} data-num={b.num} data-screen-label={b.label} style={css(`position:relative;background:${b.bg};color:#fff;padding:clamp(80px,10vw,140px) clamp(20px,5vw,80px)`)}>
              {"\n    "}
              <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,360px),1fr))","gap":"40px clamp(40px,6vw,100px)","alignItems":"start"} as CSSProperties}>
                {"\n      "}
                <div className="lz-side" style={{"position":"sticky","top":"clamp(100px,16vh,160px)"} as CSSProperties}>
                  {"\n        "}
                  <p style={css(`margin:0;font-size:13px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${b.accent}`)}>
                    {b.eyebrow}
                  </p>
                  {"\n        "}
                  <h2 style={{"margin":"16px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,5.6vw,96px)","lineHeight":"0.9","letterSpacing":"-0.035em"} as CSSProperties}>
                    {b.title}
                  </h2>
                  {"\n        "}
                  <p style={css(`margin:24px 0 0;max-width:460px;font-size:clamp(17px,1.4vw,20px);line-height:1.55;color:${b.body}`)}>
                    {b.lead}
                  </p>
                  {"\n        "}
                  <p style={css(`margin:32px 0 0;font-family:'DM Serif Display',serif;font-size:clamp(90px,12vw,200px);line-height:0.8;color:transparent;-webkit-text-stroke:1.5px ${b.accent}`)}>
                    {b.count}
                  </p>
                  {"\n      "}
                </div>
                {"\n      "}
                <div style={{"display":"flex","flexDirection":"column","gap":"clamp(60px,10vh,120px)"} as CSSProperties}>
                  {"\n        "}
                  {(b.items ?? []).map((p: any, i3: number) => (
                    <Fragment key={i3}>
                      {"\n          "}
                      <article id={p.anchor} data-reveal="1" style={{"display":"flex","flexDirection":"column","gap":"18px"} as CSSProperties}>
                        {"\n            "}
                        <div onClick={p.open} style={css(`cursor:pointer;position:relative;aspect-ratio:5/4;background:${p.soft};display:flex;align-items:center;justify-content:center;padding:clamp(24px,4vw,56px);overflow:hidden;clip-path:inset(calc((1 - var(--r,0)) * 18%) round 0)`)}>
                          {"\n              "}
                          <span style={css(`position:absolute;left:18px;top:16px;font-size:13px;font-weight:700;letter-spacing:0.14em;color:${p.tone}`)}>
                            {p.num}
                          </span>
                          {"\n              "}
                          <img src={p.img} alt={p.alt} style={{"maxWidth":"100%","maxHeight":"100%","objectFit":"contain","filter":"drop-shadow(0 30px 34px rgba(35,16,58,0.28))","transform":"scale(calc(0.8 + var(--r,0) * 0.2)) rotate(calc((1 - var(--r,0)) * -8deg))"} as CSSProperties} />
                          {"\n            "}
                        </div>
                        {"\n            "}
                        <h3 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(30px,3vw,46px)","lineHeight":"1","letterSpacing":"-0.02em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 40px))"} as CSSProperties}>
                          {p.name}
                        </h3>
                        {"\n            "}
                        <p style={css(`margin:0;font-size:17px;line-height:1.55;color:${b.body}`)}>
                          {p.desc}
                        </p>
                        {"\n            "}
                        <p style={{"margin":"0","padding":"14px 0","borderTop":"1px solid rgba(255,255,255,0.22)","borderBottom":"1px solid rgba(255,255,255,0.22)","fontSize":"14px","lineHeight":"1.5","fontWeight":"600"} as CSSProperties}>
                          <span style={css(`display:block;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${b.accent};margin-bottom:4px`)}>
                            {"In the pack"}
                          </span>
                          {p.pack}
                        </p>
                        {"\n            "}
                        <div style={{"display":"flex","flexWrap":"wrap","gap":"2px"} as CSSProperties}>
                          {"\n              "}
                          <button type="button" onClick={p.open} style={{"border":"0","cursor":"pointer","padding":"16px 22px","background":"#fff","color":"#23103a","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                            {"View details"}
                          </button>
                          {"\n              "}
                          <a className="lzp5" href={p.wtb} style={{"padding":"16px 22px","border":"1px solid rgba(255,255,255,0.5)","color":"#fff","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                            {"Where to buy"}
                          </a>
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </article>
                      {"\n        "}
                    </Fragment>
                  ))}
                  {"\n      "}
                </div>
                {"\n    "}
              </div>
              {"\n  "}
            </section>
          </Fragment>
        ))}
        {/* DISTRIBUTORS */}
        <section id="distributors" data-chapter="Distributors" data-num="03" data-screen-label="04 Distributors" style={{"background":"#FFF1C9","padding":"clamp(80px,10vw,150px) clamp(20px,5vw,80px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,420px),1fr))","gap":"40px clamp(40px,6vw,100px)","alignItems":"end"} as CSSProperties}>
            {"\n    "}
            <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(46px,6.4vw,112px)","lineHeight":"0.9","letterSpacing":"-0.035em","color":"#23103a"} as CSSProperties}>
              {"\n      "}
              <span style={{"display":"block","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -10vw))"} as CSSProperties}>
                {"Distributors and"}
              </span>
              {"\n      "}
              <span style={{"display":"block","fontStyle":"italic","color":"#0E7A5B","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * 10vw))"} as CSSProperties}>
                {"Business Enquiries"}
              </span>
              {"\n    "}
            </h2>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"24px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"clamp(17px,1.4vw,21px)","lineHeight":"1.55","color":"#4a3b20"} as CSSProperties}>
                {"Interested in distributing or stocking Linzzy products? Contact our team to discuss product availability, distribution opportunities and commercial enquiries."}
              </p>
              {"\n      "}
              <div style={{"display":"flex","flexWrap":"wrap","gap":"2px"} as CSSProperties}>
                {"\n        "}
                <a className="lzp6" href="/contact#trade" style={{"padding":"18px 26px","background":"#0E7A5B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                  {"Trade enquiry →"}
                </a>
                {"\n        "}
                <a className="lzp7" href="/contact#where-to-buy" style={{"padding":"18px 26px","background":"#23103a","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                  {"Find a stockist"}
                </a>
                {"\n      "}
              </div>
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
              <a href={`${YAZZ}/`} target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Yazz® ↗"}
              </a>
              {"\n      "}
              <a href={`${HOOCH}/`} target="_blank" style={{"color":"#fff"} as CSSProperties}>
                {"Hooch® ↗"}
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
        {vals.hasDetail ? (
          <>
            {"\n  "}
            <div onClick={vals.closeDetail} style={{"position":"fixed","inset":"0","zIndex":"70","background":"rgba(26,11,43,0.7)","backdropFilter":"blur(6px)","display":"flex","alignItems":"center","justifyContent":"center","padding":"20px"} as CSSProperties}>
              {"\n    "}
              <div role="dialog" aria-modal="true" aria-label={vals.detail.name} onClick={vals.stop} style={{"width":"100%","maxWidth":"960px","maxHeight":"90vh","overflow":"auto","background":"#FBF8FF","display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,340px),1fr))"} as CSSProperties}>
                {"\n      "}
                <div style={css(`background:${vals.detail.soft};padding:40px;display:flex;align-items:center;justify-content:center;min-height:360px`)}>
                  <img src={vals.detail.img} alt={vals.detail.alt} style={{"maxWidth":"100%","maxHeight":"400px","objectFit":"contain","filter":"drop-shadow(0 24px 30px rgba(35,16,58,0.3))"} as CSSProperties} />
                </div>
                {"\n      "}
                <div style={{"padding":"clamp(28px,4vw,44px)","display":"flex","flexDirection":"column","gap":"16px"} as CSSProperties}>
                  {"\n        "}
                  <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","gap":"12px"} as CSSProperties}>
                    {"\n          "}
                    <span style={css(`font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${vals.detail.tone}`)}>
                      {vals.detail.cat}
                    </span>
                    {"\n          "}
                    <button type="button" onClick={vals.closeDetail} aria-label="Close product details" style={{"width":"44px","height":"44px","border":"0","background":"#23103a","color":"#fff","fontSize":"18px","cursor":"pointer"} as CSSProperties}>
                      {"✕"}
                    </button>
                    {"\n        "}
                  </div>
                  {"\n        "}
                  {vals.detail.headline ? (
                    <p style={css(`margin:0 0 -8px;font-size:13px;font-weight:700;letter-spacing:0.06em;color:${vals.detail.tone}`)}>
                      {vals.detail.headline}
                    </p>
                  ) : null}
                  <h2 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(32px,3.4vw,46px)","lineHeight":"1","letterSpacing":"-0.02em","color":"#23103a"} as CSSProperties}>
                    {vals.detail.name}
                  </h2>
                  {"\n        "}
                  <p style={{"margin":"0","fontSize":"17px","lineHeight":"1.6","color":"#3d2a55"} as CSSProperties}>
                    {vals.detail.desc}
                  </p>
                  {"\n        "}
                  <p style={{"margin":"0","padding":"14px 0","borderTop":"1px solid rgba(35,16,58,0.2)","borderBottom":"1px solid rgba(35,16,58,0.2)","fontSize":"15px","lineHeight":"1.5","fontWeight":"600","color":"#23103a"} as CSSProperties}>
                    <span style={{"display":"block","fontSize":"12px","letterSpacing":"0.14em","textTransform":"uppercase","color":"#7a6890","marginBottom":"4px"} as CSSProperties}>
                      {"In the pack"}
                    </span>
                    {vals.detail.pack}
                  </p>
                  {/* Lexta's product page fields (Drive, "3. Products Page"): key features, one expandable
                      "Usage, Ingredients & Skin Sensitivity" row, related articles (Read more) and the "Linzzy Says" line. */}
                  {(vals.detail.features ?? []).length ? (
                    <div>
                      <p style={{"margin":"0 0 8px","fontSize":"12px","fontWeight":"600","letterSpacing":"0.14em","textTransform":"uppercase","color":"#7a6890"} as CSSProperties}>
                        {"Key product features"}
                      </p>
                      <ul style={{"margin":"0","padding":"0","listStyle":"none","display":"flex","flexDirection":"column","gap":"6px","fontSize":"15px","lineHeight":"1.45","color":"#23103a"} as CSSProperties}>
                        {(vals.detail.features ?? []).map((f: string) => (
                          <li key={f} style={{"display":"flex","gap":"10px","alignItems":"baseline"} as CSSProperties}>
                            <span aria-hidden="true" style={css(`flex:none;font-weight:700;color:${vals.detail.tone}`)}>{"✓"}</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {vals.detail.hasCare ? (
                    <details className="lz-acc" style={{"borderTop":"1px solid rgba(35,16,58,0.2)","borderBottom":"1px solid rgba(35,16,58,0.2)"} as CSSProperties}>
                      <summary style={{"display":"flex","justifyContent":"space-between","alignItems":"center","gap":"12px","padding":"14px 0","cursor":"pointer","fontSize":"14px","fontWeight":"700","lineHeight":"1.35","color":"#23103a"} as CSSProperties}>
                        <span>{"Usage, Ingredients & Skin Sensitivity"}</span>
                        <span className="lz-acc-i" aria-hidden="true" style={{"flex":"none","width":"32px","height":"32px","display":"flex","alignItems":"center","justifyContent":"center","background":"#23103a","color":"#fff","fontSize":"18px","lineHeight":"1"} as CSSProperties} />
                      </summary>
                      <dl style={{"margin":"0","padding":"0 0 16px","display":"flex","flexDirection":"column","gap":"12px","fontSize":"15px","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
                        {(vals.detail.care ?? []).map((r: { label: string; text: string }) => (
                          <div key={r.label}>
                            <dt style={{"fontSize":"12px","fontWeight":"700","letterSpacing":"0.14em","textTransform":"uppercase","color":"#7a6890","marginBottom":"2px"} as CSSProperties}>{r.label}</dt>
                            <dd style={{"margin":"0"} as CSSProperties}>{r.text}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ) : null}
                  {(vals.detail.reads ?? []).length ? (
                    <p style={{"margin":"0","fontSize":"15px","lineHeight":"1.5","color":"#3d2a55"} as CSSProperties}>
                      <span style={{"display":"block","fontSize":"12px","fontWeight":"600","letterSpacing":"0.14em","textTransform":"uppercase","color":"#7a6890","marginBottom":"4px"} as CSSProperties}>
                        {"Read more"}
                      </span>
                      {(vals.detail.reads ?? []).map((r: { slug: string; title: string }, i: number) => (
                        <Fragment key={r.slug}>
                          {i ? <br /> : null}
                          <a href={`/tips/${r.slug}`} className="lzp3" style={{"color":"#23103a","textDecoration":"underline","textUnderlineOffset":"3px"} as CSSProperties}>{r.title}</a>
                        </Fragment>
                      ))}
                    </p>
                  ) : null}
                  {vals.detail.says ? (
                    <p style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontStyle":"italic","fontSize":"clamp(20px,1.8vw,24px)","lineHeight":"1.2","color":"#23103a"} as CSSProperties}>
                      <span style={css(`display:block;font-family:'Hanken Grotesk',sans-serif;font-style:normal;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${vals.detail.tone};margin-bottom:4px`)}>
                        {"Linzzy says"}
                      </span>
                      {vals.detail.says}
                    </p>
                  ) : null}
                  {"\n        "}
                  <div style={{"display":"flex","flexWrap":"wrap","gap":"2px","marginTop":"6px"} as CSSProperties}>
                    {"\n          "}
                    <a className="lzp6" href={vals.detail.wtb} style={{"padding":"16px 22px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                      {"Where to buy"}
                    </a>
                    {"\n          "}
                    <a className="lzp7" href={vals.detail.ask} style={{"padding":"16px 22px","background":"#23103a","color":"#fff","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                      {"Ask a question"}
                    </a>
                    {"\n        "}
                  </div>
                  {"\n      "}
                </div>
                {"\n    "}
              </div>
              {"\n  "}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
