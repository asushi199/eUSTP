"""MJKD — PNG halaman (eksport PowerPoint) -> JPG 1920x1080; halaman serupa berkongsi satu fail.

Guna: python -I -X utf8 scripts/mjkd-slaid-utama-jpg.py <folder-png> <folder-jpg>
Tulis peta.json (halaman -> fail) di folder induk <folder-jpg> untuk HALAMAN_UTAMA.
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image
src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
peta, lihat = {}, {}
for f in sorted(src.glob("*.png")):
    n = int(f.stem)
    img = Image.open(f).convert("RGB")
    h = hashlib.md5(img.tobytes()).hexdigest()
    if h in lihat:
        peta[n] = lihat[h]
        continue
    nama = f"{n:03d}.jpg"
    img.save(out / nama, quality=82, optimize=True, progressive=True)
    lihat[h] = nama
    peta[n] = nama
(out.parent / "peta.json").write_text(json.dumps(peta, indent=0))
dup = {n: g for n, g in peta.items() if g != f"{n:03d}.jpg"}
print("fail unik:", len(lihat), "pendua:", dup)
print("jumlah MB:", round(sum(p.stat().st_size for p in out.glob("*.jpg")) / 1e6, 1))
