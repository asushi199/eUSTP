export default function WhatsAppPemohonLink({
  href,
  className = "btn-outline-ink btn-sm",
  onClick,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      WhatsApp pemohon
    </a>
  );
}
