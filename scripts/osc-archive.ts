/** Peraturan persaraan OSC → Resources / Media. Diguna oleh seed-dashboard. */

export type OscDest = "arkib" | "nota" | "media" | "drop";

export type OscArchiveCard = {
  dest: OscDest;
  title: string;
  url: string;
  letterMonth: string;
};

const DROP_URL = /lookerstudio\.google\.com|ruangilmu\.moe-dl|classroom\.google|accounts\.google\.com|rakmaya\.com|artsteps\.com/i;

function yearMonthFromTitle(title: string, fallback = "2025"): string {
  const match = title.match(/20\d{2}/);
  return `${match?.[0] ?? fallback}-01`;
}

function prefixed(prefix: string, title: string): string {
  const needle = `${prefix} · `;
  return title.startsWith(needle) ? title : `${needle}${title}`;
}

export function classifyOscCard(input: {
  subtopikKey: string;
  title: string;
  url: string;
  type: string;
}): OscArchiveCard {
  const title = input.title.trim();
  const url = input.url.trim();
  const key = input.subtopikKey;
  const type = input.type;

  if (
    DROP_URL.test(url) ||
    type === "embed" ||
    key === "slot-bahan-delima" ||
    key === "slot-bahan-digital" ||
    key === "slot-classroom"
  ) {
    return { dest: "drop", title, url, letterMonth: "" };
  }

  if (
    key === "slot-impak" ||
    key === "slot-hari-terbuka" ||
    key === "slot-karnival" ||
    key === "slot-pameran" ||
    (key === "slot-pencapaian" && !/^kertas kerja/i.test(title))
  ) {
    return {
      dest: "media",
      title,
      url,
      letterMonth: yearMonthFromTitle(title),
    };
  }

  if (key === "slot-buku" || key === "slot-dasar") {
    return {
      dest: "nota",
      title,
      url,
      letterMonth: yearMonthFromTitle(title),
    };
  }

  let nextTitle = title;
  if (key === "slot-opr") {
    nextTitle = prefixed("OPR", title);
  } else if (/^epelaporan/i.test(title)) {
    const year = title.match(/20\d{2}/)?.[0];
    nextTitle = year ? `ePelaporan · ${year}` : prefixed("ePelaporan", title);
  } else if (key === "slot-kertas-kerja" || /^kertas kerja/i.test(title)) {
    nextTitle = prefixed("Kertas kerja", title);
  } else if (key === "slot-laporan") {
    nextTitle = prefixed("Laporan", title);
  } else if (key === "slot-jnj") {
    nextTitle = /^jnj\b/i.test(title) ? title.replace(/^jnj\s+/i, "JNJ · ") : prefixed("JNJ", title);
  }

  return {
    dest: "arkib",
    title: nextTitle,
    url,
    letterMonth: key === "slot-opr" ? "2025-01" : yearMonthFromTitle(title),
  };
}
