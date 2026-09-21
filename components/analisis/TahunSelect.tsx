"use client";

export default function TahunSelect({
  year,
  years,
  onChange,
}: {
  year: number;
  years: number[];
  onChange: (year: number) => void;
}) {
  const options = years.length > 0 ? years : [year];
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-graphite">
      <span>Tahun</span>
      <select
        className="input h-9 w-[5.75rem] px-2 py-0 text-sm"
        value={year}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Pilih tahun"
      >
        {options.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
