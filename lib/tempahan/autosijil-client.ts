import "server-only";

export type AutosijilCreateEventInput = {
  externalBookingId: string;
  title: string;
  eventDate: string | null;
  location: string | null;
  requiresCertificate: boolean;
  description: string | null;
  pkgId: string;
  slot: string;
};

export type AutosijilCreateEventResult = {
  eventId: string;
  slug: string;
  publicUrl: string;
  adminUrl: string;
};

function autosijilConfig() {
  const baseUrl = (process.env.AUTOSIJIL_BASE_URL ?? "").replace(/\/$/, "");
  const secret = process.env.AUTOSIJIL_INTEGRATION_SECRET ?? "";
  return { baseUrl, secret };
}

export function isAutosijilConfigured() {
  const { baseUrl, secret } = autosijilConfig();
  return Boolean(baseUrl && secret);
}

async function autosijilFetch(path: string, body: unknown) {
  const { baseUrl, secret } = autosijilConfig();
  if (!baseUrl || !secret) {
    throw new Error("AUTOSIJIL_BASE_URL / AUTOSIJIL_INTEGRATION_SECRET belum ditetapkan.");
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const errMsg =
      json && typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : text || `HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  return json;
}

export async function createAutosijilEvent(
  input: AutosijilCreateEventInput,
): Promise<AutosijilCreateEventResult> {
  const json = (await autosijilFetch("/api/integrations/eustp/events", input)) as
    | AutosijilCreateEventResult
    | null;

  if (
    !json?.eventId ||
    !json.slug ||
    !json.publicUrl ||
    !json.adminUrl
  ) {
    throw new Error("Respons Autosijil tidak lengkap.");
  }

  return json;
}

export async function cancelAutosijilEvent(externalBookingId: string): Promise<void> {
  await autosijilFetch("/api/integrations/eustp/events/cancel", { externalBookingId });
}
