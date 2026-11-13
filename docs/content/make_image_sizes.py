from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT

d = Document()
st = d.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(10.5)
h = d.add_heading("Lexta website: banner and image sizes", 0)
d.add_paragraph("Prepared by 1773 Human Resources & Marketing Services for Lexta Ghana Limited, 13 November 2026.")
d.add_paragraph(
    "These sizes are measured from the new Lexta website. They are twice the size shown on screen, "
    "so images stay sharp on phones and modern laptops. Larger is fine: send the original photos "
    "and we will crop, compress and optimise them. Please do not put any words or logos inside photos "
    "or banners, because the headlines are added by the website on top of the image.")

def table(title, note, rows):
    d.add_heading(title, 1)
    if note: d.add_paragraph(note)
    t = d.add_table(rows=1, cols=4); t.style = "Light Grid Accent 1"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c, txt in zip(t.rows[0].cells, ["Where it appears", "Desktop size (px)", "Phone size (px)", "Notes"]):
        c.text = txt
        for r in c.paragraphs[0].runs: r.bold = True
    for row in rows:
        cells = t.add_row().cells
        for c, txt in zip(cells, row): c.text = txt

table("1. Banners (full width)",
      "Banners are cropped to fit the screen, so keep the main subject in the middle of the picture. "
      "Where a phone size is given, please send a separate upright version for phones; otherwise one image serves both.",
      [
       ["Home page slider (up to 7 slides)", "2880 x 1320", "1080 x 1830 (upright)", "The headline sits on top of the image, so keep one side calm and uncluttered."],
       ["About Us, top banner", "2880 x 1440", "1080 x 1440", "Landscape, 2:1."],
       ["Our Brands, top banner", "2880 x 1920", "1080 x 1440", "Landscape, 3:2. A family or all three brands together works best."],
       ["People & Culture, top banner", "2880 x 1620", "1080 x 1440", "Landscape, 16:9. Staff at work."],
       ["CSR, top banner", "2880 x 1080", "1080 x 1730 (upright)", "Wide, 8:3. Outreach or campaign photo."],
       ["Careers, top banner", "2880 x 1270", "1080 x 1440", "Wide. Team or factory floor."],
       ["Full width photo strips inside pages (About Us, People & Culture)", "2880 x 1620", "1080 x 1440", "Landscape, 16:9. About 3 photos."],
      ])

table("2. Page photos", "Photos inside the pages, next to text.", [
       ["Contact Us, top photo", "1200 x 800", "same", "3:2. Office, reception or customer care team."],
       ["News, featured story", "1240 x 830", "same", "3:2."],
       ["News and CSR stories (one per story)", "1200 x 800", "same", "3:2. Used on the home page, News and CSR cards. Subject in the centre."],
       ["About Us and People & Culture, story photos", "1600 x 1200 landscape, or 1200 x 1500 upright", "same", "About 10 to 15 photos: factory, production line, quality checks, warehouse, team, history. Mix of landscape and upright."],
       ["Lexta Videos section, cover image", "1920 x 1080", "same", "16:9, one per video, plus the video files or YouTube links."],
      ])

table("3. People and logos", None, [
       ["Leadership and management portraits", "1000 x 1000", "same", "Square, head and shoulders, plain or office background, same style for everyone."],
       ["Partner logos (CSR page)", "600 x 600", "same", "PNG with a transparent background. Wide logos can be 800 x 400."],
       ["Lexta logo", "Vector (SVG, AI or PDF)", "same", "Colour version and an all white version."],
       ["Yazz, Linzzy and Hooch logos", "Vector (SVG, AI or PDF)", "same", "Colour and all white versions of each."],
      ])

table("4. Products", "Products appear on the Lexta Our Brands page and on the Yazz, Linzzy and Hooch websites.", [
       ["Product pack shots (one per product, per variant)", "1200 x 1200", "same", "PNG with a transparent background, or a pure white background. Front of pack, straight on, no shadows or props."],
       ["Brand range photo (per brand)", "2000 x 2000", "same", "Square. The full range together."],
       ["Lifestyle photos (per brand)", "2400 x 1600", "same", "3:2. Products in use, people in a home setting."],
      ])

d.add_heading("How to send", 1)
for line in [
    "File types: JPG for photos, PNG for logos and pack shots, SVG, AI or PDF for logos if you have them.",
    "Please send the original, uncompressed files (not photos sent through WhatsApp, which lowers the quality).",
    "Name files by what they show, for example 'home-slider-factory.jpg' or 'yazz-herbal-toothpaste-100g.png'.",
    "A shared Google Drive folder or WeTransfer link works best for large files.",
    "Please confirm you have permission to use every photo, and that the people in them agree to appear on the website.",
]:
    d.add_paragraph(line, style="List Bullet")
d.save("Lexta-Website-Image-Sizes.docx")
