"""MJKD 2026 — komposit setiap slaid PPTX (eksport Canva) kepada JPG 1920x1080 + dump teks (JSON).

Guna bila slaid utama Canva berubah: (1) ekstrak PPTX ke folder (tanpa perlu video),
(2) python -I scripts/mjkd-slaid-utama.py <folder-ekstrak> <folder-keluar>,
(3) salin JPG yang berubah ke public/mjkd/slaid-utama/ dan kemas kini HALAMAN_UTAMA dalam
lib/mjkd/slaid-utama.ts (teks agenda = teks.json; halaman agenda guna latar-agenda.jpg).
Video lagu: ffmpeg -i <media.mp4> -vf fps=30 -c:v libx264 -preset slow -crf 26 -maxrate 2200k
-bufsize 4400k -c:a aac -b:a 160k -movflags +faststart public/mjkd/slaid-utama/lagu.mp4

Kumpulan (<p:grpSp>) dijelmakan ikut off/ext/chOff/chExt — Canva meletakkan baris logo dalam
kumpulan; tanpa jelmaan ini logo terlukis di penjuru kiri atas.
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
W_EMU = 18288000
W, H = 1920, 1080
K = W / W_EMU

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
R_EMBED = f"{{{NS['r']}}}embed"


def rels(n):
    x = (SRC / f"ppt/slides/_rels/slide{n}.xml.rels").read_text(encoding="utf8")
    return {m[0]: m[1] for m in re.findall(r'Id="(\w+)" Target="\.\./media/([^"]+)"', x)}


def num(el, k, d=0):
    return int(el.get(k, d)) if el is not None else d


class Jelmaan:
    """Peta koordinat anak kumpulan -> koordinat slaid (EMU)."""

    def __init__(self, induk=None, xfrm=None):
        self.induk = induk
        if xfrm is None:
            self.ox = self.oy = self.cox = self.coy = 0
            self.sx = self.sy = 1.0
            return
        off, ext = xfrm.find("a:off", NS), xfrm.find("a:ext", NS)
        choff, chext = xfrm.find("a:chOff", NS), xfrm.find("a:chExt", NS)
        self.ox, self.oy = num(off, "x"), num(off, "y")
        self.cox, self.coy = num(choff, "x"), num(choff, "y")
        cx, cy = num(ext, "cx"), num(ext, "cy")
        ccx, ccy = num(chext, "cx", cx), num(chext, "cy", cy)
        self.sx = cx / ccx if ccx else 1.0
        self.sy = cy / ccy if ccy else 1.0

    def titik(self, x, y):
        x, y = self.ox + (x - self.cox) * self.sx, self.oy + (y - self.coy) * self.sy
        return self.induk.titik(x, y) if self.induk else (x, y)

    def saiz(self, cx, cy):
        cx, cy = cx * self.sx, cy * self.sy
        return self.induk.saiz(cx, cy) if self.induk else (cx, cy)


def lukis_gambar(kanvas, el, xfrm, jel, r, n):
    blip = el.find(".//a:blip", NS)
    if blip is None or el.find(".//a:videoFile", NS) is not None:
        return
    if num(xfrm, "rot"):
        print(f"slaid {n}: AMARAN rot={xfrm.get('rot')}", file=sys.stderr)
    off, ext = xfrm.find("a:off", NS), xfrm.find("a:ext", NS)
    x, y = jel.titik(num(off, "x"), num(off, "y"))
    cx, cy = jel.saiz(num(ext, "cx"), num(ext, "cy"))
    img = Image.open(SRC / "ppt/media" / r[blip.get(R_EMBED)]).convert("RGBA")
    src = el.find(".//a:srcRect", NS)
    if src is not None:
        sl, st, sr, sb = (num(src, k) for k in "ltrb")
        iw, ih = img.size
        img = img.crop((iw * sl / 1e5, ih * st / 1e5, iw * (1 - sr / 1e5), ih * (1 - sb / 1e5)))
    fr = el.find(".//a:fillRect", NS)
    fl, ft, frr, fb = (num(fr, k) for k in "ltrb") if fr is not None else (0, 0, 0, 0)
    ix, iy = x + cx * fl / 1e5, y + cy * ft / 1e5
    iw, ih = cx * (1 - fl / 1e5 - frr / 1e5), cy * (1 - ft / 1e5 - fb / 1e5)
    if xfrm.get("flipH") in ("1", "true"):
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    if xfrm.get("flipV") in ("1", "true"):
        img = img.transpose(Image.FLIP_TOP_BOTTOM)
    pw, ph = max(1, round(iw * K)), max(1, round(ih * K))
    lapis = img.resize((pw, ph), Image.LANCZOS)
    alpha = el.find(".//a:alphaModFix", NS)
    if alpha is not None:
        amt = num(alpha, "amt", 100000)
        lapis.putalpha(lapis.getchannel("A").point(lambda v: v * amt / 1e5))
    # Klip kepada sempadan bentuk.
    bx0, by0 = round(x * K), round(y * K)
    bx1, by1 = round((x + cx) * K), round((y + cy) * K)
    px, py = round(ix * K), round(iy * K)
    kotak = (max(bx0, px, 0), max(by0, py, 0), min(bx1, px + pw, W), min(by1, py + ph, H))
    if kotak[2] <= kotak[0] or kotak[3] <= kotak[1]:
        return
    potong = lapis.crop((kotak[0] - px, kotak[1] - py, kotak[2] - px, kotak[3] - py))
    kanvas.paste(potong, kotak[:2], potong)


def baca_teks(el, xfrm, jel):
    para = []
    for p in el.findall(".//a:p", NS):
        runs = []
        for run in p.findall("a:r", NS):
            rpr = run.find("a:rPr", NS)
            warna = run.find(".//a:srgbClr", NS)
            font = run.find(".//a:latin", NS)
            runs.append({
                "t": run.findtext("a:t", "", NS),
                "pt": num(rpr, "sz") / 100,
                "b": rpr is not None and rpr.get("b") in ("1", "true"),
                "u": rpr is not None and rpr.get("u") == "sng",
                "warna": warna.get("val") if warna is not None else "000000",
                "font": font.get("typeface") if font is not None else "",
            })
        ppr = p.find("a:pPr", NS)
        lns = p.find("a:pPr/a:lnSpc/a:spcPts", NS)
        para.append({
            "algn": ppr.get("algn", "l") if ppr is not None else "l",
            "lnPt": num(lns, "val") / 100 if lns is not None else None,
            "runs": runs,
        })
    fonts = {r["font"] for pp in para for r in pp["runs"]}
    if not fonts or fonts == {"Canva Sans"}:
        return None  # kosong / nombor muka surat Canva
    off, ext = xfrm.find("a:off", NS), xfrm.find("a:ext", NS)
    x, y = jel.titik(num(off, "x"), num(off, "y"))
    cx, cy = jel.saiz(num(ext, "cx"), num(ext, "cy"))
    return {"x": round(x * K), "y": round(y * K), "w": round(cx * K), "h": round(cy * K), "para": para}


def jalan(induk, kanvas, jel, r, n, teks):
    for el in induk:
        tag = el.tag.split("}")[1]
        if tag == "grpSp":
            xfrm = el.find("p:grpSpPr/a:xfrm", NS)
            jalan(el, kanvas, Jelmaan(jel, xfrm), r, n, teks)
        elif tag in ("sp", "pic"):
            xfrm = el.find("p:spPr/a:xfrm", NS)
            if xfrm is None:
                continue
            if el.find("p:txBody", NS) is not None:
                t = baca_teks(el, xfrm, jel)
                if t:
                    teks.append(t)
            else:
                lukis_gambar(kanvas, el, xfrm, jel, r, n)


def main():
    pres = (SRC / "ppt/presentation.xml").read_text(encoding="utf8")
    n_slaid = len(re.findall(r"<p:sldId ", pres))
    teks_semua = {}
    for n in range(1, n_slaid + 1):
        akar = ET.parse(SRC / f"ppt/slides/slide{n}.xml").getroot()
        kanvas = Image.new("RGB", (W, H), "white")
        teks = []
        jalan(akar.find("p:cSld/p:spTree", NS), kanvas, Jelmaan(), rels(n), n, teks)
        kanvas.save(OUT / f"{n:02d}.jpg", quality=88, optimize=True, progressive=True)
        if teks:
            teks_semua[n] = teks
        print(n, "teks" if teks else "")
    (OUT / "teks.json").write_text(json.dumps(teks_semua, ensure_ascii=False, indent=1), encoding="utf8")


main()
