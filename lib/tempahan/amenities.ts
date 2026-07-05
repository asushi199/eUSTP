/** Senarai kemudahan pratetap — sumber tunggal untuk borang admin & paparan awam. */

export type AmenityDef = { key: string; label: string };

export const PRESET_AMENITIES: AmenityDef[] = [
  { key: "aircond", label: "Penyaman udara" },
  { key: "projector", label: "Projektor" },
  { key: "smartboard", label: "Smartboard" },
  { key: "whiteboard", label: "Papan putih" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "audio", label: "Sistem audio" },
  { key: "microphone", label: "Mikrofon" },
  { key: "chairs", label: "Kerusi" },
  { key: "tables", label: "Meja" },
  { key: "tv", label: "TV / Skrin" },
  { key: "green_screen", label: "Skrin hijau (kroma)" },
  { key: "studio_light", label: "Lampu studio" },
  { key: "camera", label: "Kamera" },
  { key: "teleprompter", label: "Teleprompter" },
];

const PRESET_BY_KEY = new Map(PRESET_AMENITIES.map((item) => [item.key, item]));
const PRESET_KEYS = new Set(PRESET_AMENITIES.map((item) => item.key));

export type ResolvedAmenity = { key: string; label: string };

export function resolveAmenities(values: string[]): ResolvedAmenity[] {
  return values.map((value) => {
    const preset = PRESET_BY_KEY.get(value);
    if (preset) return { key: preset.key, label: preset.label };
    return { key: "", label: value };
  });
}

export function customAmenities(values: string[]): string[] {
  return values.filter((value) => !PRESET_KEYS.has(value));
}

export function isPresetAmenity(value: string): boolean {
  return PRESET_KEYS.has(value);
}

const CARD_TEXT_PRIORITY = ["aircond", "wifi", "projector", "smartboard", "tv", "green_screen"];

function textRank(item: ResolvedAmenity, index: number): number {
  const p = CARD_TEXT_PRIORITY.indexOf(item.key);
  if (p !== -1) return p;
  if (item.key === "") return 50 + index;
  return 100 + index;
}

export type AmenityCardLayout = {
  textChips: ResolvedAmenity[];
  iconChips: ResolvedAmenity[];
  extraCount: number;
};

export function amenityCardLayout(
  values: string[],
  textCount = 3,
  iconCount = 6,
): AmenityCardLayout {
  const resolved = resolveAmenities(values);

  const textChips = resolved
    .map((item, index) => ({ item, index }))
    .sort((a, b) => textRank(a.item, a.index) - textRank(b.item, b.index))
    .slice(0, textCount)
    .map((entry) => entry.item);

  const rest = resolved.filter((item) => !textChips.includes(item));
  const iconChips = rest.slice(0, iconCount);
  const extraCount = Math.max(rest.length - iconCount, 0);

  return { textChips, iconChips, extraCount };
}
