# -*- coding: utf-8 -*-
"""Generate test fixtures: a Chinese DOCX (hand-built OOXML zip) and a minimal text-layer PDF."""
import zipfile, os

OUT = os.path.join(os.path.dirname(__file__), 'fixtures')
os.makedirs(OUT, exist_ok=True)

# ---------- DOCX ----------
doc_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>基于深度学习的结构健康监测研究</w:t></w:r></w:p>
<w:p><w:r><w:t>本文提出一种面向桥梁结构的神经网络监测方法，用于识别混凝土裂缝的演化规律。</w:t></w:r></w:p>
<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>实验数据</w:t></w:r></w:p>
<w:tbl>
<w:tr><w:tc><w:p><w:r><w:t>工况</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>精度</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>召回率</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>92.5%</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>88.1%</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>95.3%</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>91.7%</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>
<w:p><w:r><w:t>结论：所提方法在两类工况下均优于基线模型。</w:t></w:r></w:p>
<w:sectPr/>
</w:body>
</w:document>'''

styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:outlineLvl w:val="1"/></w:pPr></w:style>
</w:styles>'''

content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>'''

rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

docx_path = os.path.join(OUT, '中文论文样本.docx')
with zipfile.ZipFile(docx_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/document.xml', doc_xml)
    z.writestr('word/styles.xml', styles_xml)
print('DOCX OK:', docx_path)

# ---------- PDF (minimal text-layer, Chinese via CIDFont is complex; use English+ASCII here) ----------
text = "Structural Health Monitoring with Neural Networks\n\nChapter 1 Introduction\nDeep learning models identify crack evolution in bridge structures.\n"
lines = text.split('\n')
stream_ops = ["BT", "/F1 12 Tf", "72 720 Td", "16 TL"]
for ln in lines:
    esc = ln.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')
    stream_ops.append("(%s) Tj T*" % esc)
stream_ops.append("ET")
stream = '\n'.join(stream_ops).encode('latin-1', 'replace')

objs = []
objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
objs.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>")
objs.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")
objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

pdf_path = os.path.join(OUT, 'sample-text.pdf')
with open(pdf_path, 'wb') as f:
    f.write(b"%PDF-1.4\n")
    offsets = []
    for i, o in enumerate(objs, start=1):
        offsets.append(f.tell())
        f.write(str(i).encode() + b" 0 obj\n" + o + b"\nendobj\n")
    xref_pos = f.tell()
    f.write(b"xref\n0 " + str(len(objs)+1).encode() + b"\n")
    f.write(b"0000000000 65535 f \n")
    for off in offsets:
        f.write(("%010d 00000 n \n" % off).encode())
    f.write(b"trailer\n<< /Size " + str(len(objs)+1).encode() + b" /Root 1 0 R >>\nstartxref\n" + str(xref_pos).encode() + b"\n%%EOF")
print('PDF OK:', pdf_path)
