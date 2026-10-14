import assert from "node:assert/strict";
import test from "node:test";
import {
  MESEJ_PENGHANTARAN_TIDAK_PASTI,
  isRalatTimeoutDb,
  pautanMuatSemula,
} from "../../lib/mjkd/ralat-db";

test("isRalatTimeoutDb: mengenali ralat withDbTimeout sahaja", () => {
  assert.equal(isRalatTimeoutDb(new Error("Pangkalan data tidak bertindak balas dalam 8000ms")), true);
  assert.equal(isRalatTimeoutDb(new Error("duplicate key value")), false);
  assert.equal(isRalatTimeoutDb("Pangkalan data tidak bertindak balas"), false);
  assert.equal(isRalatTimeoutDb(null), false);
});

test("pautanMuatSemula: kekalkan parameter carian, abaikan kosong", () => {
  assert.equal(pautanMuatSemula("/laporan-mjkd"), "/laporan-mjkd");
  assert.equal(
    pautanMuatSemula("/laporan-mjkd", { kod: "ABA1001", resit: "A1B2", kemaskini: "1", kosong: "" }),
    "/laporan-mjkd?kod=ABA1001&resit=A1B2&kemaskini=1",
  );
  assert.equal(pautanMuatSemula("/x", { a: ["1", "2"], b: undefined }), "/x?a=1&a=2");
  assert.equal(pautanMuatSemula("/x", { kod: "A B&C" }), "/x?kod=A+B%26C");
});

test("mesej penghantaran tidak pasti menyebut nombor tiket dan urusetia", () => {
  assert.match(MESEJ_PENGHANTARAN_TIDAK_PASTI, /tidak pasti/);
  assert.match(MESEJ_PENGHANTARAN_TIDAK_PASTI, /nombor tiket/);
  assert.match(MESEJ_PENGHANTARAN_TIDAK_PASTI, /urusetia MJKD/);
});
