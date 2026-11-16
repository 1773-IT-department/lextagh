// GENERATED from the Claude Design prototype "Linzzy Contact.dc.html" by scratch convert.mjs, then kept in the repo.
// The markup, inline styles and animation hooks (data-pin, data-reveal, data-speed, data-marquee, data-progress,
// data-chapter) are the prototype's own; the page component supplies v (the prototype's renderVals) and runs the
// scroll engine (components/linzzy/scroll.ts). Hover styles live in app/linzzy-hover.css.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, type CSSProperties } from "react";
import { css } from "../css";
import { lextaSiteUrl as LEXTA } from "@/lib/site";
import { Err, FormError, Honeypot, fieldAria } from "../FormBits";
import { Select } from "@lexta/ui";

export default function ContactView({ v: vals }: { v: any }) {
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
            <a className="lzc0" href="#where-to-buy" onClick={vals.jump.wtb} style={{"display":"flex","alignItems":"center","padding":"0 20px","height":"50px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
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
                    <a className="lzc1" href={c.href} onClick={c.go} style={{"display":"flex","alignItems":"baseline","gap":"18px","padding":"10px 0","borderBottom":"1px solid rgba(255,255,255,0.14)","color":"#fff","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(28px,3.4vw,44px)","lineHeight":"1.05"} as CSSProperties}>
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
                    <a className="lzc2" href={n.href} aria-current={n.current} style={css(`display:block;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.14);color:${n.c};font-family:'DM Serif Display',serif;font-size:clamp(28px,3.4vw,44px);line-height:1.05`)}>
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
        <section id="top" data-chapter="We're Here to Listen" data-num="00" data-screen-label="01 Contact Hero" style={{"background":"#FBF8FF","padding":"clamp(130px,16vw,200px) clamp(20px,5vw,80px) clamp(70px,9vw,120px)"} as CSSProperties}>
          {"\n  "}
          <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#0E7A5B"} as CSSProperties}>
            {"Contact Linzzy"}
          </p>
          {"\n  "}
          <h1 data-reveal="1" style={{"margin":"20px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(48px,8.6vw,164px)","lineHeight":"0.88","letterSpacing":"-0.04em","color":"#23103a"} as CSSProperties}>
            {"\n    "}
            <span style={{"display":"block","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -10vw))"} as CSSProperties}>
              {"We're Here to Listen,"}
            </span>
            {"\n    "}
            <span style={{"display":"block","textAlign":"right","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * 10vw))"} as CSSProperties}>
              {"Care and "}
              <em style={{"color":"#C2185B"} as CSSProperties}>
                {"Support."}
              </em>
            </span>
            {"\n  "}
          </h1>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,380px),1fr))","gap":"28px clamp(40px,6vw,100px)","alignItems":"end","marginTop":"clamp(40px,6vw,80px)","paddingTop":"32px","borderTop":"1px solid #23103a"} as CSSProperties}>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","gap":"14px","fontSize":"clamp(17px,1.4vw,20px)","lineHeight":"1.6","color":"#3d2a55"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0"} as CSSProperties}>
                {"At Linzzy, every question matters, every experience counts and every piece of feedback helps us improve."}
              </p>
              {"\n      "}
              <p style={{"margin":"0"} as CSSProperties}>
                {"Whether you need product information, want to share your experience, make a business enquiry or explore a partnership, our team is ready to hear from you."}
              </p>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexWrap":"wrap","gap":"2px"} as CSSProperties}>
              {"\n      "}
              <a className="lzc3" href="#where-to-buy" onClick={vals.jump.wtb} style={{"padding":"18px 26px","background":"#0E7A5B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"Find a Stockist"}
              </a>
              {"\n      "}
              <a className="lzc4" href="#message" onClick={vals.jump.message} style={{"padding":"18px 26px","background":"#23103a","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase"} as CSSProperties}>
                {"Send Us a Message →"}
              </a>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* WAYS */}
        <section id="help" data-chapter="How Can We Help" data-num="01" data-screen-label="02 How Can We Help" style={{"background":"#FBF8FF","padding":"0 clamp(20px,5vw,80px) clamp(80px,10vw,140px)"} as CSSProperties}>
          {"\n  "}
          <h2 data-reveal="1" style={{"margin":"0 0 clamp(30px,4vw,56px)","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,6vw,104px)","lineHeight":"0.9","letterSpacing":"-0.035em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
            {"How Can We "}
            <em style={{"color":"#C2185B"} as CSSProperties}>
              {"Help You?"}
            </em>
          </h2>
          {"\n  "}
          <div style={{"borderTop":"1px solid #23103a"} as CSSProperties}>
            {"\n    "}
            {(vals.ways ?? []).map((w: any, i2: number) => (
              <Fragment key={i2}>
                {"\n      "}
                <div className="lzc5" data-reveal="1" style={{"--hover-bg":w.bg,"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,300px),1fr))","gap":"14px 40px","alignItems":"center","padding":"clamp(22px,3vw,34px) 0","borderBottom":"1px solid #23103a","transition":"background .3s,padding .3s"} as CSSProperties}>
                  {"\n        "}
                  <div style={{"display":"flex","alignItems":"baseline","gap":"20px","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -70px))"} as CSSProperties}>
                    {"\n          "}
                    <span style={{"fontSize":"13px","fontWeight":"700","letterSpacing":"0.14em","color":"#C2185B"} as CSSProperties}>
                      {w.n}
                    </span>
                    {"\n          "}
                    <h3 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(28px,3vw,46px)","lineHeight":"1","letterSpacing":"-0.02em"} as CSSProperties}>
                      {w.t}
                    </h3>
                    {"\n        "}
                  </div>
                  {"\n        "}
                  <div style={{"display":"flex","flexDirection":"column","gap":"12px","opacity":"var(--r,0)"} as CSSProperties}>
                    {"\n          "}
                    <p style={{"margin":"0","fontSize":"16px","lineHeight":"1.55","color":"#3d2a55"} as CSSProperties}>
                      {w.d}
                    </p>
                    {"\n          "}
                    <a className="lzc6" href={w.href} onClick={w.onClick} style={{"alignSelf":"flex-start","paddingBottom":"3px","borderBottom":"1.5px solid #23103a","color":"#23103a","fontWeight":"700","fontSize":"13px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                      {w.cta}
                      {" →"}
                    </a>
                    {"\n        "}
                  </div>
                  {"\n      "}
                </div>
                {"\n    "}
              </Fragment>
            ))}
            {"\n  "}
          </div>
        </section>
        {/* WHERE TO BUY */}
        <section id="where-to-buy" data-chapter="Where to Buy" data-num="02" data-screen-label="03 Where to Buy" style={{"background":"#1a0b2b","color":"#fff","padding":"clamp(80px,10vw,140px) clamp(20px,5vw,80px)"} as CSSProperties}>
          {"\n  "}
          <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
            {"Where to buy"}
          </p>
          {"\n  "}
          <h2 data-reveal="1" style={{"margin":"14px 0 0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(50px,8vw,150px)","lineHeight":"0.88","letterSpacing":"-0.04em"} as CSSProperties}>
            {"\n    "}
            <span style={{"display":"block","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * -10vw))"} as CSSProperties}>
              {"Find Linzzy"}
            </span>
            {"\n    "}
            <span style={{"display":"block","fontStyle":"italic","color":"#9EE6C8","opacity":"var(--r,0)","transform":"translateX(calc((1 - var(--r,0)) * 10vw))"} as CSSProperties}>
              {"Near You"}
            </span>
            {"\n  "}
          </h2>
          {"\n  "}
          <p style={{"margin":"24px 0 0","maxWidth":"640px","fontSize":"clamp(17px,1.4vw,20px)","lineHeight":"1.6","color":"#d9cdea"} as CSSProperties}>
            {"Choose your region, search by town or shop, then tap a shop to see it on the map."}
          </p>
          {"\n  "}
          <form method="get" action="/contact#where-to-buy" onSubmit={vals.onWtbSubmit} aria-label="Find a stockist" style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,280px),1fr))","gap":"20px 32px","marginTop":"40px"} as CSSProperties}>
            {"\n    "}
            <label style={{"display":"flex","flexDirection":"column","gap":"8px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.12em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
              {"Your region\n      "}
              <Select wrapperClassName="lz-sel lz-sel-dark" nativeOnTouch={false} id="wtb-region" name="region" value={vals.region} onChange={vals.onRegion} style={{"height":"58px","padding":"0 4px","border":"0","borderBottom":"2px solid #fff","fontSize":"20px","fontWeight":"600","background":"transparent","color":"#fff","outline":"none"} as CSSProperties}>
                {(vals.regionOpts ?? []).map((r: any, i3: number) => (
                  <Fragment key={i3}>
                    <option value={r.v} style={{"color":"#23103a"} as CSSProperties}>
                      {r.l}
                    </option>
                  </Fragment>
                ))}
              </Select>
              {"\n    "}
            </label>
            {"\n    "}
            <label style={{"display":"flex","flexDirection":"column","gap":"8px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.12em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
              {"Search town or shop\n      "}
              <input id="wtb-q" type="search" value={vals.wtbQ} onChange={vals.onWtbQ} placeholder="Enter a town or shop name" style={{"height":"58px","padding":"0 4px","border":"0","borderBottom":"2px solid #fff","fontSize":"20px","background":"transparent","color":"#fff","outline":"none"} as CSSProperties} />
              {"\n    "}
            </label>
            {"\n  "}
            <noscript>
              <button type="submit" style={{"alignSelf":"end","height":"58px","padding":"0 28px","border":"0","background":"#fff","color":"#23103a","fontWeight":"700","fontSize":"14px","letterSpacing":"0.04em","textTransform":"uppercase","cursor":"pointer"} as CSSProperties}>Find stockists</button>
            </noscript>
          </form>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,320px),1fr))","gap":"2px","marginTop":"32px"} as CSSProperties}>
            {"\n    "}
            <div style={{"background":"#2a1446","padding":"clamp(24px,3vw,36px)","display":"flex","flexDirection":"column","gap":"14px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(26px,2.4vw,36px)","lineHeight":"1.05"} as CSSProperties}>
                {vals.wtbCount}
              </p>
              {"\n      "}
              {vals.wtbEmpty ? (
              <p style={{"margin":"0","fontSize":"16px","lineHeight":"1.6","color":"#d9cdea"} as CSSProperties}>
                {"No Linzzy stockists are listed "}
                {vals.wtbWhere}
                {" yet. Try another region, or "}
                <a href="/contact?topic=stockist#message" onClick={vals.askStockist} style={{"color":"#9EE6C8","textDecoration":"underline"} as CSSProperties}>
                  {"ask us"}
                </a>
                {" to find your nearest shop."}
              </p>
              ) : vals.wtbList}
              {"\n    "}
            </div>
            {"\n    "}
            <div className="lz-span2-sm" style={{"gridColumn":"span 2","minHeight":"360px","background":"repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0 12px,rgba(255,255,255,0) 12px 24px),#2a1446","display":"flex","alignItems":"stretch","justifyContent":"center","fontFamily":"ui-monospace,Menlo,monospace","fontSize":"13px","color":"#b9a8d1","textAlign":"center","padding":"0"} as CSSProperties}>
              {vals.wtbMap}
            </div>
            {"\n  "}
          </div>
          {"\n  "}
          <p style={{"margin":"20px 0 0","fontSize":"14px","color":"#d9cdea"} as CSSProperties}>
            {"Your shop stocks Linzzy and is not listed? "}
            <a href="#trade" onClick={vals.jump.trade} style={{"color":"#9EE6C8","textDecoration":"underline"} as CSSProperties}>
              {"Tell us"}
            </a>
            {"."}
          </p>
        </section>
        {/* MESSAGE */}
        <section id="message" data-chapter="Send Us a Message" data-num="03" data-screen-label="04 Send Us a Message" style={{"background":"#FBF8FF","padding":"clamp(80px,10vw,140px) clamp(20px,5vw,80px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,340px),1fr))","gap":"48px clamp(40px,5vw,80px)","alignItems":"start"} as CSSProperties}>
            {"\n    "}
            <div className="lz-span2-md" style={{"gridColumn":"span 2","minWidth":"0"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#C2185B"} as CSSProperties}>
                {"Send us a message"}
              </p>
              {"\n      "}
              <h2 data-reveal="1" style={{"margin":"14px 0 12px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,6vw,104px)","lineHeight":"0.9","letterSpacing":"-0.035em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
                {"Send Us a "}
                <em style={{"color":"#C2185B"} as CSSProperties}>
                  {"Message"}
                </em>
              </h2>
              {"\n      "}
              <p style={{"margin":"0 0 36px","fontSize":"17px","color":"#3d2a55"} as CSSProperties}>
                {"Complete the contact form and select the subject that best describes your enquiry. Send your proposal to marketing@linzzyproducts.com."}
              </p>
              {"\n      "}
              {vals.msgSent ? (
                <>
                  {"\n        "}
                  <div style={{"padding":"32px","background":"#DDF7EC","color":"#0B3D2E"} as CSSProperties}>
                    {"\n          "}
                    <p style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontSize":"32px"} as CSSProperties}>
                      {"Thank you. We've got your message."}
                    </p>
                    {"\n          "}
                    <p style={{"margin":"8px 0 0","fontSize":"16px"} as CSSProperties}>
                      {"Your message goes to the Linzzy team."}
                    </p>
                    {vals.msg.state.message ? <p role="status" data-form-message="" tabIndex={-1} style={{ margin: "12px 0 0", fontSize: 16, fontWeight: 600 }}>{vals.msg.state.message}</p> : null}
                    {"\n        "}
                  </div>
                  {"\n      "}
                </>
              ) : null}
              {"\n      "}
              {vals.msgOpen ? (
                <>
                  {"\n        "}
                  <form ref={vals.msg.ref} action={vals.msg.action} onSubmit={vals.msg.onSubmit} noValidate aria-label="Send us a message" style={{"display":"flex","flexDirection":"column","gap":"28px"} as CSSProperties}>
                    <Honeypot />
                    <input type="hidden" name="topic" value={vals.topic} />
                    {"\n          "}
                    <div>
                      {"\n            "}
                      <p style={{"margin":"0 0 12px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.12em","textTransform":"uppercase"} as CSSProperties}>
                        {"What is it about?"}
                      </p>
                      {"\n            "}
                      <div className="lz-topics" style={{"display":"flex","flexWrap":"wrap","gap":"2px"} as CSSProperties}>
                        {"\n              "}
                        {(vals.topics ?? []).map((c: any, i4: number) => (
                          <Fragment key={i4}>
                            {"\n                "}
                            <button type="button" aria-pressed={c.on} onClick={c.onClick} className="lz-topic" style={css(`cursor:pointer;padding:12px 16px;font-weight:600;font-size:14px;border:1px solid #23103a;background:${c.bg};color:${c.fg}`)}>
                              {c.label}
                            </button>
                            {"\n              "}
                          </Fragment>
                        ))}
                        {"\n            "}
                      </div>
                      {"\n            "}
                      <p style={{"margin":"12px 0 0","fontSize":"14px","color":"#7a6890"} as CSSProperties}>
                        {vals.topicHint}
                      </p>
                      {"\n          "}
                    </div>
                    {"\n          "}
                    <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,200px),1fr))","gap":"20px 28px"} as CSSProperties}>
                      {"\n            "}
                      <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                        {"Full name"}
                        <input name="name" autoComplete="name" required maxLength={120} defaultValue={vals.msg.v.name ?? ""} {...fieldAria(vals.msg.state, "name", "c-name-error")} placeholder="Ama Mensah" style={{"height":"50px","padding":"0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"18px","background":"transparent","color":"#23103a","outline":"none","textTransform":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties} />
                        <Err id="c-name-error" msg={vals.msg.state.fieldErrors?.name} />
                      </label>
                      {"\n            "}
                      <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                        {"Email"}
                        <input name="email" type="email" autoComplete="email" maxLength={254} defaultValue={vals.msg.v.email ?? ""} {...fieldAria(vals.msg.state, "email", "c-email-error")} placeholder="you@email.com" style={{"height":"50px","padding":"0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"18px","background":"transparent","color":"#23103a","outline":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties} />
                        <Err id="c-email-error" msg={vals.msg.state.fieldErrors?.email} />
                      </label>
                      {"\n            "}
                      <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                        {"Phone"}
                        <input name="phone" type="tel" autoComplete="tel" maxLength={24} defaultValue={vals.msg.v.phone ?? ""} {...fieldAria(vals.msg.state, "phone", "c-phone-error")} placeholder="+233 ..." style={{"height":"50px","padding":"0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"18px","background":"transparent","color":"#23103a","outline":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties} />
                        <Err id="c-phone-error" msg={vals.msg.state.fieldErrors?.phone} />
                      </label>
                      {"\n          "}
                    </div>
                    {"\n          "}
                    <p style={{"margin":"-14px 0 0","fontSize":"13px","color":"#7a6890"} as CSSProperties}>
                      {"An email address or a phone number, so we can reply."}
                    </p>
                    {"\n          "}
                    <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,240px),1fr))","gap":"20px 28px"} as CSSProperties}>
                      {"\n            "}
                      <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                        {"Region (optional)\n              "}
                        <Select wrapperClassName="lz-sel" nativeOnTouch={false} name="region" defaultValue={vals.msg.v.region ?? vals.initialRegion} style={{"height":"50px","padding":"0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"17px","background":"transparent","color":"#23103a","outline":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties}>
                          <option value="">
                            {"Choose your region"}
                          </option>
                          {(vals.regionOptsOnly ?? []).map((r: any, i5: number) => (
                            <Fragment key={i5}>
                              <option value={r.v}>
                                {r.l}
                              </option>
                            </Fragment>
                          ))}
                        </Select>
                        {"\n            "}
                      </label>
                      {"\n            "}
                      <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                        {"Product (optional)\n              "}
                        <Select wrapperClassName="lz-sel" nativeOnTouch={false} name="product" defaultValue={vals.msg.v.product ?? vals.initialProduct} style={{"height":"50px","padding":"0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"17px","background":"transparent","color":"#23103a","outline":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties}>
                          <option value="">
                            {"Choose a product"}
                          </option>
                          {(vals.productNames ?? []).map((p: any, i6: number) => (
                            <Fragment key={i6}>
                              <option value={p.slug}>
                                {p.name}
                              </option>
                            </Fragment>
                          ))}
                        </Select>
                        {"\n            "}
                      </label>
                      {"\n          "}
                    </div>
                    {"\n          "}
                    {vals.isProblem ? (
                      <>
                        {"\n            "}
                        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,200px),1fr))","gap":"20px 28px","padding":"24px","background":"#FFE3EE"} as CSSProperties}>
                          {"\n              "}
                          <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                            {"Batch code (on the pack)"}
                            <input name="batch" maxLength={60} defaultValue={vals.msg.v.batch ?? ""} {...fieldAria(vals.msg.state, "batch", "c-batch-error")} style={{"height":"46px","padding":"0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"17px","background":"transparent","outline":"none"} as CSSProperties} />
                            <Err id="c-batch-error" msg={vals.msg.state.fieldErrors?.batch} />
                          </label>
                          {"\n              "}
                          <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                            {"Where you bought it"}
                            <input name="purchase_place" maxLength={200} defaultValue={vals.msg.v.purchase_place ?? ""} {...fieldAria(vals.msg.state, "purchase_place", "c-place-error")} placeholder="Shop and town" style={{"height":"46px","padding":"0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"17px","background":"transparent","outline":"none","textTransform":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties} />
                            <Err id="c-place-error" msg={vals.msg.state.fieldErrors?.purchase_place} />
                          </label>
                          {"\n              "}
                          <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                            {"Date bought"}
                            <input name="purchase_date" type="date" max={vals.today} defaultValue={vals.msg.v.purchase_date ?? ""} {...fieldAria(vals.msg.state, "purchase_date", "c-date-error")} style={{"height":"46px","padding":"0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"17px","background":"transparent","outline":"none"} as CSSProperties} />
                            <Err id="c-date-error" msg={vals.msg.state.fieldErrors?.purchase_date} />
                          </label>
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </>
                    ) : null}
                    {"\n          "}
                    <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase"} as CSSProperties}>
                      {"Message"}
                      <textarea name="message" required maxLength={3000} defaultValue={vals.msg.v.message ?? ""} {...fieldAria(vals.msg.state, "message", "c-message-error")} placeholder="Tell us what you need, or what happened." style={{"minHeight":"150px","padding":"14px 0","border":"0","borderBottom":"1.5px solid #23103a","fontSize":"18px","background":"transparent","color":"#23103a","resize":"vertical","outline":"none","textTransform":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties}>
                      </textarea>
                      <Err id="c-message-error" msg={vals.msg.state.fieldErrors?.message} />
                    </label>
                    {"\n          "}
                    <p style={{"margin":"0","fontSize":"13px","color":"#7a6890"} as CSSProperties}>
                      {"Please do not share sensitive health details in this form. We use your details only to answer you."}
                    </p>
                    {"\n          "}
                    <label style={{"display":"flex","gap":"10px","alignItems":"center","fontSize":"14px"} as CSSProperties}>
                      <input type="checkbox" name="privacy" value="yes" {...fieldAria(vals.msg.state, "privacy", "c-privacy-error")} style={{"accentColor":"#C2185B"} as CSSProperties} />
                      {"I agree to the "}
                      <a href={vals.privacyUrl} target="_blank" rel="noopener">
                        {"privacy notice"}
                      </a>
                      {"."}
                    </label>
                    <Err id="c-privacy-error" msg={vals.msg.state.fieldErrors?.privacy} />
                    <FormError state={vals.msg.state} />
                    {"\n          "}
                    <button type="submit" aria-disabled={vals.msg.pending || undefined} style={{"alignSelf":"flex-start","border":"0","cursor":"pointer","padding":"20px 32px","background":"#C2185B","color":"#fff","fontWeight":"700","fontSize":"14px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                      {"Submit Enquiry →"}
                    </button>
                    {"\n        "}
                  </form>
                  {"\n      "}
                </>
              ) : null}
              {"\n    "}
            </div>
            {"\n    "}
            <aside className="lz-side" style={{"position":"sticky","top":"96px","display":"flex","flexDirection":"column","gap":"2px"} as CSSProperties}>
              {"\n      "}
              <div style={{"background":"#EFE6FF","padding":"28px"} as CSSProperties}>
                {"\n        "}
                <h3 style={{"margin":"0 0 10px","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"28px"} as CSSProperties}>
                  {"Reporting a concern?"}
                </h3>
                {"\n        "}
                <p style={{"margin":"0 0 14px","fontSize":"15px"} as CSSProperties}>
                  {"Where relevant, kindly provide:"}
                </p>
                {"\n        "}
                <div style={{"display":"flex","flexDirection":"column","borderTop":"1px solid rgba(35,16,58,0.2)"} as CSSProperties}>
                  {"\n          "}
                  {(vals.checklist ?? []).map((c: any, i7: number) => (
                    <Fragment key={i7}>
                      {"\n            "}
                      <p style={{"margin":"0","padding":"10px 0","borderBottom":"1px solid rgba(35,16,58,0.2)","display":"flex","gap":"12px","fontSize":"14px","lineHeight":"1.45"} as CSSProperties}>
                        <span style={{"flex":"none","fontSize":"12px","fontWeight":"700","color":"#C2185B","paddingTop":"2px"} as CSSProperties}>
                          {c.n}
                        </span>
                        {c.t}
                      </p>
                      {"\n          "}
                    </Fragment>
                  ))}
                  {"\n        "}
                </div>
                {"\n        "}
                <p style={{"margin":"14px 0 0","fontSize":"14px","color":"#3d2a55"} as CSSProperties}>
                  {"Our team will review your submission and advise on the appropriate next steps."}
                </p>
                {"\n      "}
              </div>
              {"\n      "}
              <div style={{"background":"#23103a","color":"#fff","padding":"28px","display":"flex","flexDirection":"column","gap":"12px","fontSize":"14px","lineHeight":"1.5"} as CSSProperties}>
                {"\n        "}
                <h3 style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"28px"} as CSSProperties}>
                  {"Get in Touch"}
                </h3>
                {"\n        "}
                <p style={{"margin":"0","color":"#d9cdea"} as CSSProperties}>
                  <strong style={{"color":"#fff"} as CSSProperties}>
                    {"Linzzy Products"}
                  </strong>
                  <br />
                  {"A brand of Lexta Ghana Limited"}
                  <br />
                  {"Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra, Ghana"}
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#d9cdea"} as CSSProperties}>
                  <a href="tel:+233302235296" style={{"color":"#fff"} as CSSProperties}>
                    {"+233 302 235 296"}
                  </a>
                  {" / "}
                  <a href="tel:+233302662970" style={{"color":"#fff"} as CSSProperties}>
                    {"+233 302 662 970"}
                  </a>
                  {" / "}
                  <a href="tel:+233501619588" style={{"color":"#fff"} as CSSProperties}>
                    {"+233 501 619 588"}
                  </a>
                  {" / "}
                  <a href="tel:+233544351010" style={{"color":"#fff"} as CSSProperties}>
                    {"+233 544 351 010"}
                  </a>
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#d9cdea"} as CSSProperties}>
                  {"WhatsApp Customer Care: "}
                  <a href="https://wa.me/233544351010" target="_blank" style={{"color":"#9EE6C8"} as CSSProperties}>
                    {"+233 544 351 010"}
                  </a>
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#d9cdea"} as CSSProperties}>
                  {"Consumer Reports: "}
                  <a href="tel:+233509967400" style={{"color":"#9EE6C8"} as CSSProperties}>
                    {"+233 50 996 7400"}
                  </a>
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#d9cdea"} as CSSProperties}>
                  {"Enquiries: "}
                  <a href="mailto:info@linzzyproducts.com" style={{"color":"#9EE6C8"} as CSSProperties}>
                    {"info@linzzyproducts.com"}
                  </a>
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#d9cdea"} as CSSProperties}>
                  {"Complaints & product reviews: "}
                  <a href="mailto:support@linzzyproducts.com" style={{"color":"#9EE6C8"} as CSSProperties}>
                    {"support@linzzyproducts.com"}
                  </a>
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#d9cdea"} as CSSProperties}>
                  {"Partnerships & sponsorships: "}
                  <a href="mailto:marketing@linzzyproducts.com" style={{"color":"#9EE6C8"} as CSSProperties}>
                    {"marketing@linzzyproducts.com"}
                  </a>
                </p>
                {"\n        "}
                <p style={{"margin":"0","color":"#b9a8d1","fontFamily":"ui-monospace,Menlo,monospace","fontSize":"12px"} as CSSProperties}>
                  {"[PLACEHOLDER: Linzzy consumer care hours]"}
                </p>
                {"\n      "}
              </div>
              {"\n    "}
            </aside>
            {"\n  "}
          </div>
        </section>
        {/* TRADE */}
        <section id="trade" data-chapter="Trade Enquiries" data-num="04" data-screen-label="05 Trade Enquiries" style={{"background":"#0B3D2E","color":"#fff","padding":"clamp(80px,10vw,140px) clamp(20px,5vw,80px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,400px),1fr))","gap":"48px clamp(40px,6vw,100px)","alignItems":"start"} as CSSProperties}>
            {"\n    "}
            <div className="lz-side" style={{"position":"sticky","top":"110px","display":"flex","flexDirection":"column","gap":"16px"} as CSSProperties}>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"13px","fontWeight":"700","letterSpacing":"0.2em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                {"Distributors and business enquiries"}
              </p>
              {"\n      "}
              <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,5.6vw,96px)","lineHeight":"0.9","letterSpacing":"-0.035em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
                {"Stock Linzzy in Your Shop or "}
                <em style={{"color":"#9EE6C8"} as CSSProperties}>
                  {"Region"}
                </em>
              </h2>
              {"\n      "}
              <p style={{"margin":"0","fontSize":"clamp(17px,1.4vw,20px)","lineHeight":"1.6","color":"#e6fbf2"} as CSSProperties}>
                {"Interested in distributing or stocking Linzzy products? Contact our team to discuss product availability, distribution opportunities and commercial enquiries."}
              </p>
              {"\n      "}
              <a href="mailto:info@linzzyproducts.com" style={{"alignSelf":"flex-start","color":"#fff","fontWeight":"700","borderBottom":"1.5px solid #fff","paddingBottom":"3px"} as CSSProperties}>
                {"info@linzzyproducts.com"}
              </a>
              {"\n    "}
            </div>
            {"\n    "}
            <div>
              {"\n      "}
              {vals.tradeSent ? (
                <>
                  {"\n        "}
                  <div style={{"padding":"32px","background":"#fff","color":"#0B3D2E"} as CSSProperties}>
                    {"\n          "}
                    <p style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontSize":"32px"} as CSSProperties}>
                      {"Thank you. Your trade enquiry is in."}
                    </p>
                    {"\n          "}
                    <p style={{"margin":"8px 0 0","fontSize":"16px"} as CSSProperties}>
                      {"Your enquiry goes to the Linzzy team."}
                    </p>
                    {vals.trade.state.message ? <p role="status" data-form-message="" tabIndex={-1} style={{ margin: "12px 0 0", fontSize: 16, fontWeight: 600 }}>{vals.trade.state.message}</p> : null}
                    {"\n        "}
                  </div>
                  {"\n      "}
                </>
              ) : null}
              {"\n      "}
              {vals.tradeOpen ? (
                <>
                  {"\n        "}
                  <form ref={vals.trade.ref} action={vals.trade.action} onSubmit={vals.trade.onSubmit} noValidate aria-label="Trade enquiry" style={{"display":"flex","flexDirection":"column","gap":"26px"} as CSSProperties}>
                    <Honeypot />
                    <input type="hidden" name="route" value={vals.route} />
                    {"\n          "}
                    <div>
                      {"\n            "}
                      <p style={{"margin":"0 0 12px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.12em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                        {"I am a"}
                      </p>
                      {"\n            "}
                      <div style={{"display":"flex","flexWrap":"wrap","gap":"2px"} as CSSProperties}>
                        {"\n              "}
                        {(vals.routes ?? []).map((c: any, i8: number) => (
                          <Fragment key={i8}>
                            {"\n                "}
                            <button type="button" aria-pressed={c.on} onClick={c.onClick} style={css(`cursor:pointer;padding:12px 16px;font-weight:600;font-size:14px;border:1px solid #fff;background:${c.bg};color:${c.fg}`)}>
                              {c.label}
                            </button>
                            {"\n              "}
                          </Fragment>
                        ))}
                        {"\n            "}
                      </div>
                      {"\n          "}
                    </div>
                    {"\n          "}
                    <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,200px),1fr))","gap":"20px 28px"} as CSSProperties}>
                      {"\n            "}
                      {(vals.tradeFields ?? []).map((f: any, i9: number) => (
                        <Fragment key={i9}>
                          {"\n              "}
                          <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                            {f.label}
                            {f.name === "region" ? (
                              <Select wrapperClassName="lz-sel lz-sel-dark" nativeOnTouch={false} name="region" defaultValue={vals.trade.v.region ?? ""} {...fieldAria(vals.trade.state, "region", "t-region-error")} style={{"height":"46px","padding":"0","border":"0","borderBottom":"1.5px solid rgba(255,255,255,0.6)","fontSize":"17px","background":"transparent","color":"#fff","outline":"none","letterSpacing":"0","textTransform":"none","fontWeight":"400"} as CSSProperties}>
                                <option value="" style={{"color":"#0B3D2E"} as CSSProperties}>{"Choose a region"}</option>
                                {(vals.regionOptsOnly ?? []).map((r: any) => <option key={r.v} value={r.v} style={{"color":"#0B3D2E"} as CSSProperties}>{r.l}</option>)}
                              </Select>
                            ) : (
                              <input name={f.name} type={f.type} autoComplete={f.auto} required={f.required} maxLength={f.max} defaultValue={vals.trade.v[f.name] ?? ""} {...fieldAria(vals.trade.state, f.name, `t-${f.name}-error`)} style={{"height":"46px","padding":"0","border":"0","borderBottom":"1.5px solid rgba(255,255,255,0.6)","fontSize":"17px","background":"transparent","color":"#fff","outline":"none","textTransform":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties} />
                            )}
                            <Err id={`t-${f.name}-error`} msg={vals.trade.state.fieldErrors?.[f.name]} color="#FFE3EE" />
                          </label>
                          {"\n            "}
                        </Fragment>
                      ))}
                      {"\n            "}
                      <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                        {"Expected monthly volume (optional)\n              "}
                        <Select wrapperClassName="lz-sel lz-sel-dark" nativeOnTouch={false} name="volume" defaultValue={vals.trade.v.volume ?? ""} style={{"height":"46px","padding":"0","border":"0","borderBottom":"1.5px solid rgba(255,255,255,0.6)","fontSize":"16px","background":"transparent","color":"#fff","outline":"none","letterSpacing":"0","textTransform":"none","fontWeight":"400"} as CSSProperties}>
                          <option value="" style={{"color":"#0B3D2E"} as CSSProperties}>
                            {"Choose a volume"}
                          </option>
                          <option style={{"color":"#0B3D2E"} as CSSProperties}>
                            {"[PLACEHOLDER: monthly volume bands, from Lexta's sales team]"}
                          </option>
                          <option style={{"color":"#0B3D2E"} as CSSProperties}>
                            {"Not sure yet"}
                          </option>
                        </Select>
                        {"\n            "}
                      </label>
                      {"\n          "}
                    </div>
                    {"\n          "}
                    <div style={{"display":"flex","flexWrap":"wrap","gap":"16px","fontSize":"14px","fontWeight":"600"} as CSSProperties}>
                      {"\n            "}
                      <span style={{"color":"#e6fbf2"} as CSSProperties}>
                        {"Ranges you are interested in (optional):"}
                      </span>
                      {"\n            "}
                      <label style={{"display":"flex","gap":"6px","alignItems":"center"} as CSSProperties}>
                        <input type="checkbox" name="ranges" value="feminine-care" style={{"accentColor":"#9EE6C8"} as CSSProperties} />
                        {"Feminine Care"}
                      </label>
                      {"\n            "}
                      <label style={{"display":"flex","gap":"6px","alignItems":"center"} as CSSProperties}>
                        <input type="checkbox" name="ranges" value="baby-care" style={{"accentColor":"#9EE6C8"} as CSSProperties} />
                        {"Baby Care"}
                      </label>
                      {"\n          "}
                    </div>
                    {"\n          "}
                    <label style={{"display":"flex","flexDirection":"column","gap":"6px","fontSize":"12px","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase","color":"#9EE6C8"} as CSSProperties}>
                      {"Anything else? (optional)"}
                      <textarea name="message" maxLength={3000} defaultValue={vals.trade.v.message ?? ""} placeholder="Storage capacity, delivery needs, products and quantities." style={{"minHeight":"110px","padding":"12px 0","border":"0","borderBottom":"1.5px solid rgba(255,255,255,0.6)","fontSize":"17px","background":"transparent","color":"#fff","resize":"vertical","outline":"none","textTransform":"none","letterSpacing":"0","fontWeight":"400"} as CSSProperties}>
                      </textarea>
                    </label>
                    <FormError state={vals.trade.state} dark />
                    {"\n          "}
                    <button type="submit" aria-disabled={vals.trade.pending || undefined} style={{"alignSelf":"flex-start","border":"0","cursor":"pointer","padding":"20px 32px","background":"#fff","color":"#0B3D2E","fontWeight":"700","fontSize":"14px","letterSpacing":"0.06em","textTransform":"uppercase"} as CSSProperties}>
                      {"Send Trade Enquiry →"}
                    </button>
                    {"\n        "}
                  </form>
                  {"\n      "}
                </>
              ) : null}
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </section>
        {/* BEFORE YOU WRITE */}
        <section id="before" data-chapter="Before You Write" data-num="05" data-screen-label="06 Before You Write" style={{"background":"#FFF1C9","padding":"clamp(70px,9vw,130px) clamp(20px,5vw,80px)"} as CSSProperties}>
          {"\n  "}
          <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(100%,400px),1fr))","gap":"32px clamp(40px,6vw,100px)","alignItems":"end"} as CSSProperties}>
            {"\n    "}
            <div>
              {"\n      "}
              <h2 data-reveal="1" style={{"margin":"0","fontFamily":"'DM Serif Display',serif","fontWeight":"400","fontSize":"clamp(44px,6vw,104px)","lineHeight":"0.9","letterSpacing":"-0.035em","opacity":"var(--r,0)","transform":"translateY(calc((1 - var(--r,0)) * 60px))"} as CSSProperties}>
                {"Before You "}
                <em style={{"color":"#C2185B"} as CSSProperties}>
                  {"Write"}
                </em>
              </h2>
              {"\n      "}
              <p style={{"margin":"18px 0 0","maxWidth":"560px","fontSize":"clamp(17px,1.4vw,20px)","lineHeight":"1.6","color":"#4a3b20"} as CSSProperties}>
                {"Many questions about our products, periods, baby care and where to buy Linzzy are answered in our FAQs."}
              </p>
              {"\n    "}
            </div>
            {"\n    "}
            <div style={{"display":"flex","flexDirection":"column","borderTop":"1px solid #23103a"} as CSSProperties}>
              {"\n      "}
              <a className="lzc7" href="/faqs" style={{"display":"flex","justifyContent":"space-between","padding":"20px 0","borderBottom":"1px solid #23103a","color":"#23103a","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(26px,2.6vw,38px)"} as CSSProperties}>
                {"Read the FAQs "}
                <span>
                  {"→"}
                </span>
              </a>
              {"\n      "}
              <a className="lzc8" href="/tips" style={{"display":"flex","justifyContent":"space-between","padding":"20px 0","borderBottom":"1px solid #23103a","color":"#23103a","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(26px,2.6vw,38px)"} as CSSProperties}>
                {"Tips & Advice "}
                <span>
                  {"→"}
                </span>
              </a>
              {"\n      "}
              <a className="lzc9" href="/products" style={{"display":"flex","justifyContent":"space-between","padding":"20px 0","borderBottom":"1px solid #23103a","color":"#23103a","fontFamily":"'DM Serif Display',serif","fontSize":"clamp(26px,2.6vw,38px)"} as CSSProperties}>
                {"All Products "}
                <span>
                  {"→"}
                </span>
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
