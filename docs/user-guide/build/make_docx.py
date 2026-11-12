"""Builds docs/user-guide/Lexta-Business-System-User-Guide.docx from docs/user-guide/README.md.

Run from anywhere: python3 docs/user-guide/build/make_docx.py
Handles the small Markdown subset the guide uses: headings, paragraphs, numbered and bulleted lists, tables,
images, horizontal rules, **bold**, `code` and [links](...) (shown as their text).
"""
import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

HERE = Path(__file__).resolve().parent
GUIDE = HERE.parent
SRC = GUIDE / "README.md"
OUT = GUIDE / "Lexta-Business-System-User-Guide.docx"

NAVY = RGBColor(0x0B, 0x2F, 0x3D)
TEAL = RGBColor(0x12, 0x8F, 0xB0)
GREY = RGBColor(0x5A, 0x6B, 0x75)
IMAGE_WIDTH = Cm(15.5)
PHONE_WIDTH = Cm(7.5)


def setup(doc):
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
    for side in ("left_margin", "right_margin"):
        setattr(sec, side, Cm(2.2))
    sec.top_margin = sec.bottom_margin = Cm(2.0)
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10.5)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    normal.paragraph_format.space_after = Pt(5)
    for name, size in (("Title", 28), ("Heading 1", 18), ("Heading 2", 14), ("Heading 3", 12)):
        st = doc.styles[name]
        st.font.name = "Calibri"
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = NAVY if name != "Heading 3" else TEAL
        rpr = st.element.get_or_add_rPr()
        rpr.get_or_add_rFonts().set(qn("w:ascii"), "Calibri")
        rpr.get_or_add_rFonts().set(qn("w:hAnsi"), "Calibri")
    doc.styles["Heading 1"].paragraph_format.space_before = Pt(6)
    doc.styles["Heading 2"].paragraph_format.space_before = Pt(12)
    doc.styles["Heading 3"].paragraph_format.space_before = Pt(8)
    # Page numbers in the footer.
    p = sec.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    for kind, text in (("begin", None), (None, "PAGE"), ("end", None)):
        if kind:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), kind)
        else:
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = text
        run._r.append(el)
    run.font.size = Pt(9)
    run.font.color.rgb = GREY


INLINE = re.compile(r"(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))")


def add_inline(par, text, bold=False):
    for part in INLINE.split(text):
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            add_inline(par, part[2:-2], bold=True)
        elif part.startswith("`") and part.endswith("`"):
            r = par.add_run(part[1:-1])
            r.font.name = "Consolas"
            r.font.size = Pt(9.5)
            r.bold = bold
        elif re.fullmatch(r"\[([^\]]+)\]\(([^)]+)\)", part):
            m = re.fullmatch(r"\[([^\]]+)\]\(([^)]+)\)", part)
            r = par.add_run(m.group(1))
            r.bold = bold
            r.font.color.rgb = TEAL
        else:
            r = par.add_run(part)
            r.bold = bold
            if "[PLACEHOLDER" in part:
                r.font.color.rgb = RGBColor(0x9A, 0x5B, 0x00)


