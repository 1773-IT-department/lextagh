// GENERATED from the Claude Design prototype "Linzzy FAQs.dc.html" by scratch convert.mjs, then kept in the repo.
// The markup, inline styles and animation hooks (data-pin, data-reveal, data-speed, data-marquee, data-progress,
// data-chapter) are the prototype's own; the page component supplies v (the prototype's renderVals) and runs the
// scroll engine (components/linzzy/scroll.ts). Hover styles live in app/linzzy-hover.css.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, type CSSProperties } from "react";
import { css } from "../css";
import { hoochSiteUrl as HOOCH, lextaSiteUrl as LEXTA, yazzSiteUrl as YAZZ } from "@/lib/site";

export default function FaqsView({ v: vals }: { v: any }) {
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
            <a className="lzf0" href="/contact#where-to-buy" style={{"display":"flex","alignItems":"center","padding":"0 20px","height":"50px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
              {"Where to Buy"}
            </a>
            {"\n    "}
            <button type="button" aria-expanded={!!vals.menuOpen} aria-controls="site-menu" onClick={vals.toggleMenu} style={{"height":"50px","minWidth":"96px","padding":"0 20px","border":"0","background":"#23103a","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase","cursor":"pointer"} as CSSProperties}>
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
                    <a className="lzf1" href={c.href} onClick={c.go} style={{"display":"flex","alignItems":"baseline","gap":"18px","padding":"10px 0","borderBottom":"1px solid rgba(255,255,255,0.14)","color":"#fff","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.4vw,44px)","lineHeight":"1.05"} as CSSProperties}>
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
                    <a className="lzf2" href={n.href} onClick={n.go} aria-current={n.current} style={css(`display:block;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.14);color:${n.c};font-family:'DM Serif Display',serif;font-size:clamp(28px,3.4vw,44px);line-height:1.05`)}>
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
        <section id="top" data-chapter="Got a Question?" data-num="00" data-screen-label="01 FAQs Hero" style={{"background":"#FBF8FF","padding":"clamp(130px,16vw,200px) clamp(20px,5vw,80px) clamp(50px,6vw,80px)"} as CSSProperties}>
          {"\n  "}
          <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#C2185B"} as CSSProperties}>
            {"FAQs"}
          </p>
          {"\n  "}
          <h1 data-reveal="1" style={{"margin":"20px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(54px,10vw,190px)","lineHeight":"0.86","letterSpacing":"-0.04em","color":"#23103a"} as CSSProperties}>
            {"\n    "}
            <span style={{"display":"block","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -12vw))"} as CSSProperties}>
              {"Got a question?"}
            </span>
            {"\n    "}
            <span style={{"display":"block","fontStyle":"italic","color":"#5B1A7A","fontSize":"0.62em","lineHeight":"1","marginTop":"0.18em","textAlign":"right","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * 12vw))"} as CSSProperties}>
              {"Let's explore it together."}
            </span>
            {"\n  "}
          </h1>
          {"\n  "}
          <p style={{"margin":"clamp(30px,4vw,60px) 0 0","maxWidth":"620px","fontSize":"clamp(18px,1.5vw,22px)","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
            {"Have questions about our sanitary towels, panty liners, baby diapers or baby wipes?"}
          </p>
        </section>
        <section id="answers" style={{"background":"#FBF8FF","padding":"clamp(30px,4vw,60px) clamp(20px,5vw,80px) clamp(90px,11vw,160px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,300px),1fr))","gap":"48px clamp(40px,5vw,80px)","alignItems":"start"} as CSSProperties}>
            {"\n    "}
            <aside className="lz-side" style={{"position":"sticky","top":"96px","display":"flex","flexDirection":"column","gap":"28px"} as CSSProperties}>
              {"\n      "}
              <label style={{"display":"flex","alignItems":"center","gap":"10px","borderBottom":"2px solid #23103a","padding":"10px 0"} as CSSProperties}>
                {"\n        "}
                <span style={{"fontSize":"18px","color":"#5B1A7A"} as CSSProperties}>
                  {"⌕"}
                </span>
                {"\n        "}
                <input type="search" value={vals.faqQ} onChange={vals.onFaqQ} placeholder="Search questions, e.g. diaper size" aria-label="Search questions" style={{"flex":"1","minWidth":"0","border":"0","outline":"none","background":"transparent","fontSize":"17px","color":"#23103a"} as CSSProperties} />
                {"\n      "}
              </label>
              {"\n      "}
              <div style={{"display":"flex","flexDirection":"column","borderTop":"1px solid rgba(35,16,58,0.2)"} as CSSProperties}>
                {"\n        "}
                {(vals.faqChips ?? []).map((c: any, i2: number) => (
                  <Fragment key={i2}>
                    {"\n          "}
                    <button aria-pressed={c.pressed === "true"} onClick={c.onClick} style={css(`display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:14px 0;border:0;border-bottom:1px solid rgba(35,16,58,0.2);background:transparent;text-align:left;font-family:'DM Serif Display',serif;font-size:24px;color:${c.fg}`)}>
                      {c.label}
                      <span style={css(`width:10px;height:10px;background:${c.dot}`)}>
                      </span>
                    </button>
                    {"\n        "}
                  </Fragment>
                ))}
                {"\n      "}
              </div>
              {"\n      "}
              <div style={{"background":"#23103a","color":"#fff","padding":"28px","display":"flex","flexDirection":"column","gap":"12px"} as CSSProperties}>
                {"\n        "}
                <h2 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"32px","lineHeight":"1"} as CSSProperties}>
                  {"How Can We Help You?"}
                </h2>
                {"\n        "}
                <p style={{"margin":"0 0 6px","fontSize":"15px","lineHeight":"1.55","color":"#d9cdea"} as CSSProperties}>
                  {"Every question matters. Our team is ready to hear from you."}
                </p>
                {"\n        "}
                <a className="lzf0" href="/contact#message" style={{"textAlign":"center","padding":"16px 20px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                  {"Contact us →"}
                </a>
                {"\n        "}
                <a className="lzf3" href="https://wa.me/233544351010" target="_blank" style={{"textAlign":"center","padding":"16px 20px","border":"1px solid rgba(255,255,255,0.4)","color":"#fff","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                  {"WhatsApp Customer Care"}
                </a>
                {"\n      "}
              </div>
              {"\n    "}
            </aside>
            {"\n    "}
            <div className="lz-span2-sm" style={{"gridColumn":"span 2","minWidth":"0","display":"flex","flexDirection":"column","gap":"clamp(60px,7vw,100px)"} as CSSProperties}>
              {"\n      "}
              {vals.faqEmpty ? (
                <>
                  {"\n        "}
                  <p style={{"margin":"0","padding":"28px 0","borderTop":"1px solid #23103a","borderBottom":"1px solid #23103a","fontFamily":"'DM Serif Display',serif","fontSize":"26px"} as CSSProperties}>
                    {"No questions match that search. Try another word, or contact our team."}
                  </p>
                  {"\n      "}
                </>
              ) : null}
              {"\n      "}
              {(vals.faqGroups ?? []).map((g: any, i3: number) => (
                <Fragment key={i3}>
                  {"\n        "}
                  <div id={g.anchor} data-chapter={g.title} data-num={g.num}>
                    {"\n          "}
                    <h2 data-reveal="1" style={{"margin":"0 0 18px","display":"flex","alignItems":"baseline","gap":"18px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(40px,5vw,80px)","lineHeight":"0.95","letterSpacing":"-0.03em","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -60px))"} as CSSProperties}>
                      <span style={css(`font-family:'Hanken Grotesk',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.14em;color:${g.tone}`)}>
                        {g.num}
                      </span>
                      {g.title}
                    </h2>
                    {"\n          "}
                    <div style={{"borderTop":"1px solid #23103a"} as CSSProperties}>
                      {"\n            "}
                      {(g.items ?? []).map((f: any, i4: number) => (
                        <Fragment key={i4}>
                          {"\n              "}
                          <div data-reveal="1" style={css(`border-bottom:1px solid #23103a;background:${f.bg};transition:background .3s;opacity:calc(0.2 + var(--r,0) * 0.8)`)}>
                            {"\n                "}
                            <button aria-expanded={f.open} onClick={f.toggle} style={{"width":"100%","display":"flex","justifyContent":"space-between","alignItems":"center","gap":"20px","padding":"22px 0","border":"0","background":"transparent","cursor":"pointer","textAlign":"left","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(21px,1.9vw,28px)","lineHeight":"1.2","color":"#23103a"} as CSSProperties}>
                              {"\n                  "}
                              <span>
                                {f.q}
                              </span>
                              {"\n                  "}
                              <span style={css(`flex:none;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:${f.iconBg};color:#fff;font-family:'Hanken Grotesk',sans-serif;font-size:22px;line-height:1`)}>
                                {f.icon}
                              </span>
                              {"\n                "}
                            </button>
                            {"\n                "}
                            {(
                              <>
                                {"\n                  "}
                                <div data-faq-a="1" hidden={!f.open}><div style={{"padding":"0 64px 26px 0","display":"flex","flexDirection":"column","gap":"14px"} as CSSProperties}>
                                  {"\n                    "}
                                  <p style={{"margin":"0","fontSize":"17px","lineHeight":"1.65","color":"#3d2a55"} as CSSProperties}>
                                    {f.a}
                                  </p>
                                  {"\n                    "}
                                  <a href={f.href} style={{"alignSelf":"flex-start","paddingBottom":"4px","borderBottom":"1.5px solid #C2185B","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase","color":"#C2185B"} as CSSProperties}>
                                    {f.link}
                                    {" →"}
                                  </a>
                                  {"\n                  "}
                                </div></div>
                                {"\n                "}
                              </>
                            )}
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </Fragment>
                      ))}
                      {"\n          "}
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
      </div>
    </>
  );
}
