<#
MJKD 2026 — eksport slaid utama Canva (PPTX) kepada imej penuh 1920x1080 untuk mod pembentangan.

Canva membenam fon dalam PPTX (EOT .fntdata) yang PowerPoint tidak guna; skrip ini mengekstrak fon
itu, memuatkannya SEMENTARA (AddFontResource — hilang selepas log keluar, tiada pemasangan), membuang
kotak nombor halaman Canva, lalu mengeksport setiap slaid melalui PowerPoint (perlu Office).

Guna (PowerShell):
  ./scripts/mjkd-slaid-utama-pptx.ps1 -Pptx "C:\...\SLIDE UTAMA MJKD.pptx" -Kerja "C:\temp\mjkd"
Hasil: <Kerja>\jpg\slaid-utama\NNN.jpg + <Kerja>\jpg\peta.json. Salin JPG ke
public/mjkd/slaid-utama/ dan kemas kini HALAMAN_UTAMA (lib/mjkd/slaid-utama.ts) ikut peta.json.
Video lagu (halaman 2) diproses berasingan (lihat scripts/mjkd-slaid-utama.py).
#>
param([Parameter(Mandatory)] [string]$Pptx, [Parameter(Mandatory)] [string]$Kerja)
$ErrorActionPreference = "Stop"
$akar = Split-Path $PSScriptRoot -Parent
$zip = Join-Path $Kerja "pptx"; $fon = Join-Path $Kerja "fon"; $png = Join-Path $Kerja "png"
New-Item -ItemType Directory -Force $zip, $fon, $png | Out-Null
Copy-Item $Pptx (Join-Path $Kerja "salinan.zip") -Force
Expand-Archive (Join-Path $Kerja "salinan.zip") $zip -Force
python -I -X utf8 (Join-Path $akar "scripts/mjkd-slaid-utama-fon.py") $zip $fon

Add-Type -Namespace MjkdFon -Name F -MemberDefinition @'
[DllImport("gdi32.dll", CharSet=CharSet.Unicode)] public static extern int AddFontResourceW(string f);
'@
Get-ChildItem $fon -Filter *.ttf | ForEach-Object { [void][MjkdFon.F]::AddFontResourceW($_.FullName) }

$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open((Resolve-Path $Pptx).Path, -1, 0, 0)  # baca sahaja, tiada tetingkap
  for ($n = 1; $n -le $pres.Slides.Count; $n++) {
    $sl = $pres.Slides.Item($n)
    for ($i = $sl.Shapes.Count; $i -ge 1; $i--) {
      $sh = $sl.Shapes.Item($i)
      # Nombor halaman Canva = kotak teks yang hanya mengandungi nombor slaid itu.
      if ($sh.HasTextFrame -and $sh.TextFrame.HasText -and $sh.TextFrame.TextRange.Text.Trim() -eq "$n") { $sh.Delete() }
    }
    $sl.Export((Join-Path $png ("{0:d3}.png" -f $n)), "PNG", 1920, 1080)
  }
  $pres.Close()
} finally { $app.Quit() }
python -I -X utf8 (Join-Path $akar "scripts/mjkd-slaid-utama-jpg.py") $png (Join-Path $Kerja "jpg/slaid-utama")
