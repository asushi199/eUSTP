import Image from "next/image";

export function HomeWelcomeBanner() {
  return (
    <div className="portal-welcome-banner">
      <div className="portal-welcome-photo" aria-hidden>
        <Image
          src="/ppd-manjung-banner.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 55vw, 100vw"
          className="object-cover object-[72%_48%]"
        />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14 lg:py-16">
        <p className="text-sm font-medium text-graphite sm:text-base">Assalamualaikum,</p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[2.6rem]">
          Selamat datang ke{" "}
          <span className="text-primary">NEXa</span>
          <span className="mt-1 block text-2xl font-medium text-ink sm:text-3xl">
            by USTP Manjung
          </span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-graphite sm:text-base">
          Satu platform, semua sumber, bersama menuju kecemerlangan.
        </p>
      </div>
    </div>
  );
}
