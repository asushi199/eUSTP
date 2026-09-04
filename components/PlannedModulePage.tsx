import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";

export default function PlannedModulePage({
  eyebrow,
  title,
  description,
  accent,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  items: readonly string[];
}) {
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        accent={accent}
        description={description}
      />
      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="card flex items-center justify-between gap-3 p-4"
          >
            <span className="text-sm font-medium text-ink">{item}</span>
            <span className="status-badge shrink-0">Akan datang</span>
          </li>
        ))}
      </ul>
    </PublicPageShell>
  );
}
