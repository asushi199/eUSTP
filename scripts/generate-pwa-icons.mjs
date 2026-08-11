import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "public/nexa-logo.png");
const outDir = path.join(root, "public/icons");

async function fitOnCanvas(size, contentRatio) {
  const content = Math.round(size * contentRatio);
  const logo = await sharp(src)
    .resize(content, content, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).composite([{ input: logo, gravity: "centre" }]);
}

/** Bake rounded-square alpha so "any" icons read as rounded square, not circle. */
async function withRoundedSquare(size, contentRatio, radiusRatio = 0.18) {
  const radius = Math.round(size * radiusRatio);
  const svg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`,
  );

  const base = await fitOnCanvas(size, contentRatio).then((s) => s.png().toBuffer());
  return sharp(base)
    .composite([{ input: svg, blend: "dest-in" }])
    .png();
}

await withRoundedSquare(192, 0.86, 0.18).then((s) =>
  s.toFile(path.join(outDir, "icon-192.png")),
);
await withRoundedSquare(512, 0.86, 0.18).then((s) =>
  s.toFile(path.join(outDir, "icon-512.png")),
);
await withRoundedSquare(180, 0.86, 0.18).then((s) =>
  s.toFile(path.join(outDir, "apple-touch-icon.png")),
);

// maskable: full square + logo in ~72% safe zone (survives circle/squircle OS masks)
await fitOnCanvas(512, 0.72).then((s) =>
  s.png().toFile(path.join(outDir, "icon-512-maskable.png")),
);

console.log("PWA icons regenerated");
