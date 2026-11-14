# Hooch: content saved from the original hoochfoods.com

> Read only check on 13 November 2026 (curl, polite rate; no forms, no logins).

## Result: no content could be extracted

| Request | Result |
| --- | --- |
| https://hoochfoods.com/ (and http://) | The bare domain does not resolve (no public DNS record; the egress proxy reported "connect unreachable"). |
| https://www.hoochfoods.com/ | Responds 200, but returns the raw source of WordPress's `index.php` (405 bytes, content type `application/x-httpd-lsphp`) instead of a web page. PHP is not running on the host, so no page text, products, FAQs, contacts, posts or images are served. |
| https://www.hoochfoods.com/wp-json/wp/v2/pages | Same raw `index.php` source; the REST API is not reachable. |

No further paths were requested. **Flag for Desmond:** the live hoochfoods.com is broken (bare domain has no DNS; www serves PHP source code instead of running it). Serving PHP source is also a security risk if other PHP files (for example `wp-config.php`) are reachable the same way; this was not tested. Lexta's host should be told; this session contacts no one.

## What exists elsewhere

- Lexta's Drive copy for Hooch is in `../website-copy.md`, `../products.md`, `../recipes.md` and `../articles/`. It wins over any original site text.
- Hooch content on the original Lexta site (lextagh.com), for reference:
  - https://lextagh.com/brands/: "Hooch, Fueled By Integrity. Pure grains and scientific nourishment curated for health-conscious families, professionals, and fitness enthusiasts who demand sustained, clean morning vigor." Products: "Super Crunchy Corn Flakes" and "Frosted Flakes". These lines carry the "low-fat" and "sugar crash" claims that the Lexta site removed as unverified (see `../../LEXTA-CONTENT-CHANGES.md`). No Choco Flakes is listed (gaps file C6).
  - lextagh.com has empty "Recipes" and "Health and nutrition" pages.
  - lextagh.com media library: `hooch-logo.png` (151 x 69), `hooch-mascot.png` (1024 x 1536), `hoochbanner1.png` (1774 x 887), `hooch-banner3-1024x576-1.png`, `Hooch-Frosted-Flakes1-2.jpg` (570 x 671), `cornflakes-aerial.png` (1254 x 1254). URLs are in [IMAGES.md](IMAGES.md).
