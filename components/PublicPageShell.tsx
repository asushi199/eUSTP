import { cn } from "@/lib/cn";

type PublicPageShellProps = {
  children: React.ReactNode;
  narrow?: boolean;
  className?: string;
};

export default function PublicPageShell({
  children,
  narrow = false,
  className,
}: PublicPageShellProps) {
  return (
    <div
      className={cn(
        "portal-page-enter mx-auto w-full max-w-full px-4 py-10 sm:px-8 sm:py-12",
        narrow ? "max-w-3xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
