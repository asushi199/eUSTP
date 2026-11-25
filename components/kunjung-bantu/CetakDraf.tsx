"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ButangCetak from "@/components/kunjung-bantu/ButangCetak";
import CetakInstrumen from "@/components/kunjung-bantu/CetakInstrumen";
import { bacaCetakDraf, type CetakDrafData } from "@/lib/kunjung-bantu/cetak-draf";

/** Cetakan draf daripada keadaan borang dalam peranti ini (localStorage). */
export default function CetakDraf() {
  // undefined = belum dibaca (elak beza SSR/klien).
  const [data, setData] = useState<CetakDrafData | null | undefined>(undefined);

  useEffect(() => {
    setData(bacaCetakDraf());
  }, []);

  if (data === undefined) return null;

  return (
    <>
      <div className="no-print mx-auto mb-6 flex max-w-[190mm] flex-wrap items-center justify-between gap-3">
        <Link href={data?.kembali ?? "/laporan-kunjung-bantu"} className="text-sm text-graphite hover:text-ink">
          ← Kembali ke borang
        </Link>
        {data ? <ButangCetak label="Cetak draf / simpan PDF" /> : null}
      </div>
      {data ? (
        <CetakInstrumen
          sekolah={data.sekolah}
          delima={data.delima}
          rekod={{
            draf: true,
            dicetak: new Date(data.dicetak),
            ...data.maklumat,
            jawapan: data.jawapan,
            semakan: data.semakan,
            isu: "",
            ulasanPegawai: "",
            namaPegawai: "",
            jawatanPegawai: "",
            tarikhPenilaian: null,
            disahkanPada: null,
          }}
        />
      ) : (
        <p className="mx-auto max-w-[190mm] text-sm text-graphite">
          Tiada draf untuk dicetak dalam peranti ini. Buka borang Kunjung Bantu DELIMa, pilih sekolah,
          kemudian tekan <b>Cetak draf</b>.
        </p>
      )}
    </>
  );
}
