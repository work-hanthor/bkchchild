"""Claude 페이지의 찬양 목록(문서 JSON 파일들)을 docs/songs.json 하나로 모은다.

    python3 tools/export_songs.py <찬양 문서 JSON 폴더>

GitHub Pages 주소는 이 파일을 읽어 Claude 페이지와 같은 찬양 목록을 보여준다.
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1])
songs = []
for f in sorted(src.glob('*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    d = d.get('data', d)
    song = {'id': f.stem}
    for k in ('title', 'color', 'lyrics', 'note', 'source', 'addedAt', 'updatedAt'):
        if d.get(k) not in (None, ''):
            song[k] = d[k]
    songs.append(song)
songs.sort(key=lambda s: s.get('title', ''))
out = ROOT / 'docs' / 'songs.json'
out.write_text(json.dumps(songs, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f'찬양 {len(songs)}곡을 {out.relative_to(ROOT)} 에 저장했어요')
