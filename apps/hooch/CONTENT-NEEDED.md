# Hooch site: content still needed from Lexta

Everything on the site comes from Lexta's "Hooch Foods website content.docx" (Google Drive, Hooch Tab Content;
`docs/content/hooch/`). Desmond's instruction (14 November 2026): use the Drive content, and where something is missing
show a clearly marked `[PLACEHOLDER: ...]`. Each item below appears on the site as a placeholder or is a decision to
confirm.

## Products
1. **Pack sizes and range.** The Drive document gives Hooch® Cornflakes 500g (10 x 50g) and Hooch® Frosted Flakes 375g
   (10 x 37.5g), and the site shows exactly these two. Lexta's PDF also mentions a 375g Cornflakes, and the Lexta website
   prototype shows a Choco Flakes card that no Lexta document mentions. Choco Flakes is not on the Hooch site; migration
   0017 unpublishes it (and the prototype "Super Crunchy Corn Flakes") when Desmond applies it.
2. **Real product codes** (shown as `TBC-HOOCH-101` and `TBC-HOOCH-102` with a placeholder).
3. **Approved nutrition panel and allergen notice** (Lexta: "will be worked on and shared separately"). The site shows
   Lexta's ingredient lines and "Contains barley (malt extract)".
4. **Frosted Flakes sugar figure**: the document says "sugar 23" with no unit.
5. **Product videos**: the hero and both product pages play short stand-in films we made from Lexta's own Hooch artwork
   (the pack shots and the bowl photo, with real flakes and strawberries falling). Lexta's real product films replace
   them: put the files in `public/videos` and change the paths in `content/videos.ts` (one file).
6. **Photos and pack artwork**: Desmond (14 November 2026) asked for a realistic look "with the actual hooch product or
   similar", to be replaced when Lexta sends their images. Everything comes from Lexta's own Hooch media on the original
   Lexta site, downloaded into this repo (never hotlinked): the two-box banner, the Frosted Flakes box front, the bowl
   photo and the family breakfast picture. Notes:
   - The 3D boxes and pack shots are straightened from the banner (about 330 x 590 px per box front), so they are a
     little soft up close. Lexta's print files (box dielines, front, side, top) would make them sharp.
   - The banner's boxes carry a "Low Fat" badge, which is in no Lexta document: it is covered on our copies by a "10
     packs" roundel (Drive fact). The banner also prints 500g on Frosted Flakes, while the Drive says 375g: our copy has
     no weight on the Frosted Flakes front. Lexta to confirm the real pack.
   - The banner's claim text ("Full of energy", "Kids love it", "Low fat") is never shown.
   - The family breakfast picture shows the Hooch mascot (item 8).
   - Recipe photos still needed for **Hooch® Yoghurt Crunch** and **The Hooch® After-School Crunch** (marked placeholders
     on their photos); the other two recipes use close matches (the bowl photo; flakes with strawberries).

## Brand
7. **Logo**: only a 151 x 69 PNG exists (from the original Lexta site). A vector or larger logo would look sharper.
8. **"Meet hochiro, coming soon"**: a seventh menu item in Lexta's document. Brand sites are capped at six pages, so it is
   not built. The mascot appears on the Hooch boxes and in Lexta's family breakfast picture (used on About and one recipe); it is
   not used on its own until Lexta approves it.
9. **Social links**: Lexta names no Hooch Facebook, Instagram or TikTok accounts (placeholders in the footer and on
   Contact). Only the Lexta WhatsApp channel links out.

## Contact
10. **Email addresses**: the Drive document gives info@, marketing@ and support@hoochfoods.com; Lexta's PDF routes Hooch
    to @linzzyproducts.com addresses. The site uses the hoochfoods.com ones; hoochfoods.com does not serve a working site
    yet, so these mailboxes need confirming.
11. The document's line "Contact Yazz Products for all inquiries" is a copy slip from the Yazz document and is not shown.
12. **Consumer care hours** (placeholder).

## Articles
13. **Full text of the four Nutrition & Family Tips articles**: Lexta supplied only the summaries.

## Out of scope (noted, not built)
- "Share Your Hooch® Recipe" with uploads and admin approval for publishing: a moderated publishing flow is a new
  feature. The button sends the idea to the Hooch team through the contact form (a CRM lead).
- Phase 2: games and library (Ludu, Oware), stories, comics, merchandise, online checkout.
