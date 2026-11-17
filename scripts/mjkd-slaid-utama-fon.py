"""MJKD — ekstrak fon terbenam (EOT .fntdata) daripada PPTX Canva yang sudah dinyahzip kepada TTF.

Guna: python -I -X utf8 scripts/mjkd-slaid-utama-fon.py <folder-pptx> <folder-fon>
(Dipanggil oleh scripts/mjkd-slaid-utama-pptx.ps1.)
"""
import re
import struct
import sys
from pathlib import Path
src, out = Path(sys.argv[1]), Path(sys.argv[2])
pres = (src / "ppt/presentation.xml").read_text(encoding="utf8")
rels = (src / "ppt/_rels/presentation.xml.rels").read_text(encoding="utf8")
peta = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="fonts/([^"]+)"', rels)) or {b: a for a, b in re.findall(r'Target="fonts/([^"]+)"[^>]*Id="(rId\d+)"', rels)}
for nama, rid in re.findall(r'<p:font typeface="([^"]+)"[^/]*/><p:regular r:id="(rId\d+)"', pres):
    f = src / "ppt/fonts" / peta[rid]
    b = f.read_bytes()
    eot, size, ver, flags = struct.unpack_from("<IIII", b, 0)
    data = b[len(b) - size:]
    if flags & 0x10000000:
        data = bytes(x ^ 0x50 for x in data)
    mtx = bool(flags & 0x4)
    sig = data[:4]
    ok = sig in (b"\x00\x01\x00\x00", b"OTTO", b"true")
    fn = out / (re.sub(r"[^\w]+", "-", nama) + (".otf" if sig == b"OTTO" else ".ttf"))
    if ok and not mtx:
        fn.write_bytes(data)
    print(f"{nama}: flags={flags:#x} mtx={mtx} sig={sig!r} -> {fn.name if ok and not mtx else 'GAGAL'}")
