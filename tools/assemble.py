"""src/ 의 조각들을 합쳐 dist/index.html 을 만든다.

    python3 tools/assemble.py

- dist/index.html  : Claude 아티팩트로 올리는 페이지 (아티팩트가 <!doctype>·<head> 를 감싸 줌)
- dist/template.txt: template/template.pptx 를 base64 로 바꾼 것 (아티팩트는 .pptx 파일을 직접 못 올려서)
"""
import base64, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src, dist = ROOT / 'src', ROOT / 'dist'
dist.mkdir(exist_ok=True)

gen = (src / 'gen.js').read_text(encoding='utf-8')
songs = (src / 'sample-songs.json').read_text(encoding='utf-8').strip()
app = (src / 'app.js').read_text(encoding='utf-8').replace('__SONGS__', songs)
head = (src / 'app_head.html').read_text(encoding='utf-8')
body = (src / 'app_body.html').read_text(encoding='utf-8')

html = (head + body
        + '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>\n'
        + '<script>\n' + gen + '\n</script>\n<script>\n' + app + '\n</script>\n')

# 미리보기 칩 모양 (빌드 때 적용하던 보정)
html = html.replace("overflow:hidden;position:relative;text-align:center;display:flex;align-items:center;justify-content:center}",
                    "overflow:hidden;position:relative;text-align:center;white-space:pre-line}")
html = html.replace(".chip.title{background:var(--sky);color:#fff;font-family:var(--display);font-size:12px;border-color:transparent}",
                    ".chip.title{background:var(--sky);color:#fff;font-family:var(--display);font-size:12px;border-color:transparent;display:flex;align-items:center;justify-content:center}\n.chip.inter{display:flex;align-items:center;justify-content:center}")
html = html.replace(".chip .tag{position:absolute;top:2px;left:2px;", ".chip .tag{position:absolute;top:2px;left:2px;z-index:1;")
# 견본 PPT는 template.txt(base64)로 읽는다
old = "fetch('template.pptx').then((r) => { if (!r.ok) throw new Error('견본 파일을 불러오지 못했어요'); return r.arrayBuffer(); })"
new = ("fetch('template.txt').then((r) => { if (!r.ok) throw new Error('견본 파일을 불러오지 못했어요'); return r.text(); })"
       ".then((t) => { const bin = atob(t.trim()); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; })")
assert old in html
html = html.replace(old, new)

(dist / 'index.html').write_text(html, encoding='utf-8')
(dist / 'template.txt').write_text(base64.b64encode((ROOT / 'template' / 'template.pptx').read_bytes()).decode(), encoding='utf-8')
print('dist/index.html, dist/template.txt 만들었어요')
