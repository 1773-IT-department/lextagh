"""Builds docs/go-live/Lexta-Go-Live-Plan.docx (marked DRAFT) from docs/go-live/go-live-plan.md.

Run from anywhere: python3 docs/go-live/build/make_docx.py
Reuses the styles and helpers of the staff user guide builder (docs/user-guide/build/make_docx.py) and adds
fenced code blocks, checkbox items and a DRAFT header.
"""
import importlib.util
import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, RGBColor

HERE = Path(__file__).resolve().parent
PLAN = HERE.parent
SRC = PLAN / "go-live-plan.md"
OUT = PLAN / "Lexta-Go-Live-Plan.docx"

spec = importlib.util.spec_from_file_location("guide_docx", PLAN.parent / "user-guide" / "build" / "make_docx.py")
guide = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guide)

RED = RGBColor(0xB0, 0x1E, 0x1E)


def draft_header(doc):
    p = doc.sections[0].header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = p.add_run("DRAFT for review, not agreed")
    r.bold, r.font.size, r.font.color.rgb = True, Pt(9), RED


def title_block(doc, lines):
    p = doc.add_paragraph()
    r = p.add_run("DRAFT")
    r.bold, r.font.size, r.font.color.rgb = True, Pt(14), RED
    p = doc.add_paragraph()
    r = p.add_run("Lexta go-live plan")
    r.bold, r.font.size, r.font.color.rgb = True, Pt(26), guide.NAVY
    p = doc.add_paragraph()
    r = p.add_run("Website and Business System portal")
    r.font.size, r.font.color.rgb = Pt(16), guide.TEAL
    for l in lines:
        guide.add_inline(doc.add_paragraph(), l)


def add_table(doc, rows):
    """Like the guide's tables, but smaller text and column widths that follow the content."""
    cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
    header, body = cells[0], cells[2:]
    lengths = [max(len(r[j]) for r in [header] + body) for j in range(len(header))]
    total = sum(lengths)
    usable = 21.0 - 2 * 1.8
    widths = [max(0.12, n / total) for n in lengths]
    widths = [guide.Cm(usable * w / sum(widths)) for w in widths]
    t = doc.add_table(rows=1 + len(body), cols=len(header))
    t.style = "Table Grid"
    t.autofit = False
    for i, row in enumerate([header] + body):
        for j, val in enumerate(row):
            cell = t.rows[i].cells[j]
            cell.width = widths[j]
            par = cell.paragraphs[0]
            par.paragraph_format.space_after = Pt(0)
            guide.add_inline(par, val, bold=(i == 0))
            for r in par.runs:
                r.font.size = Pt(8.5)
            if i == 0:
                guide.shade(cell, "E3EEF2")
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def tighten(doc):
    sec = doc.sections[0]
    sec.left_margin = sec.right_margin = guide.Cm(1.8)
    sec.top_margin = sec.bottom_margin = guide.Cm(1.6)
    doc.styles["Normal"].font.size = Pt(10)
    doc.styles["Normal"].paragraph_format.space_after = Pt(4)


def add_code(doc, code_lines):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = guide.Cm(0.6)
    r = p.add_run("\n".join(code_lines))
    r.font.name = "Consolas"
    r.font.size = Pt(9)


def build():
    lines = SRC.read_text(encoding="utf-8").splitlines()
    doc = Document()
    guide.setup(doc)
    tighten(doc)
    draft_header(doc)
    start = next(i for i, l in enumerate(lines) if l.startswith("## "))
    title_block(doc, [l for l in lines[1:start] if l.strip()])
    body = lines[start:]
    i = 0
    while i < len(body):
        s = body[i].strip()
        if not s or s == "---":
            i += 1
            continue
        if s.startswith("```"):
            code = []
            i += 1
            while i < len(body) and not body[i].strip().startswith("```"):
                code.append(body[i])
                i += 1
            add_code(doc, code)
        elif s.startswith("## "):
            doc.add_paragraph(s[3:], style="Heading 1")
        elif s.startswith("### "):
            doc.add_paragraph(s[4:], style="Heading 2")
        elif s.startswith("|"):
            rows = []
            while i < len(body) and body[i].strip().startswith("|"):
                rows.append(body[i])
                i += 1
            add_table(doc, rows)
            continue
        elif re.match(r"^\d+\. ", s):
            guide.add_inline(doc.add_paragraph(style="List Number"), re.sub(r"^\d+\. ", "", s))
        elif s.startswith("* [ ] "):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = guide.Cm(0.6)
            p.paragraph_format.first_line_indent = guide.Cm(-0.6)
            p.add_run("☐  ")
            guide.add_inline(p, s[6:])
        elif s.startswith("* "):
            guide.add_inline(doc.add_paragraph(style="List Bullet"), s[2:])
        else:
            guide.add_inline(doc.add_paragraph(), s)
        i += 1
    guide.restart_numbering(doc)
    doc.core_properties.title = "Lexta go-live plan (DRAFT)"
    doc.core_properties.author = "1773 Human Resources & Marketing Services LTD"
    doc.save(OUT)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
