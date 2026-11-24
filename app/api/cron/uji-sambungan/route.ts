import { NextResponse } from "next/server";
import { connect } from "node:net";
import { request as httpsRequest } from "node:https";

/**
 * SEMENTARA — ujian sekali: adakah fungsi Vercel (sin1) boleh mencapai halaman log masuk
 * esn.moe.edu.my dan dcs.moe.edu.my? Tiada log masuk, tiada data dihantar. Dibuang selepas ujian.
 * Dilindungi `CRON_SECRET` (Authorization: Bearer …).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const HAD_MS = 15_000;

function ujiTcp(host: string, port: number): Promise<string> {
  const mula = Date.now();
  return new Promise((resolve) => {
    const s = connect({ host, port });
    const tamat = (hasil: string) => {
      s.destroy();
      resolve(`${hasil} (${Date.now() - mula} ms)`);
    };
    s.setTimeout(HAD_MS, () => tamat("tamat masa"));
    s.once("connect", () => tamat(`bersambung ke ${s.remoteAddress}`));
    s.once("error", (e) => tamat(`ralat ${(e as NodeJS.ErrnoException).code ?? e.message}`));
  });
}

const teks = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);

async function ujiDcs(): Promise<string> {
  const mula = Date.now();
  try {
    const r = await fetch("http://dcs.moe.edu.my/login", { signal: AbortSignal.timeout(HAD_MS), cache: "no-store" });
    return `HTTP ${r.status} (${Date.now() - mula} ms): ${teks(await r.text())}`;
  } catch (e) {
    const c = (e as { cause?: { code?: string } }).cause?.code;
    return `gagal (${Date.now() - mula} ms): ${c ?? (e as Error).message}`;
  }
}

/** ESN: rantai sijil tidak lengkap, jadi semakan sijil dimatikan untuk ujian capaian ini sahaja. */
function ujiEsn(): Promise<string> {
  const mula = Date.now();
  return new Promise((resolve) => {
    const req = httpsRequest(
      { host: "esn.moe.edu.my", path: "/admin/login", method: "GET", rejectUnauthorized: false, timeout: HAD_MS },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (d: string) => { if (body.length < 20_000) body += d; });
        res.on("end", () => resolve(`HTTP ${res.statusCode} (${Date.now() - mula} ms): ${teks(body)}`));
      },
    );
    req.on("timeout", () => req.destroy(new Error("tamat masa")));
    req.on("error", (e) => resolve(`gagal (${Date.now() - mula} ms): ${(e as NodeJS.ErrnoException).code ?? e.message}`));
    req.end();
  });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const [tcpDcs, tcpEsn, dcs, esn] = await Promise.all([
    ujiTcp("dcs.moe.edu.my", 80),
    ujiTcp("esn.moe.edu.my", 443),
    ujiDcs(),
    ujiEsn(),
  ]);
  return NextResponse.json({ region: process.env.VERCEL_REGION ?? "tempatan", tcpDcs, tcpEsn, dcs, esn });
}
