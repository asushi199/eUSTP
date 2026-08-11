import assert from "node:assert/strict";
import test from "node:test";
import {
  buildKewPa9SignatureDetails,
  getReturnNoteBox,
  getReturnNoteBoxHeight,
} from "../../lib/peralatan/kew-pa9";

test("sizes the KEW.PA-9 return-note overlay to its wrapped text", () => {
  const oneLine = getReturnNoteBoxHeight(1);
  const twoLines = getReturnNoteBoxHeight(2);
  const fullGrid = getReturnNoteBoxHeight(999);

  assert.equal(oneLine, 17.16);
  assert.equal(twoLines, 34.32);
  assert.equal(fullGrid, 343.2);
  assert.ok(oneLine < fullGrid);
});

test("fills the Catatan cell interior without drawing through the return note", () => {
  assert.deepEqual(getReturnNoteBox(5), {
    left: 510.48,
    top: 241.13,
    width: 51.96,
    height: 50.88,
  });
});

test("uses the return receiver snapshot instead of the handover issuer", () => {
  assert.deepEqual(
    buildKewPa9SignatureDetails({
      applicantName: "Nur Aisyah Binti Ali",
      applicantPosition: "Guru",
      borrowDate: "2026-08-05",
      approverName: "Ahmad Bin Salleh",
      approverPosition: "Pegawai Pendidikan Daerah",
      approvedAt: new Date("2026-08-03T09:00:00+08:00"),
      receiverName: "Puan Pengurus PKG",
      receiverPosition: "Penolong Pegawai Pendidikan Daerah",
      returnedAt: new Date("2026-08-11T15:00:00+08:00"),
    }),
    {
      borrower: {
        name: "Nur Aisyah Binti Ali",
        position: "Guru",
        date: "05/08/2026",
      },
      approver: {
        name: "Ahmad Bin Salleh",
        position: "Pegawai Pendidikan Daerah",
        date: "03/08/2026",
      },
      returner: {
        name: "Nur Aisyah Binti Ali",
        position: "Guru",
        date: "11/08/2026",
      },
      receiver: {
        name: "Puan Pengurus PKG",
        position: "Penolong Pegawai Pendidikan Daerah",
        date: "11/08/2026",
      },
    },
  );
});