def shade(cell, hex_fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tc_pr.append(shd)


def add_table(doc, rows):
    cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
    header, body = cells[0], [r for r in cells[2:]]
    t = doc.add_table(rows=1 + len(body), cols=len(header))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate([header] + body):
        for j, val in enumerate(row):
            cell = t.rows[i].cells[j]
            par = cell.paragraphs[0]
            par.paragraph_format.space_after = Pt(0)
            add_inline(par, val, bold=(i == 0))
            for r in par.runs:
                r.font.size = Pt(9)
            if i == 0:
                shade(cell, "E3EEF2")
    doc.add_paragraph()


def add_image(doc, alt, src):
    path = GUIDE / src
    width = PHONE_WIDTH if any(k in src for k in ("-phone", "/3", "field-")) and "all-visits" not in src else IMAGE_WIDTH
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.keep_with_next = True
    par.add_run().add_picture(str(path), width=width)
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run(alt)
    r.italic = True
    r.font.size = Pt(9)
    r.font.color.rgb = GREY


def title_page(doc):
    for _ in range(6):
        doc.add_paragraph()
    p = doc.add_paragraph()
    r = p.add_run("Lexta Business System")
    r.bold, r.font.size, r.font.color.rgb = True, Pt(32), NAVY
    p = doc.add_paragraph()
    r = p.add_run("Staff User Guide")
    r.font.size, r.font.color.rgb = Pt(22), TEAL
    doc.add_paragraph()
    p = doc.add_paragraph()
    r = p.add_run("Draft for review")
    r.bold, r.font.size = True, Pt(13)
    p = doc.add_paragraph()
    p.add_run("12 November 2026").font.size = Pt(12)
    for _ in range(10):
        doc.add_paragraph()
    p = doc.add_paragraph()
    r = p.add_run("Prepared for Lexta Ghana Limited by\n1773 Human Resources & Marketing Services LTD")
    r.font.size, r.font.color.rgb = Pt(11), GREY
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def contents(doc, lines):
    doc.add_paragraph("Contents", style="Heading 1")
    for line in lines:
        m = re.match(r"^(#{2,3}) (.+)$", line)
        if not m:
            continue
        level = len(m.group(1))
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0 if level == 2 else 0.8)
        p.paragraph_format.space_after = Pt(1 if level == 3 else 3)
        r = p.add_run(m.group(2))
        r.bold = level == 2
        r.font.size = Pt(10.5 if level == 2 else 9.5)
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def build():
    lines = SRC.read_text(encoding="utf-8").splitlines()
    doc = Document()
    setup(doc)
    title_page(doc)
    # Skip the Markdown title, the draft line and the in page contents list (the Word file has its own).
    start = next(i for i, l in enumerate(lines) if l.startswith("## 1. "))
    intro = [l for l in lines[1:next(i for i, l in enumerate(lines) if l.startswith("## Contents"))] if l.strip() and not l.startswith("**Draft")]
    contents(doc, lines[start:])
    for l in intro:
        add_inline(doc.add_paragraph(), l)
    body = lines[start:]
    i, first_chapter = 0, True
    while i < len(body):
        line = body[i]
        s = line.strip()
        if not s or s == "---":
            i += 1
            continue
        if s.startswith("## "):
            if not first_chapter:
                doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
            first_chapter = False
            doc.add_paragraph(s[3:], style="Heading 1")
        elif s.startswith("### "):
            doc.add_paragraph(s[4:], style="Heading 2")
        elif s.startswith("#### "):
            doc.add_paragraph(s[5:], style="Heading 3")
        elif s.startswith("!["):
            m = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", s)
            add_image(doc, m.group(1), m.group(2))
        elif s.startswith("|"):
            rows = []
            while i < len(body) and body[i].strip().startswith("|"):
                rows.append(body[i])
                i += 1
            add_table(doc, rows)
            continue
        elif re.match(r"^\d+\. ", s):
            add_inline(doc.add_paragraph(style="List Number"), re.sub(r"^\d+\. ", "", s))
        elif s.startswith("* "):
            add_inline(doc.add_paragraph(style="List Bullet"), s[2:])
        else:
            add_inline(doc.add_paragraph(), s)
        i += 1
    restart_numbering(doc)
    doc.core_properties.title = "Lexta Business System, Staff User Guide"
    doc.core_properties.author = "1773 Human Resources & Marketing Services LTD"
    doc.save(OUT)
    print(f"wrote {OUT}")


def restart_numbering(doc):
    """Each numbered list starts again at 1 (python-docx shares one numbering across the whole document)."""
    numbering = doc.part.numbering_part.numbering_definitions._numbering
    style_num = doc.styles["List Number"].element.pPr.numPr.numId.val
    abstract = None
    for num in numbering.findall(qn("w:num")):
        if int(num.get(qn("w:numId"))) == style_num:
            abstract = num.find(qn("w:abstractNumId")).get(qn("w:val"))
    prev_numbered = False
    next_id = max(int(n.get(qn("w:numId"))) for n in numbering.findall(qn("w:num"))) + 1
    for p in doc.paragraphs:
        numbered = p.style.name == "List Number"
        if numbered and not prev_numbered:
            num = OxmlElement("w:num")
            num.set(qn("w:numId"), str(next_id))
            an = OxmlElement("w:abstractNumId")
            an.set(qn("w:val"), abstract)
            num.append(an)
            ov = OxmlElement("w:lvlOverride")
            ov.set(qn("w:ilvl"), "0")
            so = OxmlElement("w:startOverride")
            so.set(qn("w:val"), "1")
            ov.append(so)
            num.append(ov)
            numbering.append(num)
            current = next_id
            next_id += 1
        if numbered:
            ppr = p._p.get_or_add_pPr()
            numpr = ppr.get_or_add_numPr()
            numpr.get_or_add_ilvl().val = 0
            numpr.get_or_add_numId().val = current
        prev_numbered = numbered


if __name__ == "__main__":
    build()
