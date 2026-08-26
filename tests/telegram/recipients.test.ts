import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTelegramResponsibleOption,
  getVisibleTelegramRecipientPkgs,
  parseTelegramResponsibleUserId,
  resolveTelegramRecipientChatIds,
} from "../../lib/telegram/recipients";

test("uses the configured PKG responsible person instead of legacy PKG recipients", () => {
  assert.deepEqual(
    resolveTelegramRecipientChatIds("configured-chat", ["legacy-a", "legacy-b"]),
    ["configured-chat"],
  );
});

test("keeps legacy PKG recipients when no responsible person is configured", () => {
  assert.deepEqual(
    resolveTelegramRecipientChatIds(null, ["legacy-a", "legacy-a", "legacy-b"]),
    ["legacy-a", "legacy-b"],
  );
});

test("parses a Telegram responsible user id or empty selection", () => {
  assert.deepEqual(parseTelegramResponsibleUserId(""), { ok: true, userId: null });
  assert.deepEqual(parseTelegramResponsibleUserId("12"), { ok: true, userId: 12 });
  assert.deepEqual(parseTelegramResponsibleUserId("0"), { ok: false });
  assert.deepEqual(parseTelegramResponsibleUserId("abc"), { ok: false });
});

test("labels unbound Telegram users without showing English aliases", () => {
  assert.equal(
    formatTelegramResponsibleOption({
      id: 1,
      nama: "Ahmad",
      jawatan: "Penyelia PKG",
      peranan: "PKG_Admin",
      telegramBoundAt: null,
    }),
    "Ahmad — Penyelia PKG (Telegram belum disambungkan)",
  );
  assert.equal(
    formatTelegramResponsibleOption({
      id: 2,
      nama: "Siti",
      jawatan: "",
      peranan: "Admin",
      telegramBoundAt: new Date("2026-08-26T01:00:00Z"),
    }),
    "Siti — Admin",
  );
});

test("PKG_Admin only sees their own PKG recipient settings", () => {
  const pkgs = [
    { id: "sitiawan" },
    { id: "beruas" },
  ];
  assert.deepEqual(getVisibleTelegramRecipientPkgs(pkgs, "Admin", null), pkgs);
  assert.deepEqual(getVisibleTelegramRecipientPkgs(pkgs, "PKG_Admin", "beruas"), [
    { id: "beruas" },
  ]);
  assert.deepEqual(getVisibleTelegramRecipientPkgs(pkgs, "PKG_Admin", null), []);
});
