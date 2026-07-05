import { PRESET_AMENITIES, customAmenities } from "@/lib/tempahan/amenities";
import AmenityIcon from "./AmenityIcon";

export default function AmenityFields({ selected }: { selected?: string[] }) {
  const chosen = new Set(selected ?? []);

  return (
    <fieldset className="space-y-3">
      <legend className="label mb-2 block font-semibold">Kemudahan dalam bilik</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PRESET_AMENITIES.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm hover:bg-cloud/60"
          >
            <input
              type="checkbox"
              name="amenities"
              value={item.key}
              defaultChecked={chosen.has(item.key)}
              className="h-4 w-4 rounded border-steel text-primary"
            />
            <AmenityIcon name={item.key} />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      <div>
        <label className="label">Kemudahan lain (satu baris satu / pisah dengan koma)</label>
        <textarea
          name="amenities_custom"
          className="input min-h-[72px]"
          rows={3}
          placeholder="Contoh: Pemanas air, Pantri, Surau berdekatan"
          defaultValue={customAmenities(selected ?? []).join("\n")}
        />
      </div>
    </fieldset>
  );
}
