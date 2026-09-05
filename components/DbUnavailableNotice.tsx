/** Papar bila query DB gagal/timeout — elak halaman tergantung, papar notis jujur. */
export default function DbUnavailableNotice() {
  return (
    <div className="card mt-8 p-4 text-sm text-graphite">
      Kandungan tidak dapat dimuatkan buat masa ini. Sila muat semula halaman
      sebentar lagi.
    </div>
  );
}
