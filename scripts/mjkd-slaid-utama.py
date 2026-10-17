"""MJKD 2026 — komposit setiap slaid PPTX (eksport Canva) kepada JPG 1920x1080 + dump teks (JSON).

Guna bila slaid utama Canva berubah: (1) ekstrak PPTX ke folder (tanpa perlu video),
(2) python -I scripts/mjkd-slaid-utama.py <folder-ekstrak> <folder-keluar>,
(3) salin JPG yang berubah ke public/mjkd/slaid-utama/ dan kemas kini HALAMAN_UTAMA dalam
lib/mjkd/slaid-utama.ts (teks agenda = teks.json; halaman agenda guna latar-agenda.jpg).
Video lagu: ffmpeg -i <media.mp4> -vf fps=30 -c:v libx264 -preset slow -crf 26 -maxrate 2200k
-bufsize 4400k -c:a aac -b:a 160k -movflags +faststart public/mjkd/slaid-utama/lagu.mp4
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
W_EMU, H_EMU = 18288000, 10287000
W, H = 1920, 1080
K = W / W_EMU

EL = re.compile(r"<p:(sp|pic)>(.*?)</p:\1>", re.S)


def rels(n):
    x = (SRC / f"ppt/slides/_rels/slide{n}.xml.rels").read_text(encoding="utf8")
    return {m[0]: m[1] for m in re.findall(r'Id="(\w+)" Target="\.\./media/([^"]+)"', x)}


def num(s, k, d=0):
    m = re.search(rf'\b{k}="(-?\d+)"', s)
    return int(m.group(1)) if m else d


def main():
    pres = (SRC / "ppt/presentation.xml").read_text(encoding="utf8")
    n_slaid = len(re.findall(r"<p:sldId ", pres))
    teks_semua = {}
    for n in range(1, n_slaid + 1):
        xml = (SRC / f"ppt/slides/slide{n}.xml").read_text(encoding="utf8")
        r = rels(n)
        kanvas = Image.new("RGB", (W, H), "white")
        teks = []
        for jenis, body in EL.findall(xml):
            xf = re.search(r"<a:xfrm([^>]*)>\s*<a:off ([^/]*)/>\s*<a:ext ([^/]*)/>", body)
            if not xf:
                continue
            attr, off, ext = xf.groups()
            if num(attr, "rot"):
                print(f"slaid {n}: AMARAN rot={num(attr, 'rot')}", file=sys.stderr)
            x, y = num(off, "x"), num(off, "y")
            cx, cy = num(ext, "cx"), num(ext, "cy")
            emb = re.search(r'<a:blip r:embed="(\w+)"', body)
            if emb and "videoFile" not in body:
                img = Image.open(SRC / "ppt/media" / r[emb.group(1)]).convert("RGBA")
                src = re.search(r"<a:srcRect([^/]*)/>", body)
                if src:
                    sl, st, sr, sb = (num(src.group(1), k) for k in "ltrb")
                    iw, ih = img.size
                    img = img.crop((iw * sl / 1e5, ih * st / 1e5, iw * (1 - sr / 1e5), ih * (1 - sb / 1e5)))
                fr = re.search(r"<a:fillRect([^/]*)/>", body)
                fl, ft, frr, fb = (num(fr.group(1), k) for k in "ltrb") if fr else (0, 0, 0, 0)
                ix = x + cx * fl / 1e5
                iy = y + cy * ft / 1e5
                iw = cx * (1 - fl / 1e5 - frr / 1e5)
                ih = cy * (1 - ft / 1e5 - fb / 1e5)
                if 'flipH="true"' in attr:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT)
                if 'flipV="true"' in attr:
                    img = img.transpose(Image.FLIP_TOP_BOTTOM)
                pw, ph = max(1, round(iw * K)), max(1, round(ih * K))
                lapis = img.resize((pw, ph), Image.LANCZOS)
                alpha = re.search(r'<a:alphaModFix amt="(\d+)"', body)
                if alpha:
                    a = lapis.getchannel("A").point(lambda v: v * int(alpha.group(1)) / 1e5)
                    lapis.putalpha(a)
                # Klip kepada sempadan bentuk.
                bx0, by0 = round(x * K), round(y * K)
                bx1, by1 = round((x + cx) * K), round((y + cy) * K)
                px, py = round(ix * K), round(iy * K)
                kotak = (max(bx0, px, 0), max(by0, py, 0), min(bx1, px + pw, W), min(by1, py + ph, H))
                if kotak[2] <= kotak[0] or kotak[3] <= kotak[1]:
                    continue
                potong = lapis.crop((kotak[0] - px, kotak[1] - py, kotak[2] - px, kotak[3] - py))
                kanvas.paste(potong, kotak[:2], potong)
            elif "<p:txBody>" in body:
                para = []
                for p in re.findall(r"<a:p>(.*?)</a:p>", body, re.S):
                    runs = []
                    for rpr, t in re.findall(r"<a:r><a:rPr([^>]*)>.*?</a:rPr><a:t>(.*?)</a:t></a:r>", p, re.S):
                        warna = re.search(r'srgbClr val="(\w+)"', p)
                        font = re.search(r'latin typeface="([^"]+)"', p)
                        runs.append({
                            "t": t,
                            "pt": num(rpr, "sz") / 100,
                            "b": 'b="1"' in rpr,
                            "u": 'u="sng"' in rpr,
                            "warna": warna.group(1) if warna else "000000",
                            "font": font.group(1) if font else "",
                        })
                    algn = re.search(r'algn="(\w+)"', p)
                    lns = re.search(r'<a:lnSpc><a:spcPts val="(\d+)"', p)
                    para.append({"algn": algn.group(1) if algn else "l", "lnPt": num(lns.group(0), "val") / 100 if lns else None, "runs": runs})
                fonts = {r["font"] for pp in para for r in pp["runs"]}
                if fonts == {"Canva Sans"}:
                    continue  # nombor muka surat Canva
                teks.append({"x": round(x * K), "y": round(y * K), "w": round(cx * K), "h": round(cy * K), "para": para})
        kanvas.save(OUT / f"{n:02d}.jpg", quality=88, optimize=True, progressive=True)
        if teks:
            teks_semua[n] = teks
        print(n, "teks" if teks else "")
    (OUT / "teks.json").write_text(json.dumps(teks_semua, ensure_ascii=False, indent=1), encoding="utf8")


main()
