"""원본 PPT에서 견본 슬라이드만 남긴 template.pptx 를 만든다."""
import zipfile, re, sys, posixpath

SRC, DST = sys.argv[1], sys.argv[2]
KEEP = [int(x) for x in sys.argv[3].split(",")] if len(sys.argv) > 3 else [1,2,3,4,5,6,7,9,10,13,17,20,21,25,30,79,80,82,83,84,86,88,103,104,110,111,113,114,115,117,118,119]

zin = zipfile.ZipFile(SRC)
files = {n: zin.read(n) for n in zin.namelist()}

def rels_path(part):
    d, b = posixpath.split(part)
    return f"{d}/_rels/{b}.rels"

# 1) remove unwanted slides + their notes
pres_rels = files['ppt/_rels/presentation.xml.rels'].decode()
pres = files['ppt/presentation.xml'].decode()
ct = files['[Content_Types].xml'].decode()
for m in re.finditer(r'<Relationship Id="(rId\d+)" Type="[^"]*/slide" Target="slides/slide(\d+)\.xml"/>', pres_rels):
    rid, num = m.group(1), int(m.group(2))
    if num in KEEP: continue
    pres_rels = pres_rels.replace(m.group(0), '')
    pres = re.sub(r'<p:sldId id="\d+" r:id="%s"/>' % rid, '', pres)
    part = f'ppt/slides/slide{num}.xml'
    rp = rels_path(part)
    if rp in files:
        for nm in re.findall(r'Target="\.\./notesSlides/(notesSlide\d+\.xml)"', files[rp].decode()):
            np_ = f'ppt/notesSlides/{nm}'
            files.pop(np_, None); files.pop(rels_path(np_), None)
            ct = ct.replace(f'<Override PartName="/{np_}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>', '')
        files.pop(rp)
    files.pop(part)
    ct = ct.replace(f'<Override PartName="/{part}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>', '')
# drop notes from kept slides (not needed)
for num in KEEP:
    rp = f'ppt/slides/_rels/slide{num}.xml.rels'
    s = files[rp].decode()
    for m in re.finditer(r'<Relationship Id="rId\d+" Type="[^"]*/notesSlide" Target="\.\./notesSlides/(notesSlide\d+\.xml)"/>', s):
        np_ = f'ppt/notesSlides/{m.group(1)}'
        files.pop(np_, None); files.pop(rels_path(np_), None)
        ct = ct.replace(f'<Override PartName="/{np_}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>', '')
        s = s.replace(m.group(0), '')
    files[rp] = s.encode()
files['ppt/_rels/presentation.xml.rels'] = pres_rels.encode()
files['ppt/presentation.xml'] = pres.encode()
files['[Content_Types].xml'] = ct.encode()
files.pop('docProps/thumbnail.jpeg', None)
files['_rels/.rels'] = re.sub(r'<Relationship [^>]*thumbnail[^>]*/>', '', files['_rels/.rels'].decode()).encode()

# 2) drop unreferenced media
referenced = set()
for n, b in files.items():
    if n.endswith('.rels'):
        base = posixpath.dirname(posixpath.dirname(n))
        for t in re.findall(r'Target="([^"]+)"', b.decode()):
            referenced.add(posixpath.normpath(posixpath.join(base, t)))
for n in list(files):
    if n.startswith('ppt/media/') and n not in referenced:
        files.pop(n)

with zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED) as z:
    order = ['[Content_Types].xml'] + [n for n in files if n != '[Content_Types].xml']
    for n in order:
        z.writestr(n, files[n])
print('kept media:', sorted(n for n in files if n.startswith('ppt/media/')))
