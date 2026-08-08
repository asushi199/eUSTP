import Image from "next/image";

export function HeroVisual() {
  return (
    <div className="portal-hero-visual" aria-hidden="true">
      <div className="portal-orbit portal-orbit-outer">
        <i />
        <i />
        <i />
      </div>
      <div className="portal-orbit portal-orbit-inner">
        <i />
        <i />
      </div>
      <div className="portal-logo-core">
        <span className="portal-logo-halo" />
        <Image
          src="/ustp-logo.png"
          alt=""
          width={220}
          height={220}
          priority
          className="h-auto w-[88%]"
        />
      </div>
      <span className="portal-stat-pill portal-stat-pill-one">
        <strong>07 MODUL</strong>
        TERPUSAT
      </span>
      <span className="portal-stat-pill portal-stat-pill-two">
        <strong>AKSES</strong>
        PANTAS
      </span>
    </div>
  );
}
