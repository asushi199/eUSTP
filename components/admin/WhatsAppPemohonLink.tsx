export default function WhatsAppPemohonLink({
  href,
  className = "btn-outline-ink btn-sm",
}: {
  href: string;
  className?: string;
}) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      WhatsApp pemohon
    </a>
  );
}
